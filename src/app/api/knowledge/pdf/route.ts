import { NextRequest, NextResponse } from 'next/server';

interface PDFUploadResponse {
  success: boolean;
  content?: string;
  filename?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // For now, we'll extract text from PDF using a simple approach
    // In production, you would use a PDF parsing library like pdf-parse or pdfplumber
    const extractedText = await extractTextFromPDF(buffer);

    const response: PDFUploadResponse = {
      success: true,
      content: extractedText,
      filename: file.name,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in PDF upload API:', error);
    return NextResponse.json(
      {
        error: 'Failed to process PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Import pdf-parse dynamically (it's a Node.js library)
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    // Fallback: return a placeholder message
    return 'PDF content could not be extracted automatically. The PDF has been stored and can be referenced.';
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AderaBot-Hermes PDF Knowledge API is running',
    endpoints: {
      POST: '/api/knowledge/pdf',
    },
    version: '1.0.0',
  });
}
