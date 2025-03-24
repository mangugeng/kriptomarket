'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CoinData {
  symbol: string;
  price: number;
  priceChange24h: number;
  volume: number;
  marketCap: number;
  technicalIndicators: {
    rsi: number;
    macd: number;
    macdSignal: number;
    macdHist: number;
    ema20: number;
    ema50: number;
    ema200: number;
  };
}

export default function Analisa() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [searchQuery, setSearchQuery] = useState('');

  const timeframes = [
    { id: '1h', name: '1 Jam' },
    { id: '4h', name: '4 Jam' },
    { id: '1d', name: '1 Hari' },
    { id: '1w', name: '1 Minggu' },
    { id: '1m', name: '1 Bulan' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Fetch 24h ticker data
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
          cache: 'no-store',
          next: { revalidate: 0 }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        
        // Filter and format coin data
        const coinsData = data
          .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
          .map((ticker: any) => ({
            symbol: ticker.symbol.replace('USDT', ''),
            price: parseFloat(ticker.lastPrice),
            priceChange24h: parseFloat(ticker.priceChangePercent),
            volume: parseFloat(ticker.volume),
            marketCap: parseFloat(ticker.quoteVolume),
            technicalIndicators: {
              rsi: Math.random() * 100, // Placeholder untuk RSI
              macd: Math.random() * 2 - 1, // Placeholder untuk MACD
              macdSignal: Math.random() * 2 - 1, // Placeholder untuk MACD Signal
              macdHist: Math.random() * 2 - 1, // Placeholder untuk MACD Histogram
              ema20: parseFloat(ticker.lastPrice) * (1 + Math.random() * 0.02), // Placeholder untuk EMA20
              ema50: parseFloat(ticker.lastPrice) * (1 + Math.random() * 0.05), // Placeholder untuk EMA50
              ema200: parseFloat(ticker.lastPrice) * (1 + Math.random() * 0.1), // Placeholder untuk EMA200
            }
          }))
          .sort((a: CoinData, b: CoinData) => b.volume - a.volume);

        setCoins(coinsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Gagal mengambil data. Silakan coba lagi nanti.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Refresh setiap 1 menit
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const filteredCoins = coins.filter(coin =>
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSignalColor = (value: number) => {
    if (value > 70) return 'text-red-500';
    if (value < 30) return 'text-green-500';
    return 'text-yellow-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold gradient-text mb-6">Analisis Teknikal</h1>

          {/* Timeframe Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.id}
                onClick={() => setSelectedTimeframe(timeframe.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedTimeframe === timeframe.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {timeframe.name}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Cari coin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredCoins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada coin yang sesuai dengan pencarian Anda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      24h %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RSI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MACD
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      EMA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sinyal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCoins.map((coin) => (
                    <tr key={coin.symbol} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/analisa/${coin.symbol}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {coin.symbol}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${coin.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {coin.priceChange24h.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${getSignalColor(coin.technicalIndicators.rsi)}`}>
                          {coin.technicalIndicators.rsi.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {coin.technicalIndicators.macd.toFixed(4)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {coin.technicalIndicators.ema20.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${
                          coin.technicalIndicators.macdHist > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {coin.technicalIndicators.macdHist > 0 ? 'Beli' : 'Jual'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 