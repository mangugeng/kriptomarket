'use client';

import { useEffect, useState } from 'react';
import CryptoCard from '@/components/CryptoCard';

interface CryptoData {
  symbol: string;
  price: string;
  priceHistory: number[];
  timestamps: string[];
  volume: string;
  priceChange: string;
  high24h: string;
  low24h: string;
}

export default function Home() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const symbols = [
    'BTCUSDT', 
    'ETHUSDT', 
    'BNBUSDT',
    'DOGEUSDT',  // Dogecoin
    'SHIBUSDT',  // Shiba Inu
    'PEPEUSDT',  // Pepe
    'FLOKIUSDT', // Floki
    'BONKUSDT',  // Bonk
    'TRUMPUSDT'  // Trump
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responses = await Promise.all(
          symbols.map(symbol =>
            fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=15m&limit=96`)
          )
        );
        
        const data = await Promise.all(responses.map(res => res.json()));
        
        setCryptoData(prevData => {
          const newData = data.map((item, index) => {
            const prices = item.map((candle: any[]) => parseFloat(candle[4]));
            const timestamps = item.map((candle: any[]) => {
              const date = new Date(candle[0]);
              return date.toLocaleTimeString();
            });

            const currentPrice = prices[prices.length - 1];
            const previousPrice = prices[prices.length - 2];
            const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;

            const high24h = Math.max(...prices);
            const low24h = Math.min(...prices);

            return {
              symbol: symbols[index],
              price: currentPrice.toFixed(6),
              priceHistory: prices,
              timestamps: timestamps,
              volume: "N/A",
              priceChange: priceChange.toFixed(2),
              high24h: high24h.toFixed(6),
              low24h: low24h.toFixed(6)
            };
          });
          return newData;
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 900000);
    return () => clearInterval(interval);
  }, []);

  const handleCardClick = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const handleBackClick = () => {
    setSelectedSymbol(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold gradient-text">Krypto Market Monitor</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {selectedSymbol && (
            <div className="modal-overlay" onClick={() => setSelectedSymbol(null)} />
          )}
          {cryptoData.map((crypto) => (
            <CryptoCard
              key={crypto.symbol}
              crypto={crypto}
              isSelected={selectedSymbol === crypto.symbol}
              onSelect={() => setSelectedSymbol(crypto.symbol)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
