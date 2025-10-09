/**
 * Development chains
 */
export const DEV_CHAINS = ['base'] as const;

/**
 * Production chains
 */
export const PROD_CHAINS = ['base-sepolia'] as const;

/**
 * Get chains based on environment
 */
export const DEFAULT_CHAINS = (() => {
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
  return isDev ? DEV_CHAINS : PROD_CHAINS;
})();

/**
 * Default asset to use for wallet generation
 */
export const DEFAULT_ASSET = 'USDC';
