import { env } from '../../../config/env';

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

