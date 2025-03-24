'use client';

import { useState, useEffect } from 'react';
import { CryptoData } from '@/types';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Market() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [klineData, setKlineData] = useState<{ [key: string]: number[] }>({});
  const [sortConfig, setSortConfig] = useState<{
    key: 'price' | 'priceChangePercent';
    direction: 'asc' | 'desc';
  }>({
    key: 'priceChangePercent',
    direction: 'desc'
  });

  const fetchTopCoins = async () => {
    try {
      // Fetch semua ticker 24h
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      const allTickers = await response.json();

      // Filter hanya pair USDT dan urutkan berdasarkan perubahan harga
      const usdtPairs = allTickers
        .filter((ticker: any) => 
          ticker.symbol.endsWith('USDT') && 
          parseFloat(ticker.lastPrice) > 0 &&
          parseFloat(ticker.volume) > 0 &&
          parseFloat(ticker.volume) > 1000000 // Minimal volume $1M untuk menghindari coin yang tidak aktif
        )
        .map((ticker: any) => ({
          symbol: ticker.symbol,
          price: parseFloat(ticker.lastPrice),
          priceChangePercent: parseFloat(ticker.priceChangePercent),
          high: parseFloat(ticker.highPrice),
          low: parseFloat(ticker.lowPrice),
          volume: parseFloat(ticker.volume)
        }))
        .sort((a: any, b: any) => b.priceChangePercent - a.priceChangePercent);

      // Ambil 6 tertinggi dan 6 terendah
      const topGainers = usdtPairs.slice(0, 6);
      const topLosers = usdtPairs.slice(-6).reverse();
      const selectedCoins = [...topGainers, ...topLosers];

      setCryptoData(selectedCoins);
      return selectedCoins.map(coin => coin.symbol);
    } catch (error) {
      console.error('Error fetching top coins:', error);
      return [];
    }
  };

  const fetchKlineData = async (symbol: string) => {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=15m&limit=20`
      );
      const data = await response.json();
      return data.map((item: any) => parseFloat(item[4])); // Mengambil closing price
    } catch (error) {
      console.error('Error fetching kline data:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch top coins first
        const symbols = await fetchTopCoins();

        // Fetch kline data for each symbol
        const klineResponses = await Promise.all(
          symbols.map(symbol => fetchKlineData(symbol))
        );
        const klineObject = symbols.reduce((acc, symbol, index) => {
          acc[symbol] = klineResponses[index];
          return acc;
        }, {} as { [key: string]: number[] });
        setKlineData(klineObject);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const sortData = (key: 'price' | 'priceChangePercent') => {
    setSortConfig(prevConfig => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedData = [...cryptoData].sort((a, b) => {
    const multiplier = sortConfig.direction === 'desc' ? -1 : 1;
    return (a[sortConfig.key] - b[sortConfig.key]) * multiplier;
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `$${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 3
      },
      line: {
        tension: 0.4
      }
    },
    interaction: {
      intersect: false
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold gradient-text">Market</h1>
          <div className="flex gap-4">
            <button
              onClick={() => sortData('price')}
              className={`px-4 py-2 rounded-lg ${
                sortConfig.key === 'price'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700'
              } hover:bg-blue-700 hover:text-white transition-colors`}
            >
              Harga {sortConfig.key === 'price' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => sortData('priceChangePercent')}
              className={`px-4 py-2 rounded-lg ${
                sortConfig.key === 'priceChangePercent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700'
              } hover:bg-blue-700 hover:text-white transition-colors`}
            >
              Perubahan {sortConfig.key === 'priceChangePercent' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedData.map((crypto) => (
            <div
              key={crypto.symbol}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{crypto.symbol.replace('USDT', '')}</h2>
                  <p className="text-gray-500 text-sm">USDT</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    crypto.priceChangePercent >= 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {crypto.priceChangePercent.toFixed(2)}%
                </span>
              </div>

              {/* Chart */}
              <div className="h-32 mb-4">
                {klineData[crypto.symbol] && (
                  <Line
                    data={{
                      labels: Array.from({ length: 20 }, (_, i) => `15m-${20-i}`),
                      datasets: [
                        {
                          data: klineData[crypto.symbol],
                          borderColor: crypto.priceChangePercent >= 0 ? '#10B981' : '#EF4444',
                          borderWidth: 2,
                          fill: false,
                          backgroundColor: crypto.priceChangePercent >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          pointHoverBackgroundColor: crypto.priceChangePercent >= 0 ? '#10B981' : '#EF4444'
                        }
                      ]
                    }}
                    options={chartOptions}
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga</span>
                  <span className="font-medium">${crypto.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">24h Tertinggi</span>
                  <span className="font-medium text-green-600">
                    ${crypto.high.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">24h Terendah</span>
                  <span className="font-medium text-red-600">
                    ${crypto.low.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume 24h</span>
                  <span className="font-medium">
                    {crypto.volume.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 