import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nonce = searchParams.get('nonce');
    const state = searchParams.get('state');
    const status = searchParams.get('status');

    if (!nonce || !state || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify state matches nonce
    if (state !== nonce) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    // Store login status securely (e.g., in database or session)
    // For now, we'll just return success
    return NextResponse.json({
      status: 'success',
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error in callback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 