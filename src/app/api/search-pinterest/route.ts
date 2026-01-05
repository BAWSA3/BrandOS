import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, num = 12 } = await request.json() as {
      query: string;
      num?: number;
    };

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const apiKey = process.env.SERPER_API_KEY;
    
    if (!apiKey) {
      // Return mock results if no API key (for demo purposes)
      return NextResponse.json({ 
        images: [],
        message: 'Add SERPER_API_KEY to .env.local to enable Pinterest search. Get one free at serper.dev'
      });
    }
    
    // Sanitize query for logging (prevent log injection)
    const sanitizedQuery = query.replace(/[\n\r]/g, ' ').slice(0, 100);
    console.log('Searching for:', sanitizedQuery);

    // Search Google Images filtered to Pinterest
    const response = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `${query} site:pinterest.com`,
        num: num,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Serper API error:', response.status, errorText);
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Serper response - images count:', data.images?.length || 0);

    // Transform results to clean format
    const images = (data.images || []).map((img: any) => ({
      id: img.imageUrl || img.link,
      url: img.imageUrl,
      thumbnail: img.thumbnailUrl || img.imageUrl,
      title: img.title,
      source: img.link,
      width: img.imageWidth,
      height: img.imageHeight,
    }));

    return NextResponse.json({ images });

  } catch (error) {
    console.error('Pinterest search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

