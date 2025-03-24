'use client';

import { useState, useEffect, use } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import Link from 'next/link';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TechnicalIndicators {
  rsi: number[];
  macd: number[];
  macdSignal: number[];
  macdHist: number[];
  ema20: number[];
  ema50: number[];
  ema200: number[];
}

export default function AnalisaDetail({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params);
  const [symbol, setSymbol] = useState('');
  const [indicators, setIndicators] = useState<TechnicalIndicators>({
    rsi: [],
    macd: [],
    macdSignal: [],
    macdHist: [],
    ema20: [],
    ema50: [],
    ema200: []
  });
  const [timeframe, setTimeframe] = useState('15');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resolvedParams.symbol) {
      setSymbol(resolvedParams.symbol);
    }
  }, [resolvedParams.symbol]);

  const timeframes = [
    { id: '1', name: '1 Menit' },
    { id: '5', name: '5 Menit' },
    { id: '15', name: '15 Menit' },
    { id: '30', name: '30 Menit' },
    { id: '60', name: '1 Jam' },
    { id: '240', name: '4 Jam' },
    { id: '1D', name: '1 Hari' },
    { id: '1W', name: '1 Minggu' },
    { id: '1M', name: '1 Bulan' }
  ];

  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Format symbol untuk API (konversi ke uppercase)
        const formattedSymbol = symbol.toUpperCase();

        // Format interval untuk API
        const formattedInterval = timeframe;

        // Fetch candlestick data using our API endpoint
        const response = await fetch(
          `/api/binance/klines?symbol=${formattedSymbol}&interval=${formattedInterval}&limit=100`,
          {
            cache: 'no-store',
            next: { revalidate: 0 }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal mengambil data');
        }
        
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Data tidak valid atau kosong');
        }

        // Transform candlestick data
        const candles = data.map((item: any[]) => ({
          timestamp: item[0],
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5])
        }));

        // Calculate technical indicators
        const rsi = calculateRSI(candles);
        const { macd, macdSignal, macdHist } = calculateMACD(candles);
        const ema20 = calculateEMA(candles, 20);
        const ema50 = calculateEMA(candles, 50);
        const ema200 = calculateEMA(candles, 200);

        setIndicators({
          rsi,
          macd,
          macdSignal,
          macdHist,
          ema20,
          ema50,
          ema200
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Gagal mengambil data. Silakan coba lagi nanti.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Refresh setiap 1 menit
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  const calculateRSI = (data: any[], period = 14) => {
    const rsi: number[] = [];
    const changes = data.map((candle, i) => 
      i > 0 ? candle.close - data[i-1].close : 0
    );
    
    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        rsi.push(50); // Default value
        continue;
      }

      const gains = changes.slice(i - period, i).filter(change => change > 0);
      const losses = changes.slice(i - period, i).filter(change => change < 0);
      
      const avgGain = gains.reduce((a, b) => a + b, 0) / period;
      const avgLoss = Math.abs(losses.reduce((a, b) => a + b, 0)) / period;
      
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi;
  };

  const calculateMACD = (data: any[]) => {
    const macd: number[] = [];
    const macdSignal: number[] = [];
    const macdHist: number[] = [];

    // Calculate 12 and 26 day EMAs
    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);

    // Calculate MACD line
    for (let i = 0; i < data.length; i++) {
      macd.push(ema12[i] - ema26[i]);
    }

    // Calculate Signal line (9-day EMA of MACD)
    const signal = calculateEMA(macd.map((value, i) => ({
      timestamp: data[i].timestamp,
      open: value,
      high: value,
      low: value,
      close: value,
      volume: 0
    })), 9);

    // Calculate MACD Histogram
    for (let i = 0; i < data.length; i++) {
      macdSignal.push(signal[i]);
      macdHist.push(macd[i] - signal[i]);
    }

    return { macd, macdSignal, macdHist };
  };

  const calculateEMA = (data: any[], period: number) => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        ema.push(data[i].close);
        continue;
      }

      if (i === period - 1) {
        const sum = data.slice(0, period).reduce((a, b) => a + b.close, 0);
        ema.push(sum / period);
        continue;
      }

      ema.push((data[i].close - ema[i - 1]) * multiplier + ema[i - 1]);
    }

    return ema;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Link 
                href="/analisa"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold gradient-text">
                Analisis {symbol}
              </h1>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {timeframes.map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                    timeframe === tf.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tf.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
              <button
                onClick={() => {
                  setError('');
                  setIsLoading(true);
                }}
                className="text-red-600 hover:text-red-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* TradingView Chart */}
              <div className="h-[600px]">
                <iframe
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${symbol}&symbol=BINANCE:${symbol}USDT&interval=${timeframe.toLowerCase()}&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=f1f3f6&studies=%5B%5D&theme=light&style=1&timezone=exchange&withdateranges=1&showpopupbutton=1&popupwidth=1000&popupheight=650&locale=id&utm_source=www.tradingview.com&utm_medium=widget&utm_campaign=chart&utm_term=BINANCE:${symbol}USDT`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Technical Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">RSI (14)</h3>
                  <p className={`text-2xl font-bold ${
                    indicators.rsi.length > 0 ? (
                      indicators.rsi[indicators.rsi.length - 1] > 70 ? 'text-red-500' :
                      indicators.rsi[indicators.rsi.length - 1] < 30 ? 'text-green-500' :
                      'text-yellow-500'
                    ) : 'text-gray-500'
                  }`}>
                    {indicators.rsi.length > 0 ? indicators.rsi[indicators.rsi.length - 1].toFixed(2) : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">MACD</h3>
                  <p className={`text-2xl font-bold ${
                    indicators.macdHist.length > 0 ? (
                      indicators.macdHist[indicators.macdHist.length - 1] > 0 ? 'text-green-500' : 'text-red-500'
                    ) : 'text-gray-500'
                  }`}>
                    {indicators.macdHist.length > 0 ? indicators.macdHist[indicators.macdHist.length - 1].toFixed(4) : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">EMA 20</h3>
                  <p className="text-2xl font-bold">
                    {indicators.ema20.length > 0 ? `$${indicators.ema20[indicators.ema20.length - 1].toFixed(2)}` : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">EMA 50</h3>
                  <p className="text-2xl font-bold">
                    {indicators.ema50.length > 0 ? `$${indicators.ema50[indicators.ema50.length - 1].toFixed(2)}` : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">EMA 200</h3>
                  <p className="text-2xl font-bold">
                    {indicators.ema200.length > 0 ? `$${indicators.ema200[indicators.ema200.length - 1].toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 