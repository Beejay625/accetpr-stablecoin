import { env } from '../../../config/env';

/**
 * Development Chains Configuration
 */
export const DEV_EVM_CHAINS = [
  'base-sepolia',
  // 'arbitrum'
] as const;

export const DEV_NON_EVM_CHAINS = [
  // 'solana', 
  // 'tron'
] as const;

/**
 * Production Chains Configuration
 */
export const PROD_EVM_CHAINS = [
  'base'
] as const;

export const PROD_NON_EVM_CHAINS = [
  // No non-EVM chains in production yet
] as const;


/**
 * Chain to Wallet ID Configuration
 * 
 * Format: 'chain1,chain2': walletId 
 * Comma-separated chains will share the same wallet ID
 */
export const CHAIN_WALLET_CONFIG = {
  'base,base-sepolia': env.BLOCKRADAR_BASE_WALLET_ID,
  // 'arbitrum': env.BLOCKRADAR_ARBITRUM_WALLET_ID,
  // 'ethereum': env.BLOCKRADAR_ETHEREUM_WALLET_ID,
  // 'polygon': env.BLOCKRADAR_POLYGON_WALLET_ID,
  // 'optimism': env.BLOCKRADAR_OPTIMISM_WALLET_ID,
  // 'solana': env.BLOCKRADAR_SOLANA_WALLET_ID,
  // 'tron': env.BLOCKRADAR_TRON_WALLET_ID,
};

