/**
 * EVM compatible chains
 */
export const EVM_CHAINS = [
  'base',
  'arbitrum'
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
 * Get chains based on environment
 * Development: base, arbitrum, solana, tron
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
