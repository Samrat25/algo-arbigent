/**
 * Algorand Wallet Configuration
 * 
 * This file configures wallets for use-wallet v3.x
 * Supporting Pera, Defly, and Lute wallets on Algorand Testnet
 * 
 * Documentation: https://txnlab.gitbook.io/use-wallet/v3
 */

import { WalletId, WalletManager, NetworkId } from '@txnlab/use-wallet-react';

// Get Algorand node configuration from environment variables
const ALGOD_SERVER = import.meta.env.VITE_ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = import.meta.env.VITE_ALGOD_TOKEN || '';
const ALGOD_PORT = import.meta.env.VITE_ALGOD_PORT || '';

/**
 * Wallet Manager Configuration
 * 
 * Configured wallets:
 * - Pera Wallet: Mobile-first wallet with robust dApp integration
 * - Defly Wallet: Mobile wallet with advanced DeFi features  
 * - Lute Wallet: Browser extension wallet with Ledger support
 */
export const walletManager = new WalletManager({
  wallets: [
    WalletId.PERA,
    WalletId.DEFLY,
    {
      id: WalletId.LUTE,
      options: { siteName: 'Arbigent' }
    }
  ],
  network: NetworkId.TESTNET,
  algod: {
    token: ALGOD_TOKEN,
    baseServer: ALGOD_SERVER,
    port: ALGOD_PORT
  }
});

/**
 * Wallet Information
 * 
 * Useful for displaying wallet installation links and information
 */
export const WALLET_INFO = {
  PERA: {
    name: 'Pera Wallet',
    description: 'Mobile-first wallet with robust dApp integration features',
    downloadUrl: 'https://perawallet.app/',
    chromeExtension: 'https://chromewebstore.google.com/detail/pera-wallet/kfgilfbdgmhfnbhkjjjjjjjjjjjjjjjj',
    platforms: ['iOS', 'Android', 'Web', 'Chrome Extension']
  },
  DEFLY: {
    name: 'Defly Wallet',
    description: 'Mobile wallet with advanced DeFi features',
    downloadUrl: 'https://defly.app/',
    platforms: ['iOS', 'Android', 'Web']
  },
  LUTE: {
    name: 'Lute Wallet',
    description: 'Browser extension wallet with Ledger hardware support',
    downloadUrl: 'https://lute.app/',
    chromeExtension: 'https://chromewebstore.google.com/detail/lute/kiaoohollfkjhikdifohdckeidckokjh',
    platforms: ['Chrome Extension', 'Web']
  }
} as const;

/**
 * Helper function to get wallet download URL
 */
export function getWalletDownloadUrl(walletId: string): string {
  switch (walletId.toLowerCase()) {
    case 'pera':
      return WALLET_INFO.PERA.downloadUrl;
    case 'defly':
      return WALLET_INFO.DEFLY.downloadUrl;
    case 'lute':
      return WALLET_INFO.LUTE.downloadUrl;
    default:
      return 'https://algorand.com/ecosystem/wallets';
  }
}

/**
 * Helper function to check if wallet is installed
 */
export function isWalletInstalled(walletId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  switch (walletId.toLowerCase()) {
    case 'pera':
      // Check for Pera Wallet extension or mobile bridge
      return !!(window as any).algorand || !!(window as any).PeraWallet;
    case 'defly':
      // Check for Defly Wallet
      return !!(window as any).defly;
    case 'lute':
      // Check for Lute Wallet extension
      return !!(window as any).lute;
    default:
      return false;
  }
}

/**
 * API Configuration
 */
export const API_CONFIG = {
  backendUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  arbitrageApiUrl: import.meta.env.VITE_ARBITRAGE_API_URL || 'https://api.arbigent.com'
};
