import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { supabaseServer } from '@/lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'adera-hermes-secret-key-2025';

// Middleware to verify JWT and extract user
async function getUserFromToken(token: string) {
  try {
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

// GET - Retrieve conversation history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get conversation history
    const { data: conversations, error } = await supabaseServer
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Conversation fetch error:', error);
      if (error.code === 'PGRST205') {
        return NextResponse.json({ success: true, conversations: [] });
      }
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversations: conversations || []
    });

  } catch (error) {
    console.error('Conversation GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save conversation or get context for learning
export async function POST(request: NextRequest) {
  try {
    const { token, action, conversationId, messages, limit } = await request.json();

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Action: 'save' - Save a new conversation or update existing
    if (action === 'save') {
      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json(
          { error: 'Messages array is required' },
          { status: 400 }
        );
      }

      const conversationData = {
        user_id: user.id,
        messages: messages as any,
        updated_at: new Date().toISOString()
      };

      let result;

      if (conversationId) {
        // Update existing conversation
        result = await supabaseServer
          .from('conversations')
          .update(conversationData)
          .eq('id', conversationId)
          .eq('user_id', user.id)
          .select()
          .single();
      } else {
        // Create new conversation
        result = await supabaseServer
          .from('conversations')
          .insert({ ...conversationData, created_at: new Date().toISOString() })
          .select()
          .single();
      }

      if (result.error) {
        console.error('Conversation save error:', result.error);
        if (result.error.code === 'PGRST205') {
          return NextResponse.json({
            success: false,
            error: 'Conversations table not configured. Run supabase/migrations/001_create_conversations_table.sql in your Supabase SQL editor.',
          });
        }
        return NextResponse.json(
          { error: 'Failed to save conversation' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        conversation: result.data
      });
    }

    // Action: 'context' - Get context from recent conversations for learning
    if (action === 'context') {
      const contextLimit = limit || 5;

      // Get recent conversations
      const { data: recentConversations, error } = await supabaseServer
        .from('conversations')
        .select('messages')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(contextLimit);

      if (error) {
        console.error('Context fetch error:', error);
        if (error.code === 'PGRST205') {
          return NextResponse.json({ success: true, context: [] });
        }
        return NextResponse.json(
          { error: 'Failed to fetch conversation context' },
          { status: 500 }
        );
      }

      // Flatten messages from recent conversations
      const contextMessages: any[] = [];
      recentConversations?.forEach(conv => {
        if (conv.messages && Array.isArray(conv.messages)) {
          contextMessages.push(...conv.messages);
        }
      });

      // Limit context to last 20 messages to avoid token explosion
      const limitedContext = contextMessages.slice(-20);

      return NextResponse.json({
        success: true,
        context: limitedContext
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "save" or "context"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Conversation POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
