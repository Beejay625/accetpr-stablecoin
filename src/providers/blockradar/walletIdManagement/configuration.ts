import { env } from '../../../config/env';

/**
 * BlockRadar Wallet Configuration
 * This file contains all chain and wallet ID mappings
 */

/**
 * Map of chain names to their environment variable wallet IDs
 * Currently only Base chain is supported (works for both base and base-sepolia)
 * 
 * Format: 'chain1,chain2': walletId (comma-separated chains share the same wallet ID)
 */
export const CHAIN_WALLET_MAP: Record<string, string> = Object.fromEntries(
  Object.entries({
    'base,base-sepolia': env.BLOCKRADAR_BASE_WALLET_ID,
    // 'arbitrum': env.BLOCKRADAR_ARBITRUM_WALLET_ID,
    // 'ethereum': env.BLOCKRADAR_ETHEREUM_WALLET_ID,
    // 'polygon': env.BLOCKRADAR_POLYGON_WALLET_ID,
    // 'optimism': env.BLOCKRADAR_OPTIMISM_WALLET_ID,
    // 'solana': env.BLOCKRADAR_SOLANA_WALLET_ID,
    // 'tron': env.BLOCKRADAR_TRON_WALLET_ID,
  })
  .flatMap(([chains, walletId]) => 
    chains.split(',').map(chain => [chain.trim(), walletId])
  )
  .filter(([_, value]) => value !== undefined)
) as Record<string, string>;

/**
 * EVM compatible chains for development
 */
export const EVM_CHAINS_DEV = [
  'base-sepolia',
  // 'arbitrum'
] as const;

/**
 * EVM compatible chains for production
 */
export const EVM_CHAINS_PROD = [
  'base'
] as const;

/**
 * Development chains with nested EVM chains
 */
export const DEV_CHAINS = [
  EVM_CHAINS_DEV,
  // 'solana', 
  // 'tron'
] as const;

/**
 * Production chains with nested EVM chains
 */
export const PROD_CHAINS = [
  EVM_CHAINS_PROD
] as const;

/**
 * Get EVM chains based on environment
 */
export const EVM_CHAINS = (() => {
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
  return isDev ? EVM_CHAINS_DEV : EVM_CHAINS_PROD;
})();

/**
 * Get chains based on environment
 * Development: base-sepolia
 * Production: base
 */
export const DEFAULT_CHAINS = (() => {
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
  
  const chains = isDev ? DEV_CHAINS : PROD_CHAINS;
  
  // Flatten nested arrays
  return chains.flat() as readonly string[];
})();

/**
 * Supported tokens per chain for development
 */
export const DEV_SUPPORTED_TOKENS = {
  'base-sepolia': ['USDC'],
  // base: ['USDC'],
  // arbitrum: ['USDC', 'USDT'],
  // solana: ['USDC', 'USDT'],
  // tron: ['USDT']
} as const;

/**
 * Supported tokens per chain for production
 */
export const PROD_SUPPORTED_TOKENS = {
  'base': ['USDC']
} as const;

/**
 * Get supported tokens based on environment
 */
export const SUPPORTED_TOKENS = (() => {
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
  return isDev ? DEV_SUPPORTED_TOKENS : PROD_SUPPORTED_TOKENS;
})();

/**
 * Get supported tokens for a chain
 */
export function getSupportedTokensForChain(chain: string): readonly string[] {
  return SUPPORTED_TOKENS[chain as keyof typeof SUPPORTED_TOKENS] || [];
}

/**
 * Check if a token is supported on a chain
 */
export function isTokenSupportedOnChain(chain: string, token: string): boolean {
  const supportedTokens = getSupportedTokensForChain(chain);
  return supportedTokens.includes(token.toUpperCase());
}

/**
 * Get all supported token-chain combinations
 */
export function getAllSupportedTokenChains(): Array<{ chain: string; token: string }> {
  const combinations: Array<{ chain: string; token: string }> = [];
  
  Object.entries(SUPPORTED_TOKENS).forEach(([chain, tokens]) => {
    tokens.forEach(token => {
      combinations.push({ chain, token });
    });
  });
  
  return combinations;
}

/**
 * Default asset to use for wallet generation
 */
export const DEFAULT_ASSET = 'USDC';


