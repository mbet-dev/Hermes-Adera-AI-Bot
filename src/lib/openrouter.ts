/**
 * OpenRouter API client: uses only the 3 configured free models with their own API keys.
 * Tries models in order; on 429/402 or error, tries the next until one succeeds.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const VISION_MODEL = 'meta-llama/llama-3.2-90b-vision-instruct:free';

export type OpenRouterMessage =
  | { role: string; content: string }
  | { role: string; content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> };

export interface OpenRouterChatOptions {
  max_tokens?: number;
}

interface ModelConfig {
  model: string;
  apiKey: string;
}

/** Build ordered list of free models from env (OPENROUTER_MODEL_1, OPENROUTER_KEY_1, ... _2, _3). */
function getFreeModels(): ModelConfig[] {
  const list: ModelConfig[] = [];
  for (let i = 1; i <= 3; i++) {
    const model = process.env[`OPENROUTER_MODEL_${i}`]?.trim();
    const apiKey = process.env[`OPENROUTER_KEY_${i}`]?.trim();
    if (model && apiKey) list.push({ model, apiKey });
  }
  if (list.length === 0) {
    throw new Error(
      'No OpenRouter models configured. Set OPENROUTER_MODEL_1 and OPENROUTER_KEY_1 (and optionally _2, _3) in .env.local. See .env.example.'
    );
  }
  return list;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RATE_LIMIT_RETRIES = 1;
const RATE_LIMIT_DELAY_MS = 2500;

/**
 * Call OpenRouter chat completions. Uses only the 3 free models (with their keys) in order.
 * On 429 or 402, retries once then tries the next model.
 */
export async function openRouterChat(
  messages: OpenRouterMessage[],
  options: OpenRouterChatOptions = {}
): Promise<string> {
  const models = getFreeModels();
  const maxTokens = options.max_tokens ?? 2048;

  const tryOne = async (model: string, apiKey: string): Promise<{ ok: boolean; res: Response; errText: string }> => {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://adera.example.com',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.2,
      }),
    });
    const errText = res.ok ? '' : await res.text();
    return { ok: res.ok, res, errText };
  };

  let lastRes: Response | null = null;
  let lastErrText = '';

  for (const { model, apiKey } of models) {
    for (let attempt = 0; attempt <= RATE_LIMIT_RETRIES; attempt++) {
      if (attempt > 0) await sleep(RATE_LIMIT_DELAY_MS);
      const { ok, res, errText } = await tryOne(model, apiKey);
      lastRes = res;
      lastErrText = errText;

      if (ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content;
        return text?.trim() || "Sorry, I couldn't generate a response.";
      }

      const isRetryable = res.status === 429 || res.status === 402;
      if (!isRetryable || attempt === RATE_LIMIT_RETRIES) break;
    }
    if (lastRes?.status && lastRes.status !== 429 && lastRes.status !== 402) break;
    await sleep(800);
  }

  const err = new Error(`OpenRouter API error ${lastRes!.status}: ${lastErrText}`) as Error & { status?: number };
  err.status = lastRes!.status;
  throw err;
}

/**
 * Vision: use first configured model's key; model from OPENROUTER_VISION_MODEL or default.
 */
export async function openRouterVision(
  prompt: string,
  imageDataUrl: string,
  options: { max_tokens?: number } = {}
): Promise<string> {
  const models = getFreeModels();
  const { apiKey } = models[0];
  const model = process.env.OPENROUTER_VISION_MODEL?.trim() || VISION_MODEL;

  const messages: OpenRouterMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: {
            url: imageDataUrl.startsWith('data:')
              ? imageDataUrl
              : `data:image/jpeg;base64,${imageDataUrl}`,
          },
        },
      ],
    },
  ];

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://adera.example.com',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.max_tokens ?? 1000,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('OpenRouter vision error:', res.status, errText);
    return `I couldn't analyze the image (vision API error). Please describe what you need.`;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  return text?.trim() || 'Unable to analyze image in detail.';
}
