import { NextResponse } from 'next/server';

// Note: In production, use pdf-parse for PDF parsing
// For now, we'll use a mock implementation that can be enhanced later

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Read the file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // In production, you would use pdf-parse here:
    // const pdfParse = require('pdf-parse');
    // const pdfData = await pdfParse(buffer);
    // const text = pdfData.text;
    
    // For now, mock the extraction
    const extractedText = `Brand Guidelines Document - ${file.name}`;
    
    // Mock analysis results - in production, send to AI for analysis
    const result = {
      extractedText,
      name: extractNameFromFilename(file.name),
      nameConfidence: 60,
      overallConfidence: 75,
      colors: {
        primary: '#1a1a2e',
        secondary: '#16213e',
        accent: '#e94560',
      },
      tone: {
        formality: 65,
        energy: 55,
        confidence: 70,
        style: 45,
      },
      keywords: ['professional', 'innovative', 'modern', 'trusted'],
      doPatterns: [
        'Use active voice',
        'Keep sentences concise',
        'Lead with benefits',
      ],
      dontPatterns: [
        'Avoid jargon',
        'Never use passive voice',
        'Don\'t be overly formal',
      ],
      voiceSamples: [
        'We believe in building something different.',
        'Your success is our mission.',
      ],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('PDF analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze PDF' },
      { status: 500 }
    );
  }
}

function extractNameFromFilename(filename: string): string | null {
  // Try to extract brand name from filename
  const withoutExt = filename.replace(/\.pdf$/i, '');
  const cleaned = withoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b(brand|guidelines|guide|style|manual)\b/gi, '')
    .trim();
  
  if (cleaned.length > 0) {
    return cleaned.split(' ')[0]; // Return first word as potential brand name
  }
  return null;
}







