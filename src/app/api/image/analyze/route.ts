import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const query = formData.get('query') as string;
    const token = formData.get('token') as string;

    if (!image) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Validate image type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate image size (max 10MB)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Import VLM skill
    const { analyzeImage } = await import('@/lib/vlm');

    // Create analysis prompt
    const analysisPrompt = query
      ? `Analyze this image in the context of: ${query}. Provide detailed information about what you see, and if this is related to delivery services, parcels, QR codes, or other logistics information, extract relevant details.`
      : 'Analyze this image in detail. If this is a delivery-related image, parcel, QR code, or logistics document, extract all relevant information including tracking numbers, addresses, status, and any other details visible.';

    // Analyze image using VLM
    let analysis;
    try {
      analysis = await analyzeImage(base64Image, analysisPrompt);
    } catch (vlmError: any) {
      console.error('VLM analysis error:', vlmError);
      return NextResponse.json(
        {
          error: 'Image analysis failed',
          details: vlmError.message || 'Unable to analyze the image'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: analysis || 'Unable to analyze image. Please try again.',
      imageType: image.type,
      imageSize: image.size
    });

  } catch (error: any) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}
