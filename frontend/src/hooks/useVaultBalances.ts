import { useState, useEffect, useCallback } from 'react';
import { useAlgorandWallet as useWallet } from '@/contexts/AlgorandWalletContext';
import { apiService, Vault, VaultBalance } from '@/services/ApiService';

// Coinbase API endpoints
const COINBASE_ALGO_API = 'https://api.coinbase.com/v2/prices/ALGO-USD/spot';
const COINBASE_USDC_API = 'https://api.coinbase.com/v2/prices/USDC-USD/spot';
const COINBASE_USDT_API = 'https://api.coinbase.com/v2/prices/USDT-USD/spot';

export interface VaultBalanceWithUSD extends VaultBalance {
  usdValue: string;
  formattedBalance: string;
}

export interface UseVaultBalancesReturn {
  vaultBalances: VaultBalanceWithUSD[];
  totalUsdValue: string;
  vault: Vault | null;
  isLoading: boolean;
  error: string | null;
  refreshBalances: () => Promise<void>;
}

export const useVaultBalances = (): UseVaultBalancesReturn => {
  const { account, connected } = useWallet();
  const [prices, setPrices] = useState({ ALGO: 0, USDC: 1, USDT: 1 });
  
  const [vault, setVault] = useState<Vault | null>(null);
  const [vaultBalances, setVaultBalances] = useState<VaultBalanceWithUSD[]>([]);
  const [totalUsdValue, setTotalUsdValue] = useState('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch live prices from Coinbase
  const fetchPrices = useCallback(async () => {
    try {
      const [aptResponse, usdcResponse, usdtResponse] = await Promise.all([
        fetch(COINBASE_ALGO_API),
        fetch(COINBASE_USDC_API),
        fetch(COINBASE_USDT_API)
      ]);
      
      let aptPrice = 0;
      let usdcPrice = 1;
      let usdtPrice = 1;
      
      if (aptResponse.ok) {
        const aptData = await aptResponse.json();
        aptPrice = parseFloat(aptData.data?.amount) || 0;
      }
      
      if (usdcResponse.ok) {
        const usdcData = await usdcResponse.json();
        usdcPrice = parseFloat(usdcData.data?.amount) || 1;
      }
      
      if (usdtResponse.ok) {
        const usdtData = await usdtResponse.json();
        usdtPrice = parseFloat(usdtData.data?.amount) || 1;
      }
      
      setPrices({ ALGO: aptPrice, USDC: usdcPrice, USDT: usdtPrice });
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    }
  }, []);

  const calculateUsdValues = useCallback((balances: VaultBalance[]) => {
    let total = 0;
    
    const balancesWithUSD: VaultBalanceWithUSD[] = balances.map(balance => {
      const symbol = balance.coinSymbol.toUpperCase();
      const decimals = symbol === 'ALGO' ? 8 : 6;
      const balanceAmount = parseFloat(balance.balance) / Math.pow(10, decimals);
      const price = prices[symbol as keyof typeof prices] || 0;
      const usdValue = balanceAmount * price;
      
      total += usdValue;
      
      return {
        ...balance,
        formattedBalance: symbol === 'ALGO' ? balanceAmount.toFixed(4) : balanceAmount.toFixed(2),
        usdValue: usdValue.toFixed(2)
      };
    });
    
    setVaultBalances(balancesWithUSD);
    setTotalUsdValue(total.toFixed(2));
  }, [prices]);

  const fetchVaultBalances = useCallback(async () => {
    if (!connected || !account?.address) {
      setVaultBalances([]);
      setTotalUsdValue('0.00');
      setVault(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch prices first
      await fetchPrices();
      
      const response = await apiService.getUserVault(account.address);
      
      if (response.success && response.data) {
        setVault(response.data);
        calculateUsdValues(response.data.balances);
      } else {
        setError(response.error || 'Failed to fetch vault balances');
        setVaultBalances([]);
        setTotalUsdValue('0.00');
      }
    } catch (err) {
      console.error('Vault balances fetch error:', err);
      setError(err instanceof Error ? err.message : 'Network error');
      setVaultBalances([]);
      setTotalUsdValue('0.00');
    } finally {
      setIsLoading(false);
    }
  }, [connected, account?.address, fetchPrices, calculateUsdValues]);

  const refreshBalances = useCallback(async () => {
    await fetchVaultBalances();
  }, [fetchVaultBalances]);

  // Fetch balances when wallet connects
  useEffect(() => {
    fetchVaultBalances();
  }, [fetchVaultBalances]);

  // Recalculate USD values when prices change
  useEffect(() => {
    if (vault?.balances && prices.ALGO > 0) {
      calculateUsdValues(vault.balances);
    }
  }, [vault?.balances, prices, calculateUsdValues]);

  return {
    vaultBalances,
    totalUsdValue,
    vault,
    isLoading,
    error,
    refreshBalances
  };
};