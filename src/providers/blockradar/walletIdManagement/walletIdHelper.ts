import { env } from '../../../config/env';

/**
 * Get the appropriate BlockRadar wallet ID based on chain
 * 
 * @param chain - The blockchain (e.g., 'base', 'solana', 'tron', 'arbitrum') or 'default'
 * @returns The wallet ID for the specified chain
 * @throws Error if wallet ID is not configured
 */
export function getWalletIdForChain(chain: string = 'default'): string {
  const chainLower = chain.toLowerCase();
  
  // If explicitly requesting default, use any available wallet ID
  if (chainLower === 'default') {
    const walletId = env.BLOCKRADAR_BASE_WALLET_ID || 
                     env.BLOCKRADAR_ARBITRUM_WALLET_ID || 
                     env.BLOCKRADAR_ETHEREUM_WALLET_ID ||
                     env.BLOCKRADAR_POLYGON_WALLET_ID ||
                     env.BLOCKRADAR_OPTIMISM_WALLET_ID ||
                     env.BLOCKRADAR_SOLANA_WALLET_ID || 
                     env.BLOCKRADAR_TRON_WALLET_ID;
    
    if (!walletId) {
      throw new Error(`No wallet ID configured. Please set at least one chain-specific wallet ID in environment`);
    }
    return walletId as string;
  }
  
  // Base chain
  if (chainLower === 'base') {
    const walletId = env.BLOCKRADAR_BASE_WALLET_ID;
    if (!walletId) {
      throw new Error(`Base wallet ID not configured. Please set BLOCKRADAR_BASE_WALLET_ID in environment`);
    }
    return walletId as string;
  }
  
  // Arbitrum chain
  if (chainLower === 'arbitrum') {
    const walletId = env.BLOCKRADAR_ARBITRUM_WALLET_ID;
    if (!walletId) {
      throw new Error(`Arbitrum wallet ID not configured. Please set BLOCKRADAR_ARBITRUM_WALLET_ID in environment`);
    }
    return walletId as string;
  }
  
  // Ethereum chain
  if (chainLower === 'ethereum') {
    const walletId = env.BLOCKRADAR_ETHEREUM_WALLET_ID;
    if (!walletId) {
      throw new Error(`Ethereum wallet ID not configured. Please set BLOCKRADAR_ETHEREUM_WALLET_ID in environment`);
    }
    return walletId as string;
  }
  
  // Polygon chain
  if (chainLower === 'polygon') {
    const walletId = env.BLOCKRADAR_POLYGON_WALLET_ID;
    if (!walletId) {
      throw new Error(`Polygon wallet ID not configured. Please set BLOCKRADAR_POLYGON_WALLET_ID in environment`);
    }
    return walletId as string;
  }
  
  // Optimism chain
  if (chainLower === 'optimism') {
    const walletId = env.BLOCKRADAR_OPTIMISM_WALLET_ID;
    if (!walletId) {
      throw new Error(`Optimism wallet ID not configured. Please set BLOCKRADAR_OPTIMISM_WALLET_ID in environment`);
    }
    return walletId as string;
  }
  
  // Solana chain
  if (chainLower === 'solana') {
    const walletId = env.BLOCKRADAR_SOLANA_WALLET_ID;
    if (!walletId) {
      throw new Error(`Solana wallet ID not configured. Please set BLOCKRADAR_SOLANA_WALLET_ID in environment`);
    }
    return walletId as string;
  }
  
  // Tron chain
  if (chainLower === 'tron') {
    const walletId = env.BLOCKRADAR_TRON_WALLET_ID;
    if (!walletId) {
      throw new Error(`Tron wallet ID not configured. Please set BLOCKRADAR_TRON_WALLET_ID in environment`);
    }
    return walletId as string;
  }
  
  throw new Error(`Unsupported chain: ${chain}. Supported chains: base, arbitrum, ethereum, polygon, optimism, solana, tron, or use 'default'`);
}

