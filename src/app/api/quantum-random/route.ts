import { NextRequest, NextResponse } from 'next/server';

interface ANUResponse {
  success: boolean;
  data: number[];
  length: number;
  type: string;
}

export async function GET(request: NextRequest) {
  try {
    // Use ANU's legacy quantum random number API
    // This endpoint generates truly random numbers from quantum vacuum fluctuations
    const apiUrl = 'https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint8';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
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
    
    // Fallback to pseudorandom number if quantum API fails
    // This ensures the app still works even if the quantum service is down
    const fallbackNumber = Math.floor(Math.random() * 256);
    
    const fallbackResult: ANUResponse = {
      success: true,
      data: [fallbackNumber],
      length: 1,
      type: 'uint8_fallback',
    };

    return NextResponse.json(fallbackResult, { 
      headers: {
        'X-Fallback': 'true',
        'X-Error': error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

// Ensure the route is dynamic and doesn't get cached
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';