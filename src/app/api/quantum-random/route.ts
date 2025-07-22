import { NextRequest, NextResponse } from 'next/server';

interface ANUResponse {
  success: boolean;
  data: number[];
  length: number;
  type: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || 'lfd';
  
  try {
    if (source === 'lfd') {
      // LfD QRNG API (CORS restricted, needs server-side call)
      const response = await fetch('https://lfdr.de/qrng_api/qrng?length=1&format=HEX', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'QuantumCoinFlip/1.0'
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`LfD API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.qrn || data.length !== 1) {
        throw new Error('Invalid response from LfD quantum API');
      }

      // Convert hex to decimal and format as ANU-compatible response
      const randomNumber = parseInt(data.qrn, 16);
      const result: ANUResponse = {
        success: true,
        data: [randomNumber],
        length: 1,
        type: 'uint8_lfd',
      };

      return NextResponse.json(result);
    } else {
      // For other sources, return error (they should use client-side)
      return NextResponse.json(
        { success: false, error: 'Use client-side calls for this source' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error fetching quantum random number:', error);
    
    // Return error without fallback to maintain quantum authenticity
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        retryAfter: error instanceof Error && error.message.includes('rate limit') ? 60 : null
      }, 
      { status: 503 }
    );
  }
}

// Ensure the route is dynamic and doesn't get cached
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';