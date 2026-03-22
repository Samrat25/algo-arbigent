import { useState, useEffect, useCallback, useRef } from 'react';

export interface TokenPrices {
  ALGO: number;
  USDC: number;
  USDT: number;
}

export interface PriceDataPoint {
  time: string;
  seconds: number;
  ALGO: number;
  USDC: number;
  USDT: number;
}

export interface UseLivePricesReturn {
  prices: TokenPrices;
  priceHistory: PriceDataPoint[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Coinbase API endpoints
const COINBASE_ALGO_API = 'https://api.coinbase.com/v2/prices/ALGO-USD/spot';
const COINBASE_USDC_API = 'https://api.coinbase.com/v2/prices/USDC-USD/spot';
const COINBASE_USDT_API = 'https://api.coinbase.com/v2/prices/USDT-USD/spot';

export const useLivePrices = (refreshInterval: number = 3000): UseLivePricesReturn => {
  const [prices, setPrices] = useState<TokenPrices>({ ALGO: 0, USDC: 1, USDT: 1 });
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const fetchPrices = useCallback(async () => {
    try {
      const [algoResponse, usdcResponse, usdtResponse] = await Promise.all([
        fetch(COINBASE_ALGO_API),
        fetch(COINBASE_USDC_API),
        fetch(COINBASE_USDT_API)
      ]);
      
      let algoPrice = 0;
      let usdcPrice = 1;
      let usdtPrice = 1;
      
      if (algoResponse.ok) {
        const algoData = await algoResponse.json();
        algoPrice = parseFloat(algoData.data?.amount) || 0;
      }
      
      if (usdcResponse.ok) {
        const usdcData = await usdcResponse.json();
        usdcPrice = parseFloat(usdcData.data?.amount) || 1;
      }
      
      if (usdtResponse.ok) {
        const usdtData = await usdtResponse.json();
        usdtPrice = parseFloat(usdtData.data?.amount) || 1;
      }
      
      const newPrices: TokenPrices = {
        ALGO: algoPrice,
        USDC: usdcPrice,
        USDT: usdtPrice
      };
      
      setPrices(newPrices);
      setLastUpdated(new Date());
      setError(null);
      
      // Add to price history (keep last 20 data points for 60 seconds at 3s intervals)
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
      
      const newDataPoint: PriceDataPoint = {
        time: `${elapsedSeconds}s`,
        seconds: elapsedSeconds,
        ALGO: algoPrice,
        USDC: usdcPrice,
        USDT: usdtPrice
      };
      
      setPriceHistory(prev => {
        const updated = [...prev, newDataPoint];
        // Keep only last 20 data points (60 seconds at 3s intervals)
        if (updated.length > 20) {
          return updated.slice(-20);
        }
        return updated;
      });
      
    } catch (err) {
      console.error('Price fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchPrices, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPrices, refreshInterval]);

  return {
    prices,
    priceHistory,
    isLoading,
    error,
    lastUpdated
  };
};