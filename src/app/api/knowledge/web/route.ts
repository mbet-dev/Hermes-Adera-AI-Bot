import { NextRequest, NextResponse } from 'next/server';

interface WebSourceRequest {
  url: string;
}

interface WebSourceResponse {
  success: boolean;
  title?: string;
  content?: string;
  url?: string;
  publishedTime?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: WebSourceRequest = await req.json();
    const { url } = body;

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch page content using standard fetch
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AderaBot-Hermes/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const title = extractTitle(html);
    const plainText = htmlToPlainText(html);

    const responseData: WebSourceResponse = {
      success: true,
      title: title || url,
      content: plainText.substring(0, 5000), // Limit to prevent token overflow
      url: url,
      publishedTime: new Date().toISOString(),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in web source API:', error);
    return NextResponse.json(
      {
        error: 'Failed to process web source',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : 'Unknown Title';
}

function htmlToPlainText(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Replace block elements with newlines
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AderaBot-Hermes Web Knowledge API is running',
    endpoints: {
      POST: '/api/knowledge/web',
    },
    version: '1.0.0',
  });
}
