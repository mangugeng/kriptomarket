'use client';

import { useState, useEffect } from 'react';
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

interface FavoriteCoin {
  symbol: string;
  price: number;
  priceChange24h: number;
  volume: number;
  marketCap: number;
  priceHistory?: {
    time: string;
    price: number;
  }[];
}

export default function Portfolio() {
  const [favorites, setFavorites] = useState<FavoriteCoin[]>([]);
  const [allCoins, setAllCoins] = useState<FavoriteCoin[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  const fetchPriceHistory = async (symbol: string) => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1m&limit=15`, {
        cache: 'no-store',
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch price history');
      }

      const data = await response.json();
      return data.map((item: any[]) => ({
        time: new Date(item[0]).toLocaleTimeString(),
        price: parseFloat(item[4])
      }));
    } catch (error) {
      console.error(`Error fetching price history for ${symbol}:`, error);
      return [];
    }
  };

  const fetchCoins = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch 24h ticker data for all USDT pairs
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch coin data');
      }
      
      const data = await response.json();
      
      // Filter and format coin data
      const coins = data
        .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
        .map((ticker: any) => ({
          symbol: ticker.symbol.replace('USDT', ''),
          price: parseFloat(ticker.lastPrice),
          priceChange24h: parseFloat(ticker.priceChangePercent),
          volume: parseFloat(ticker.volume),
          marketCap: parseFloat(ticker.quoteVolume)
        }))
        .sort((a: FavoriteCoin, b: FavoriteCoin) => b.volume - a.volume);

      setAllCoins(coins);
      
      // Load favorites from localStorage
      const savedFavorites = localStorage.getItem('favoriteCoins');
      if (savedFavorites) {
        const favoriteSymbols = JSON.parse(savedFavorites);
        const favoriteCoins = coins.filter((coin: FavoriteCoin) => favoriteSymbols.includes(coin.symbol));
        
        // Fetch price history for each favorite coin
        const coinsWithHistory = await Promise.all(
          favoriteCoins.map(async (coin: FavoriteCoin) => {
            const priceHistory = await fetchPriceHistory(coin.symbol);
            return { ...coin, priceHistory };
          })
        );
        
        setFavorites(coinsWithHistory);
      }
    } catch (error) {
      console.error('Error fetching coins:', error);
      setError(error instanceof Error ? error.message : 'Gagal mengambil data coin');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
    // Refresh data every 15 seconds
    const interval = setInterval(fetchCoins, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleFavorite = async (symbol: string) => {
    const newFavorites = favorites.some(f => f.symbol === symbol)
      ? favorites.filter(f => f.symbol !== symbol)
      : [...favorites, { ...allCoins.find(c => c.symbol === symbol)!, priceHistory: await fetchPriceHistory(symbol) }];
    
    setFavorites(newFavorites);
    localStorage.setItem('favoriteCoins', JSON.stringify(newFavorites.map(f => f.symbol)));
  };

  const filteredFavorites = favorites.filter(coin =>
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredModalCoins = allCoins
    .filter(coin => !favorites.some(f => f.symbol === coin.symbol))
    .filter(coin => coin.symbol.toLowerCase().includes(modalSearchQuery.toLowerCase()))
    .slice(0, 20);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(this: any, tickValue: number | string) {
            return `$${Number(tickValue).toFixed(2)}`;
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold gradient-text">Coin Favorit</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Tambah Coin
              </button>
              <button
                onClick={() => fetchCoins()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Cari coin favorit..."
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
          ) : favorites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada coin favorit. Tambahkan coin ke favorit untuk melihatnya di sini.
            </div>
          ) : filteredFavorites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada coin favorit yang sesuai dengan pencarian Anda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((coin) => (
                <div
                  key={coin.symbol}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{coin.symbol}</h3>
                    <button
                      onClick={() => toggleFavorite(coin.symbol)}
                      className="p-2 rounded-full text-yellow-500 hover:text-yellow-600"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      Harga: ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`${coin.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      24h: {coin.priceChange24h.toFixed(2)}%
                    </p>
                    <p className="text-gray-600">
                      Volume: ${(coin.volume / 1000000).toFixed(2)}M
                    </p>
                    <p className="text-gray-600">
                      Market Cap: ${(coin.marketCap / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  
                  {/* Price Chart */}
                  {coin.priceHistory && coin.priceHistory.length > 0 && (
                    <div className="mt-4 h-32">
                      <Line
                        data={{
                          labels: coin.priceHistory.map(item => item.time),
                          datasets: [
                            {
                              data: coin.priceHistory.map(item => item.price),
                              borderColor: coin.priceChange24h >= 0 ? '#10B981' : '#EF4444',
                              borderWidth: 2,
                              tension: 0.4,
                              pointRadius: 0,
                              pointHoverRadius: 4
                            }
                          ]
                        }}
                        options={chartOptions}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Coin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Tambah Coin Favorit</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Cari coin..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModalCoins.map((coin) => (
                <div
                  key={coin.symbol}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    toggleFavorite(coin.symbol);
                    setShowAddModal(false);
                  }}
                >
                  <div>
                    <h3 className="font-semibold">{coin.symbol}</h3>
                    <p className="text-sm text-gray-600">
                      ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button
                    className="p-2 rounded-full text-gray-400 hover:text-yellow-500"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 