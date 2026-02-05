import { NextRequest, NextResponse } from 'next/server';
import { getAderaSystemPrompt } from '@/lib/adera-knowledge';
import { openRouterChat, type OpenRouterMessage } from '@/lib/openrouter';
import { supabaseServer } from '@/lib/supabase';
import { verify } from 'jsonwebtoken';

// Response cache for faster responses
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  settings?: {
    voiceOutput: boolean;
    voiceInput: boolean;
    autoScroll: boolean;
    showSources: boolean;
    contextLength: number;
    language?: 'en' | 'am';
  };
  knowledgeSources?: Array<{
    id: string;
    type: 'pdf' | 'web' | 'database';
    name: string;
    url?: string;
    content?: string;
  }>;
  token?: string; // JWT token for authenticated users
  imageData?: string; // Base64 image data for VLM analysis
  queryUserData?: boolean; // Whether to query user's personal data
}

interface ChatResponse {
  response: string;
  language: 'en' | 'am';
  sources?: string[];
  audioUrl?: string;
  userData?: any; // User's personal data if requested
}

// Language detection helper
function detectLanguage(text: string): 'en' | 'am' {
  const amharicRegex = /[\u1200-\u137F]/;
  return amharicRegex.test(text) ? 'am' : 'en';
}

// Get user from token
async function getUserFromToken(token: string) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'adera-hermes-secret-key-2025';
    const decoded = verify(token, JWT_SECRET) as any;
    return {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      email: decoded.email
    };
  } catch (error) {
    return null;
  }
}

// Generate cache key
function generateCacheKey(message: string, contextLength: number): string {
  return `${message.substring(0, 50)}_${contextLength}`;
}

async function getUserPersonalData(userId: string, role: string) {
  if (role === 'admin') {
    return { role: 'admin' };
  }

  try {
    const { data: user } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: deliveries } = await supabaseServer
      .from('deliveries')
      .select('*')
      .eq('user_id', userId)
      .limit(10);

    return {
      user,
      deliveries: deliveries || []
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

/** Fetches users, deliveries, and products for admin (raw data). */
async function getAdminDatabaseData(): Promise<{ users: any[]; deliveries: any[]; products: any[] }> {
  const [usersRes, deliveriesRes, productsRes] = await Promise.all([
    supabaseServer.from('users').select('id, email, role, first_name, last_name, created_at').order('created_at', { ascending: false }).limit(50),
    supabaseServer.from('deliveries').select('id, user_id, order_number, status, pickup_address, delivery_address, created_at').order('created_at', { ascending: false }).limit(40),
    supabaseServer.from('products').select('id, name, category, price, in_stock').limit(30),
  ]);
  return {
    users: usersRes.data || [],
    deliveries: deliveriesRes.data || [],
    products: productsRes.data || [],
  };
}

/** Formats admin DB data as context string for the LLM. */
async function getAdminDatabaseContext(): Promise<string> {
  try {
    const { users, deliveries, products } = await getAdminDatabaseData();
    const usersText = users.length === 0 ? 'No users.' : users.map((u: any) => `- ${u.email} (id: ${u.id}, role: ${u.role || 'n/a'}, name: ${[u.first_name, u.last_name].filter(Boolean).join(' ') || 'n/a'})`).join('\n');
    const deliveriesText = deliveries.length === 0 ? 'No deliveries.' : deliveries.map((d: any) => `- Order ${d.order_number} | status: ${d.status} | user_id: ${d.user_id} | ${d.pickup_address || ''} → ${d.delivery_address || ''}`).join('\n');
    const productsText = products.length === 0 ? 'No products.' : products.map((p: any) => `- ${p.name} (${p.category || 'n/a'}) | price: ${p.price} | in_stock: ${p.in_stock}`).join('\n');
    return `[Admin Database Context - use this to answer questions about users, deliveries, and products.]\n\nUsers (recent, up to 50):\n${usersText}\n\nDeliveries (recent, up to 40):\n${deliveriesText}\n\nProducts (sample, up to 30):\n${productsText}`;
  } catch (error) {
    console.error('Error fetching admin database context:', error);
    return '[Admin Database Context could not be loaded.]';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const {
      message,
      conversationHistory = [],
      settings,
      knowledgeSources,
      token,
      imageData,
      queryUserData
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user info if authenticated
    let user: Awaited<ReturnType<typeof getUserFromToken>> = null;
    if (token) {
      user = await getUserFromToken(token);
    }

    // Check cache for similar queries (only if no image data)
    let responseText: string;
    if (!imageData) {
      const cacheKey = generateCacheKey(message, settings?.contextLength || 10);
      const cached = responseCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        responseText = cached.response;
        console.log('Returning cached response');
      } else {
        // Generate new response
        responseText = await generateResponse(
          message,
          conversationHistory,
          settings,
          knowledgeSources ?? [],
          imageData,
          user,
          queryUserData
        );

        // Cache the response
        responseCache.set(cacheKey, { response: responseText, timestamp: Date.now() });

        // Clean old cache entries periodically
        if (responseCache.size > 100) {
          const now = Date.now();
          for (const [key, value] of responseCache.entries()) {
            if (now - value.timestamp > CACHE_TTL) {
              responseCache.delete(key);
            }
          }
        }
      }
    } else {
      // Generate new response for image queries (no caching)
      responseText = await generateResponse(
        message,
        conversationHistory,
        settings,
        knowledgeSources ?? [],
        imageData,
        user,
        queryUserData
      );
    }

    // Detect language
    const detectedLanguage = detectLanguage(message);
    const userLanguage = settings?.language || detectedLanguage;

    // Voice output: TTS not configured (OpenRouter does not provide TTS). Leave audioUrl undefined.
    const audioUrl: string | undefined = undefined;

    // Extract sources mentioned in response
    const sources: string[] = [];
    if (knowledgeSources && knowledgeSources.length > 0) {
      const sourceNames = new Set<string>();
      for (const source of knowledgeSources) {
        if (responseText.toLowerCase().includes(source.name.toLowerCase())) {
          sourceNames.add(source.name);
        }
      }
      sources.push(...Array.from(sourceNames));
    }

    const response: ChatResponse = {
      response: responseText,
      language: userLanguage,
      sources: sources.length > 0 ? sources : undefined,
      audioUrl,
    };

    // Add user data if requested and user is authenticated
    if (queryUserData && user) {
      if (user.role === 'admin') {
        const adminData = await getAdminDatabaseData();
        response.userData = { role: 'admin', ...adminData };
      } else {
        const userData = await getUserPersonalData(user.id, user.role);
        if (userData) response.userData = userData;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = (error as Error & { status?: number }).status;

    // OpenRouter 429 (rate limit) – return 200 with friendly message so UI shows it in chat and user can retry
    if (status === 429 || message.includes('429') || message.includes('rate-limit') || message.includes('rate limited')) {
      return NextResponse.json({
        response: 'The AI is busy right now (rate limit). Please try again in a moment, or add your own provider key at https://openrouter.ai/settings/integrations for higher limits.',
        language: 'en' as const,
        sources: undefined,
        audioUrl: undefined,
      });
    }

    // OpenRouter 402 (spend limit exceeded on key)
    if (status === 402 || message.includes('402') || message.includes('spend limit') || message.includes('USD limit')) {
      return NextResponse.json({
        response: 'All free model keys have reached their limit for now. The bot will try the next configured model on your next message, or you can add credits at openrouter.ai.',
        language: 'en' as const,
        sources: undefined,
        audioUrl: undefined,
      });
    }

    // OpenRouter 401 (invalid/expired API key or "User not found") – return 200 with friendly message so UI shows it in chat
    if (status === 401 || message.includes('401') || message.includes('User not found')) {
      return NextResponse.json({
        response: 'Chat is temporarily unavailable. Please check OPENROUTER_KEY_1, _2, _3 in .env.local (see .env.example).',
        language: 'en' as const,
        sources: undefined,
        audioUrl: undefined,
      });
    }
    // No models configured
    if (message.includes('No OpenRouter models configured')) {
      return NextResponse.json({
        response: 'Chat is not configured. Set OPENROUTER_MODEL_1 and OPENROUTER_KEY_1 (and optionally _2, _3) in .env.local.',
        language: 'en' as const,
        sources: undefined,
        audioUrl: undefined,
      });
    }

    console.error('Error in chat API:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        details: message,
      },
      { status: 500 }
    );
  }
}

async function generateResponse(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  settings: any,
  knowledgeSources: any[],
  imageData?: string,
  user?: any,
  queryUserData?: boolean
): Promise<string> {
  // Get Adera-specific system prompt
  const systemPrompt = await getAderaSystemPrompt();

  // Optimize system prompt for speed
  const optimizedSystemPrompt = `${systemPrompt}\n\nBe concise and direct in your responses. Provide accurate information quickly.`;

  // Detect language
  const detectedLanguage = detectLanguage(message);
  const userLanguage = settings?.language || detectedLanguage;

  // Add language instruction
  const languageInstruction = userLanguage === 'am'
    ? '\n\nIMPORTANT: The user is communicating in Amharic (አማርኛ). Respond in Amharic using Ge\'ez script characters.'
    : '';

  // Build messages array with system prompt
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: optimizedSystemPrompt + languageInstruction },
  ];

  // Add conversation history (limit to last 5 messages for speed)
  const historyLimit = Math.min(settings?.contextLength || 10, 5);
  const recentHistory = conversationHistory.slice(-historyLimit);

  for (const msg of recentHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add image analysis if provided
  if (imageData) {
    const { analyzeImage } = await import('@/lib/vlm');
    const imagePrompt = user?.username
      ? `User ${user.username} is asking about this image: ${message}. Analyze it and provide relevant information about delivery status, parcel details, or any logistics information visible.`
      : `The user is asking about this image: ${message}. Analyze it and provide relevant information.`;

    const imageAnalysis = await analyzeImage(imageData, imagePrompt);
    messages.push({
      role: 'assistant',
      content: `[Image Analysis Result]: ${imageAnalysis}\n\nUse this analysis to answer the user's question about the image.`,
    });
  }

  // Add user context if authenticated
  if (user) {
    messages.push({
      role: 'assistant',
      content: user.role === 'admin'
        ? 'You are assisting an admin user. You have access to all system information and can help with administrative tasks. You may query and summarize user-specific data, deliveries, and products from the database context provided below when the admin asks about records, users, or orders.'
        : `You are assisting user ${user.username}. You can access their personal delivery information when requested.`,
    });
    // For admin: inject database records so the bot can answer questions about users, deliveries, products
    if (user.role === 'admin') {
      const adminContext = await getAdminDatabaseContext();
      messages.push({
        role: 'assistant',
        content: adminContext,
      });
    }
  }

  // Add knowledge context (limit to 2 sources for speed)
  if (knowledgeSources && knowledgeSources.length > 0) {
    const knowledgeContext = knowledgeSources
      .slice(0, 2)
      .filter(k => k.content)
      .map(k => {
        if (k.type === 'pdf') {
          return `[PDF - ${k.name}]: ${k.content?.substring(0, 1000)}`;
        } else if (k.type === 'web') {
          return `[Web - ${k.name}]: ${k.content?.substring(0, 1000)}`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');

    if (knowledgeContext) {
      messages.push({
        role: 'assistant',
        content: `Knowledge Context:\n${knowledgeContext}`,
      });
    }
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: message,
  });

  return await openRouterChat(messages);
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AderaBot-Hermes Chat API is running with Adera knowledge',
    endpoints: {
      POST: '/api/chat',
    },
    version: '2.0.0',
    features: {
      multilingual: true,
      languages: ['en', 'am'],
      aderaKnowledge: true,
    },
  });
}
