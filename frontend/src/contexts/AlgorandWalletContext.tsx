import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';
import { API_CONFIG } from '@/config/walletConfig';

// Token balance interface
interface TokenBalances {
  ALGO: string;
  USDC: string;
  USDT: string;
}

// Wallet information interface
interface WalletInfo {
  name: string;
  icon: string;
  url: string;
}

// Main wallet context type interface
interface AlgorandWalletContextType {
  // Connection state
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  
  // Account information
  account: {
    address: string;
    publicKey: string;
  } | null;
  
  // Network information
  network: string;
  
  // Wallet information
  wallet: WalletInfo | null;
  
  // Available wallets
  wallets: WalletInfo[];
  
  // Connection methods
  connect: (walletId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Balance information
  balances: TokenBalances;
  
  // Balance operations
  fetchBalances: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  
  // Smart contract operations
  smartContract: {
    isProcessing: boolean;
    error: string | null;
    depositALGOtoVault: (amount: string) => Promise<boolean>;
    depositTokenToVault: (amount: string, token: 'USDC' | 'USDT') => Promise<boolean>;
    withdrawFromVault: (amount: string, sourceToken: 'ALGO' | 'USDC' | 'USDT') => Promise<boolean>;
    swapTokens: (fromToken: string, toToken: string, amount: string) => Promise<boolean>;
    executeArbitrage: (inputAmount: string, tokenPair: string) => Promise<boolean>;
    optInToAsset: (assetId: number, assetName: string) => Promise<boolean>;
    optInToApp: () => Promise<boolean>;
    clearError: () => void;
  };
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Create the context
const AlgorandWalletContext = createContext<AlgorandWalletContextType | undefined>(undefined);

// Provider props interface
interface AlgorandWalletProviderProps {
  children: ReactNode;
}

// App configuration from environment
const APP_ID = parseInt(import.meta.env.VITE_APP_ID || '0');
const USDC_ASSET_ID = parseInt(import.meta.env.VITE_USDC_ASSET_ID || '0');
const USDT_ASSET_ID = parseInt(import.meta.env.VITE_USDT_ASSET_ID || '0');

// Wallet provider component
export const AlgorandWalletProvider: React.FC<AlgorandWalletProviderProps> = ({ children }) => {
  // Use the use-wallet v3 hooks
  const {
    wallets: availableWallets,
    activeWallet,
    activeAccount,
    isReady,
    signTransactions,
    algodClient
  } = useWallet();

  // Local state
  const [balances, setBalances] = useState<TokenBalances>({
    ALGO: '0',
    USDC: '0',
    USDT: '0'
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Convert wallet adapter data to our interface format
  const account = activeAccount ? {
    address: activeAccount.address,
    publicKey: activeAccount.address // Algorand uses address as public identifier
  } : null;

  const wallet: WalletInfo | null = activeWallet ? {
    name: activeWallet.metadata.name,
    icon: activeWallet.metadata.icon,
    url: ''
  } : null;

  const wallets: WalletInfo[] = availableWallets.map(w => ({
    name: w.metadata.name,
    icon: w.metadata.icon,
    url: ''
  }));

  // Check connection status - wallet is connected if we have both activeWallet and activeAccount
  const connected = Boolean(activeWallet && activeAccount);

  // Effect to log connection state changes
  useEffect(() => {
    console.log('Connection state:', { 
      connected, 
      hasWallet: !!activeWallet,
      walletActive: activeWallet?.isActive,
      hasAccount: !!activeAccount,
      accountAddress: activeAccount?.address,
      isReady 
    });
  }, [connected, activeWallet, activeAccount, isReady]);
  const connect = async (walletId: string) => {
    try {
      setConnecting(true);
      setError(null);
      
      const selectedWallet = availableWallets.find(
        w => w.id === walletId || w.metadata.name.toLowerCase() === walletId.toLowerCase()
      );
      
      if (!selectedWallet) {
        throw new Error(`Wallet ${walletId} not found`);
      }

      console.log('Connecting to wallet:', walletId);
      await selectedWallet.connect();
      
      // Wait for the connection to be fully established and state to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_id', selectedWallet.id);
      
      console.log('Wallet connected successfully');
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('wallet_id');
      throw err;
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      setDisconnecting(true);
      
      if (activeWallet) {
        await activeWallet.disconnect();
      }
      
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('wallet_id');
      
      setBalances({
        ALGO: '0',
        USDC: '0',
        USDT: '0'
      });
      
      clearError();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect wallet');
    } finally {
      setDisconnecting(false);
    }
  };

  // Balance fetching
  const fetchBalances = async () => {
    if (!account?.address || !algodClient) return;

    try {
      const accountInfo = await algodClient.accountInformation(account.address).do();
      
      const newBalances: TokenBalances = {
        ALGO: (accountInfo.amount / 1000000).toFixed(6),
        USDC: '0',
        USDT: '0'
      };

      // Check for ASA balances
      if (accountInfo.assets) {
        accountInfo.assets.forEach((asset: any) => {
          if (asset['asset-id'] === USDC_ASSET_ID) {
            newBalances.USDC = (asset.amount / 1000000).toFixed(6);
          } else if (asset['asset-id'] === USDT_ASSET_ID) {
            newBalances.USDT = (asset.amount / 1000000).toFixed(6);
          }
        });
      }

      setBalances(newBalances);
    } catch (err: any) {
      console.error('Failed to fetch balances:', err);
      setError(err.message || 'Failed to fetch balances');
    }
  };

  const refreshBalances = async () => {
    await fetchBalances();
  };

  // Smart contract operations
  const depositALGOtoVault = async (amount: string): Promise<boolean> => {
    if (!account?.address || !activeWallet || !algodClient) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const params = await algodClient.getTransactionParams().do();
      const amountMicroAlgo = Math.floor(parseFloat(amount) * 1000000);

      // Create payment transaction
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: account.address,
        to: algosdk.getApplicationAddress(APP_ID),
        amount: amountMicroAlgo,
        suggestedParams: params
      });

      // Create app call transaction with increased fee to cover potential inner transactions
      const appCallParams = { ...params };
      appCallParams.fee = 2000; // 2x min fee to cover app call + potential inner txn
      appCallParams.flatFee = true;
      
      const encoder = new TextEncoder();
      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: account.address,
        appIndex: APP_ID,
        appArgs: [encoder.encode('deposit_algo')],
        foreignAssets: [USDC_ASSET_ID, USDT_ASSET_ID], // Include all assets for inner transactions
        suggestedParams: appCallParams
      });

      // Group transactions
      const txns = [paymentTxn, appCallTxn];
      algosdk.assignGroupID(txns);

      // Sign and send using v4 API
      const encodedTxns = txns.map(txn => algosdk.encodeUnsignedTransaction(txn));
      const signedTxns = await signTransactions(encodedTxns);
      
      // Send all transactions as a group
      const signedTxnBytes = signedTxns.filter(txn => txn !== null);
      const txResult = await algodClient.sendRawTransaction(signedTxnBytes).do();
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txResult.txId, 4);
      
      console.log(`✅ Deposited ${amount} ALGO to vault - TxID: ${txResult.txId}`);

      // Log transaction to backend
      try {
        await fetch(`${API_CONFIG.backendUrl}/vault/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: account.address,
            coinSymbol: 'ALGO',
            amount: amountMicroAlgo.toString(),
            transactionHash: txResult.txId
          })
        });
      } catch (logError) {
        console.error('Failed to log transaction:', logError);
      }

      await refreshBalances();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to deposit ALGO');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const depositTokenToVault = async (amount: string, token: 'USDC' | 'USDT'): Promise<boolean> => {
    if (!account?.address || !activeWallet || !algodClient) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const params = await algodClient.getTransactionParams().do();
      const assetId = token === 'USDC' ? USDC_ASSET_ID : USDT_ASSET_ID;
      const amountMicro = Math.floor(parseFloat(amount) * 1000000);

      // Create asset transfer transaction
      const assetTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: account.address,
        to: algosdk.getApplicationAddress(APP_ID),
        amount: amountMicro,
        assetIndex: assetId,
        suggestedParams: params
      });

      // Create app call transaction with increased fee to cover potential inner transactions
      const appCallParams = { ...params };
      appCallParams.fee = 2000; // 2x min fee to cover app call + potential inner txn
      appCallParams.flatFee = true;
      
      const encoder = new TextEncoder();
      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: account.address,
        appIndex: APP_ID,
        appArgs: [encoder.encode(`deposit_${token.toLowerCase()}`)],
        foreignAssets: [USDC_ASSET_ID, USDT_ASSET_ID], // Include all assets for inner transactions
        suggestedParams: appCallParams
      });

      // Group transactions
      const txns = [assetTxn, appCallTxn];
      algosdk.assignGroupID(txns);

      // Sign and send using v4 API
      const encodedTxns = txns.map(txn => algosdk.encodeUnsignedTransaction(txn));
      const signedTxns = await signTransactions(encodedTxns);
      
      // Send all transactions as a group
      const signedTxnBytes = signedTxns.filter(txn => txn !== null);
      const txResult = await algodClient.sendRawTransaction(signedTxnBytes).do();

      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txResult.txId, 4);

      console.log(`✅ Deposited ${amount} ${token} to vault - TxID: ${txResult.txId}`);

      // Log transaction to backend
      try {
        await fetch(`${API_CONFIG.backendUrl}/vault/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: account.address,
            coinSymbol: token,
            amount: amountMicro.toString(),
            transactionHash: txResult.txId
          })
        });
      } catch (logError) {
        console.error('Failed to log transaction:', logError);
      }

      await refreshBalances();
      return true;
    } catch (err: any) {
      setError(err.message || `Failed to deposit ${token}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const withdrawFromVault = async (amount: string, sourceToken: 'ALGO' | 'USDC' | 'USDT'): Promise<boolean> => {
    if (!account?.address || !activeWallet || !algodClient) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const params = await algodClient.getTransactionParams().do();
      const amountMicro = Math.floor(parseFloat(amount) * 1000000);

      // Increase fee to cover inner transaction (withdrawal creates inner txn)
      const appCallParams = { ...params };
      appCallParams.fee = 2000; // 2x min fee to cover app call + inner txn
      appCallParams.flatFee = true;

      const encoder = new TextEncoder();
      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: account.address,
        appIndex: APP_ID,
        appArgs: [
          encoder.encode(`withdraw_${sourceToken.toLowerCase()}`),
          algosdk.encodeUint64(amountMicro)
        ],
        foreignAssets: [USDC_ASSET_ID, USDT_ASSET_ID], // Include all assets for inner transactions
        suggestedParams: appCallParams
      });

      // Sign and send using v4 API
      const encodedTxn = algosdk.encodeUnsignedTransaction(appCallTxn);
      const signedTxns = await signTransactions([encodedTxn]);
      
      if (signedTxns[0]) {
        const txResult = await algodClient.sendRawTransaction(signedTxns[0]).do();
        
        // Wait for confirmation
        await algosdk.waitForConfirmation(algodClient, txResult.txId, 4);
        
        console.log(`✅ Withdrew ${amount} ${sourceToken} from vault - TxID: ${txResult.txId}`);
        
        // Log transaction to backend
        try {
          await fetch(`${API_CONFIG.backendUrl}/vault/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: account.address,
              coinSymbol: sourceToken,
              amount: amountMicro.toString(),
              transactionHash: txResult.txId
            })
          });
        } catch (logError) {
          console.error('Failed to log transaction:', logError);
        }
      }

      await refreshBalances();
      return true;
    } catch (err: any) {
      setError(err.message || `Failed to withdraw ${sourceToken}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const swapTokens = async (fromToken: string, toToken: string, amount: string): Promise<boolean> => {
    if (!account?.address || !activeWallet || !algodClient) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const params = await algodClient.getTransactionParams().do();
      const amountMicro = Math.floor(parseFloat(amount) * 1000000);

      // Swaps don't create inner txns, but use standard fee
      const appCallParams = { ...params };
      appCallParams.fee = 1000; // Standard min fee
      appCallParams.flatFee = true;

      const encoder = new TextEncoder();
      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: account.address,
        appIndex: APP_ID,
        appArgs: [
          encoder.encode(`swap_${fromToken.toLowerCase()}_to_${toToken.toLowerCase()}`),
          algosdk.encodeUint64(amountMicro)
        ],
        foreignAssets: [USDC_ASSET_ID, USDT_ASSET_ID], // Include all assets for inner transactions
        suggestedParams: appCallParams
      });

      // Sign and send using v4 API
      const encodedTxn = algosdk.encodeUnsignedTransaction(appCallTxn);
      const signedTxns = await signTransactions([encodedTxn]);
      
      if (signedTxns[0]) {
        await algodClient.sendRawTransaction(signedTxns[0]).do();
      }

      await refreshBalances();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to swap tokens');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const executeArbitrage = async (inputAmount: string, tokenPair: string): Promise<boolean> => {
    if (!account?.address || !activeWallet || !algodClient) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const params = await algodClient.getTransactionParams().do();
      const amountMicro = Math.floor(parseFloat(inputAmount) * 1000000);

      // Arbitrage might create inner txns, use higher fee
      const appCallParams = { ...params };
      appCallParams.fee = 2000; // 2x min fee to cover potential inner txns
      appCallParams.flatFee = true;

      const encoder = new TextEncoder();
      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: account.address,
        appIndex: APP_ID,
        appArgs: [
          encoder.encode('execute_arbitrage'),
          algosdk.encodeUint64(amountMicro)
        ],
        foreignAssets: [USDC_ASSET_ID, USDT_ASSET_ID], // Include all assets for inner transactions
        suggestedParams: appCallParams
      });

      // Sign and send using v4 API
      const encodedTxn = algosdk.encodeUnsignedTransaction(appCallTxn);
      const signedTxns = await signTransactions([encodedTxn]);
      
      if (signedTxns[0]) {
        await algodClient.sendRawTransaction(signedTxns[0]).do();
      }

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to execute arbitrage');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Opt-in to an asset
  const optInToAsset = async (assetId: number, assetName: string): Promise<boolean> => {
    if (!account?.address || !activeWallet || !algodClient) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Check if already opted in
      const accountInfo = await algodClient.accountInformation(account.address).do();
      const assets = accountInfo.assets || [];
      const alreadyOptedIn = assets.some((asset: any) => asset['asset-id'] === assetId);

      if (alreadyOptedIn) {
        console.log(`✅ Already opted into ${assetName}`);
        setError(`Already opted into ${assetName}`);
        return true; // Return true since the goal is achieved
      }

      const params = await algodClient.getTransactionParams().do();

      // Create asset opt-in transaction (amount = 0, send to self)
      const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: account.address,
        to: account.address,
        amount: 0,
        assetIndex: assetId,
        suggestedParams: params
      });

      // Sign and send
      const encodedTxn = algosdk.encodeUnsignedTransaction(optInTxn);
      const signedTxns = await signTransactions([encodedTxn]);
      
      if (signedTxns[0]) {
        const txResult = await algodClient.sendRawTransaction(signedTxns[0]).do();
        await algosdk.waitForConfirmation(algodClient, txResult.txId, 4);
        console.log(`✅ Opted into ${assetName} (Asset ID: ${assetId})`);
      }

      await refreshBalances();
      return true;
    } catch (err: any) {
      const errorMsg = err.message || `Failed to opt-in to ${assetName}`;
      // Check if error is about already opted in
      if (errorMsg.includes('already opted in') || errorMsg.includes('has already opted')) {
        console.log(`✅ Already opted into ${assetName}`);
        return true;
      }
      setError(errorMsg);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Opt-in to the vault app
  const optInToApp = async (): Promise<boolean> => {
    if (!account?.address || !activeWallet || !algodClient) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Check if already opted in
      const accountInfo = await algodClient.accountInformation(account.address).do();
      const apps = accountInfo['apps-local-state'] || [];
      const alreadyOptedIn = apps.some((app: any) => app.id === APP_ID);

      if (alreadyOptedIn) {
        console.log(`✅ Already opted into Vault contract`);
        setError('Already opted into Vault contract');
        return true; // Return true since the goal is achieved
      }

      const params = await algodClient.getTransactionParams().do();

      // Create app opt-in transaction
      const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
        from: account.address,
        appIndex: APP_ID,
        suggestedParams: params
      });

      // Sign and send
      const encodedTxn = algosdk.encodeUnsignedTransaction(optInTxn);
      const signedTxns = await signTransactions([encodedTxn]);
      
      if (signedTxns[0]) {
        const txResult = await algodClient.sendRawTransaction(signedTxns[0]).do();
        await algosdk.waitForConfirmation(algodClient, txResult.txId, 4);
        console.log(`✅ Opted into Vault contract (App ID: ${APP_ID})`);
      }

      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to opt-in to Vault';
      // Check if error is about already opted in
      if (errorMsg.includes('already opted in') || errorMsg.includes('has already opted')) {
        console.log(`✅ Already opted into Vault contract`);
        return true;
      }
      setError(errorMsg);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Effect to fetch balances when account changes
  useEffect(() => {
    if (connected && account?.address) {
      console.log('Fetching balances for:', account.address);
      fetchBalances();
    }
  }, [connected, account?.address]);

  // Effect to restore connection state
  useEffect(() => {
    const wasConnected = localStorage.getItem('wallet_connected');
    const walletId = localStorage.getItem('wallet_id');
    
    if (wasConnected === 'true' && walletId && !connected && isReady) {
      console.log('Restoring wallet connection:', walletId);
      connect(walletId).catch(console.error);
    }
  }, [isReady, connected]);

  const contextValue: AlgorandWalletContextType = {
    connected,
    connecting,
    disconnecting,
    account,
    network: 'testnet',
    wallet,
    wallets,
    connect,
    disconnect,
    balances,
    fetchBalances,
    refreshBalances,
    smartContract: {
      isProcessing,
      error,
      depositALGOtoVault,
      depositTokenToVault,
      withdrawFromVault,
      swapTokens,
      executeArbitrage,
      optInToAsset,
      optInToApp,
      clearError
    },
    error,
    clearError
  };

  return (
    <AlgorandWalletContext.Provider value={contextValue}>
      {children}
    </AlgorandWalletContext.Provider>
  );
};

// Custom hook for accessing wallet context
export const useAlgorandWallet = (): AlgorandWalletContextType => {
  const context = useContext(AlgorandWalletContext);
  if (context === undefined) {
    throw new Error('useAlgorandWallet must be used within an AlgorandWalletProvider');
  }
  return context;
};

export type { AlgorandWalletContextType, TokenBalances, WalletInfo };
