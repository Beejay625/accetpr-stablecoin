import { env } from '../../../config/env';

/**
 * Map of chain names to their environment variable wallet IDs
 */
const CHAIN_WALLET_MAP: Record<string, string | undefined> = {
  base: env.BLOCKRADAR_BASE_WALLET_ID,
  arbitrum: env.BLOCKRADAR_ARBITRUM_WALLET_ID,
  ethereum: env.BLOCKRADAR_ETHEREUM_WALLET_ID,
  polygon: env.BLOCKRADAR_POLYGON_WALLET_ID,
  optimism: env.BLOCKRADAR_OPTIMISM_WALLET_ID,
  solana: env.BLOCKRADAR_SOLANA_WALLET_ID,
  tron: env.BLOCKRADAR_TRON_WALLET_ID,
};

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
    const walletId = Object.values(CHAIN_WALLET_MAP).find(id => id);
    
    if (!walletId) {
      throw new Error(`No wallet ID configured. Please set at least one chain-specific wallet ID in environment`);
    }
    return walletId;
  }
  
  // Get wallet ID for specific chain
  const walletId = CHAIN_WALLET_MAP[chainLower];
  
  if (!walletId) {
    const supportedChains = Object.keys(CHAIN_WALLET_MAP).join(', ');
    throw new Error(
      `${chainLower.charAt(0).toUpperCase() + chainLower.slice(1)} wallet ID not configured. ` +
      `Please set BLOCKRADAR_${chainLower.toUpperCase()}_WALLET_ID in environment. ` +
      `Supported chains: ${supportedChains}, or use 'default'`
    );
  }
  
  return walletId;
}

