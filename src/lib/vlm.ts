import { openRouterVision } from '@/lib/openrouter';

export async function analyzeImage(
  base64Image: string,
  prompt: string
): Promise<string> {
  try {
    const imageDataUrl = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;
    return await openRouterVision(prompt, imageDataUrl, { max_tokens: 1000 });
  } catch (error: unknown) {
    console.error('VLM Error:', error);
    const message =
      error instanceof Error ? error.message : 'Image analysis failed';
    throw new Error(message);
  }
}
