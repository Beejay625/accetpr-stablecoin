import { env } from '../../../config/env';

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

