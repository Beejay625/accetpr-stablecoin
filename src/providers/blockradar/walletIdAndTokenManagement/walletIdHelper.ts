import { CHAIN_WALLET_CONFIG } from '../../../../configuration';

/**
 * Process the configuration to create a lookup map
 * Expands comma-separated chains into individual entries
 */
const CHAIN_WALLET_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(CHAIN_WALLET_CONFIG)
    .flatMap(([chains, walletId]) => 
      chains.split(',').map(chain => [chain.trim(), walletId])
    )
    .filter(([_, value]) => value !== undefined)
) as Record<string, string>;

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
    const walletId = Object.values(CHAIN_WALLET_MAP)[0];
    
    if (!walletId) {
      throw new Error(`No wallet ID configured. Please set at least one chain-specific wallet ID in environment`);
    }
    return walletId;
  }
  
  // Get wallet ID for specific chain
  const walletId = CHAIN_WALLET_MAP[chainLower];
  
  if (!walletId) {
    const configuredChains = Object.keys(CHAIN_WALLET_MAP);
    const supportedChains = configuredChains.length > 0 
      ? configuredChains.join(', ')
      : 'none configured';
    
    throw new Error(
      `${chainLower.charAt(0).toUpperCase() + chainLower.slice(1)} wallet ID not configured. ` +
      `Please set BLOCKRADAR_${chainLower.toUpperCase()}_WALLET_ID in environment. ` +
      `Currently configured chains: ${supportedChains}`
    );
  }
  
  return walletId;
}

