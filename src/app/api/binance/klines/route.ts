import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

// Mapping interval ke format Binance
const intervalMap: { [key: string]: string } = {
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '30': '30m',
  '60': '1h',
  '240': '4h',
  '1D': '1d',
  '1W': '1w',
  '1M': '1M'
};

// Format symbol untuk Binance
const formatSymbol = (symbol: string): string => {
  // Hapus USDT jika sudah ada
  if (symbol.endsWith('USDT')) {
    symbol = symbol.replace('USDT', '');
  }
  // Konversi ke uppercase
  return symbol.toUpperCase();
};

// Konfigurasi axios untuk Binance
const binanceApi = axios.create({
  baseURL: 'https://api.binance.com/api/v3',
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // Hanya untuk development, hapus di production
  })
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limit = searchParams.get('limit') || '100';

  try {
    if (!symbol || !interval) {
      return NextResponse.json(
        { error: 'Symbol dan interval harus diisi' },
        { status: 400 }
      );
    }

    // Format symbol untuk Binance
    const formattedSymbol = formatSymbol(symbol);
    const binanceSymbol = `${formattedSymbol}USDT`;
    const binanceInterval = intervalMap[interval] || interval;

    // Log request parameters untuk debugging
    console.log('Request parameters:', {
      originalSymbol: symbol,
      formattedSymbol: binanceSymbol,
      interval: binanceInterval,
      limit
    });

    // Cek ketersediaan symbol di Binance
    try {
      const symbolInfoResponse = await binanceApi.get('/exchangeInfo', {
        params: {
          symbol: binanceSymbol
        }
      });

      const symbols = symbolInfoResponse.data.symbols;
      if (!symbols || !symbols.find((s: any) => s.symbol === binanceSymbol)) {
        return NextResponse.json(
          { error: `Symbol ${symbol} tidak tersedia di Binance. Silakan gunakan symbol yang valid seperti BTC, ETH, BNB, dll.` },
          { status: 404 }
        );
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return NextResponse.json(
          { error: `Symbol ${symbol} tidak tersedia di Binance. Silakan gunakan symbol yang valid seperti BTC, ETH, BNB, dll.` },
          { status: 404 }
        );
      }
      throw error;
    }

    // Ambil data klines
    const response = await binanceApi.get('/klines', {
      params: {
        symbol: binanceSymbol,
        interval: binanceInterval,
        limit
      }
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Data tidak valid dari Binance');
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching klines:', error);
    
    if (error.response) {
      const errorMessage = error.response.data?.msg || 'Unknown error';
      console.error('Binance API Error:', {
        status: error.response.status,
        data: error.response.data
      });

      if (error.response.status === 404) {
        return NextResponse.json(
          { error: `Symbol ${symbol} tidak tersedia di Binance. Silakan gunakan symbol yang valid seperti BTC, ETH, BNB, dll.` },
          { status: 404 }
        );
      } else if (error.response.status === 400) {
        return NextResponse.json(
          { error: 'Parameter tidak valid. Silakan cek symbol dan interval' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: `Error dari Binance: ${errorMessage}` },
          { status: error.response.status }
        );
      }
    } else if (error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { error: 'Waktu permintaan habis. Silakan coba lagi.' },
        { status: 504 }
      );
    } else {
      return NextResponse.json(
        { error: 'Tidak dapat terhubung ke Binance. Silakan coba lagi nanti.' },
        { status: 503 }
      );
    }
  }
} 