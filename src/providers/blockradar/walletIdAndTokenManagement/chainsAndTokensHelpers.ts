import { 
  DEV_EVM_CHAINS,
  DEV_NON_EVM_CHAINS,
  PROD_EVM_CHAINS,
  PROD_NON_EVM_CHAINS
} from '../../../config/walletAndChain';

// Helper to determine environment
const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';

/**
 * Get all chains with tokens for current environment
 */
const ALL_CHAINS_WITH_TOKENS = isDev
  ? { ...DEV_EVM_CHAINS, ...DEV_NON_EVM_CHAINS }
  : { ...PROD_EVM_CHAINS, ...PROD_NON_EVM_CHAINS };

/**
 * Get EVM chains for current environment
 */
export const EVM_CHAINS = Object.keys(isDev ? DEV_EVM_CHAINS : PROD_EVM_CHAINS);

/**
 * Get all chains for current environment (flattened)
 */
export const DEFAULT_CHAINS = Object.keys(ALL_CHAINS_WITH_TOKENS);

/**
 * Get supported tokens for a chain
 */
export function getSupportedTokensForChain(chain: string): readonly string[] {
  return ALL_CHAINS_WITH_TOKENS[chain as keyof typeof ALL_CHAINS_WITH_TOKENS] || [];
}

/**
 * Check if a token is supported on a chain
 */
export function isTokenSupportedOnChain(chain: string, token: string): boolean {
  const supportedTokens = getSupportedTokensForChain(chain);
  return supportedTokens.includes(token.toUpperCase());
}

/**
 * Check if a chain is supported in current environment
 */
export function isChainSupported(chain: string): boolean {
  return DEFAULT_CHAINS.includes(chain);
}

/**
 * Validate chains - throws error if any chain is not supported
 */
export function validateChains(chains: readonly string[]): void {
  const unsupportedChains = chains.filter(chain => !isChainSupported(chain));
  
  if (unsupportedChains.length > 0) {
    const envType = isDev ? 'development' : 'production';
    throw new Error(
      `Invalid chain(s): ${unsupportedChains.join(', ')}. ` +
      `Supported chains in ${envType}: ${DEFAULT_CHAINS.join(', ')}`
    );
  }
}

/**
 * Get all supported token-chain combinations
 */
export function getAllSupportedTokenChains(): Array<{ chain: string; token: string }> {
  const combinations: Array<{ chain: string; token: string }> = [];
  
  Object.entries(ALL_CHAINS_WITH_TOKENS).forEach(([chain, tokens]) => {
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
