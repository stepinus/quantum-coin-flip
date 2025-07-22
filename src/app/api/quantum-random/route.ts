import { NextRequest, NextResponse } from 'next/server';

interface ANUResponse {
  success: boolean;
  data: number[];
  length: number;
  type: string;
}

export async function GET(request: NextRequest) {
  try {
    // Use ANU's quantum random number API
    // Note: API is limited to 1 request per minute for free tier
    // This endpoint generates truly random numbers from quantum vacuum fluctuations
    const apiUrl = 'https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint8';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'QuantumCoinFlip/1.0'
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(15000), // 15 second timeout (increased for rate limits)
    });

    if (!response.ok) {
      // Handle rate limiting (500 error when exceeding 1 req/min limit)
      if (response.status === 500) {
        const errorText = await response.text();
        if (errorText.includes('1 requests per minute')) {
          throw new Error('ANU API rate limit exceeded (1 request per minute)');
        }
      }
      throw new Error(`ANU API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate the response structure
    if (!data || !data.success || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('Invalid response from ANU quantum API');
    }

    // Return the quantum random data
    const result: ANUResponse = {
      success: true,
      data: data.data,
      length: data.length,
      type: data.type,
    };

    return NextResponse.json(result);
    
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