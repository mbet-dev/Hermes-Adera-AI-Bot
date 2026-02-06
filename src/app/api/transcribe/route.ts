import { NextRequest, NextResponse } from 'next/server';

interface TranscribeRequest {
  audio: string; // base64 encoded audio
}

interface TranscribeResponse {
  text: string;
}

/**
 * Voice input (ASR) is not configured. This endpoint returns an empty result.
 * To enable voice input, integrate a speech-to-text provider and set the required env vars.
 */
export async function POST(req: NextRequest) {
  try {
    const body: TranscribeRequest = await req.json();
    const { audio } = body;

    if (!audio || !audio.trim()) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    // Voice input not configured (OpenRouter does not provide ASR)
    const transcribeResponse: TranscribeResponse = {
      text: '',
    };

    return NextResponse.json(transcribeResponse);
  } catch (error) {
    console.error('Error in transcribe API:', error);
    return NextResponse.json(
      {
        error: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AderaBot-Hermes Transcribe API (voice input not configured)',
    endpoints: {
      POST: '/api/transcribe',
    },
    version: '1.0.0',
  });
}
