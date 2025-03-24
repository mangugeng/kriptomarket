import { NextResponse } from 'next/server';
import https from 'https';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { apiKey, apiSecret } = await request.json();

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'API key and secret are required' },
        { status: 400 }
      );
    }

    // Create custom HTTPS agent to handle SSL issues
    const agent = new https.Agent({
      rejectUnauthorized: false, // Temporarily disable SSL verification
      timeout: 60000, // Increase timeout to 60 seconds
      keepAlive: true,
      keepAliveMsecs: 1000
    });

    // Generate signature
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');

    // Fetch account data from Binance with proper headers
    const response = await fetch('https://api.binance.com/api/v3/account', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-MBX-APIKEY': apiKey,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // @ts-ignore
      agent,
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch account data');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching account data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch account data' },
      { status: 500 }
    );
  }
} 