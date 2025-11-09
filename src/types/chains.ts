/**
 * EVM compatible chains
 */
export const EVM_CHAINS = [
  'base',
  'arbitrum',
  'optimism',
  'polygon',
  'scroll',
  'bsc',
  'fantom',
  'linea',
  'mantle',
  'celo',
  'zksync',
  'avalanche',
  'ethereum'
] as const;

/**
 * Development chains with nested EVM chains
 */
export const DEV_CHAINS = [
  EVM_CHAINS,
  'solana', 
  'tron'
] as const;

/**
 * Production chains with nested EVM chains
 */
export const PROD_CHAINS = [
  ['base-sepolia']
] as const;

/**
 * Chain ID mappings
 */
export const CHAIN_IDS: Record<string, number> = {
  'ethereum': 1,
  'base': 8453,
  'arbitrum': 42161,
  'optimism': 10,
  'polygon': 137,
  'scroll': 534352,
  'bsc': 56,
  'fantom': 250,
  'linea': 59144,
  'mantle': 5000,
  'celo': 42220,
  'zksync': 324,
  'avalanche': 43114,
  'base-sepolia': 84532,
} as const;

/**
 * Get chains based on environment
 * Development: base, arbitrum, optimism, polygon, scroll, bsc, fantom, linea, mantle, celo, zksync, avalanche, ethereum, solana, tron
 * Production: base-sepolia
 */
export const DEFAULT_CHAINS = (() => {
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
  
  const chains = isDev ? DEV_CHAINS : PROD_CHAINS;
  
  // Flatten nested arrays
  return chains.flat() as readonly string[];
})();

/**
 * Default asset to use for wallet generation
 */
export const DEFAULT_ASSET = 'USDC';

/**
 * Get chain ID by chain name
 */
export function getChainId(chainName: string): number | undefined {
  return CHAIN_IDS[chainName.toLowerCase()]
}

/**
 * Get chain name by chain ID
 */
export function getChainName(chainId: number): string | undefined {
  return Object.entries(CHAIN_IDS).find(([_, id]) => id === chainId)?.[0]
}
