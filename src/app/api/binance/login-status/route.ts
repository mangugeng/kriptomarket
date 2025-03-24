import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nonce = searchParams.get('nonce');

    if (!nonce) {
      return NextResponse.json(
        { error: 'Nonce is required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual Binance QR code login verification
    // For now, we'll simulate a successful login after 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    return NextResponse.json({
      status: 'success',
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error checking login status:', error);
    return NextResponse.json(
      { error: 'Failed to check login status' },
      { status: 500 }
    );
  }
} 