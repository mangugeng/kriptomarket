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

interface CryptoCardProps {
  crypto: CryptoData;
  isSelected: boolean;
  onSelect: () => void;
}

export default function CryptoCard({ crypto, isSelected, onSelect }: CryptoCardProps) {
  return (
    <div 
      className={`crypto-card cursor-pointer transition-all duration-300 ${
        isSelected ? 'col-span-full' : ''
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold gradient-text">
            {crypto.symbol.replace('USDT', '')}
          </h2>
          <p className="text-xs text-gray-500">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`price-change-badge ${
            parseFloat(crypto.priceChange) >= 0 
              ? 'price-change-positive' 
              : 'price-change-negative'
          }`}>
            {crypto.priceChange}%
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <p className="text-2xl font-bold text-gray-900 mb-1">${crypto.price}</p>
        <div className="flex justify-between text-xs">
          <div className="text-green-600">
            <span className="text-gray-500">High: </span>${crypto.high24h}
          </div>
          <div className="text-red-600">
            <span className="text-gray-500">Low: </span>${crypto.low24h}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="chart-container">
        <div className="h-[180px]">
          <Line
            data={{
              labels: crypto.timestamps,
              datasets: [
                {
                  label: 'Price',
                  data: crypto.priceHistory,
                  borderColor: parseFloat(crypto.priceChange) >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                  backgroundColor: parseFloat(crypto.priceChange) >= 0 
                    ? 'rgba(34, 197, 94, 0.1)' 
                    : 'rgba(239, 68, 68, 0.1)',
                  tension: 0.4,
                  fill: true,
                  pointRadius: 0,
                  borderWidth: 2
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              aspectRatio: 1,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  ticks: {
                    color: '#6b7280',
                    font: {
                      size: 10
                    },
                    callback: (value) => {
                      return `$${Number(value).toFixed(6)}`;
                    }
                  },
                  grid: {
                    color: '#e5e7eb',
                    drawBorder: false
                  }
                },
                x: {
                  ticks: {
                    color: '#6b7280',
                    maxRotation: 45,
                    minRotation: 45,
                    font: {
                      size: 10
                    }
                  },
                  grid: {
                    color: '#e5e7eb',
                    drawBorder: false
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
} 