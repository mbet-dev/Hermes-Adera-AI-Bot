import { NextResponse } from 'next/server';
import { fetchAderaKnowledge, getAderaSystemPrompt } from '@/lib/adera-knowledge';

export async function GET() {
  try {
    const knowledgeData = await fetchAderaKnowledge();
    const systemPrompt = await getAderaSystemPrompt();

    return NextResponse.json({
      success: true,
      data: {
        knowledge: knowledgeData,
        systemPrompt: systemPrompt.substring(0, 5000), // Truncate for preview
      },
    });
  } catch (error) {
    console.error('Error fetching Adera knowledge:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Adera knowledge',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
