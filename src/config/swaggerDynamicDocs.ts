/**
 * Dynamic Swagger Documentation Helper
 * 
 * Generates environment-aware documentation for chains and tokens
 */

import { 
  DEFAULT_CHAINS, 
  getSupportedTokensForChain,
  getAllSupportedTokenChains 
} from '../providers/blockradar/walletIdAndTokenManagement/chainsAndTokensHelpers';

const isDev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';
const envName = isDev ? 'Development' : 'Production';

/**
 * Get supported chains as enum array for Swagger
 */
export function getSupportedChainsEnum(): string[] {
  return Array.from(DEFAULT_CHAINS);
}

/**
 * Get description text for chains with token support
 */
export function getChainsDescription(): string {
  const chainTokenCombos = getAllSupportedTokenChains();
  
  const chainMap = chainTokenCombos.reduce((acc, { chain, token }) => {
    if (!acc[chain]) {
      acc[chain] = [];
    }
    acc[chain].push(token);
    return acc;
  }, {} as Record<string, string[]>);
  
  let description = `**Supported Chains in ${envName}:**\n\n`;
  
  Object.entries(chainMap).forEach(([chain, tokens]) => {
    description += `- **${chain}**: ${tokens.join(', ')}\n`;
  });
  
  description += `\n**Current Environment:** ${envName}`;
  
  return description;
}

/**
 * Get supported tokens for a specific chain
 */
export function getTokensForChain(chain: string): string[] {
  return Array.from(getSupportedTokensForChain(chain));
}

/**
 * Get example chain for current environment
 */
export function getExampleChain(): string {
  return DEFAULT_CHAINS[0] || 'base';
}

/**
 * Get example token for current environment
 */
export function getExampleToken(): string {
  const exampleChain = getExampleChain();
  const tokens = getSupportedTokensForChain(exampleChain);
  return tokens[0] || 'USDC';
}

/**
 * Generate complete chain/token combination description for Swagger
 */
export function getChainTokenCombinationDocs(): string {
  const combos = getAllSupportedTokenChains();
  
  let docs = `**Currently Supported Combinations (${envName}):**\n\n`;
  
  const grouped = combos.reduce((acc, { chain, token }) => {
    if (!acc[chain]) {
      acc[chain] = [];
    }
    acc[chain].push(token);
    return acc;
  }, {} as Record<string, string[]>);
  
  Object.entries(grouped).forEach(([chain, tokens]) => {
    docs += `- **${chain}**: ${tokens.join(', ')}\n`;
  });
  
  docs += `\n**Note:** Supported chains and tokens vary by environment (NODE_ENV=${process.env['NODE_ENV']}).`;
  
  return docs;
}

/**
 * Export environment info
 */
export const swaggerEnvInfo = {
  environment: envName,
  supportedChains: getSupportedChainsEnum(),
  exampleChain: getExampleChain(),
  exampleToken: getExampleToken(),
  chainsDescription: getChainsDescription(),
  chainTokenDocs: getChainTokenCombinationDocs(),
};

