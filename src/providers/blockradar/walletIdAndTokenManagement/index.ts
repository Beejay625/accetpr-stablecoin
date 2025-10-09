/**
 * Centralized wallet ID management for BlockRadar
 * 
 * This module handles wallet ID selection and configuration
 * for different blockchain networks.
 */

export { getWalletIdForChain } from './walletIdHelpers';
export { 
  CHAIN_WALLET_CONFIG,
  DEV_EVM_CHAINS,
  DEV_NON_EVM_CHAINS,
  PROD_EVM_CHAINS,
  PROD_NON_EVM_CHAINS
} from '../../../config/walletAndChain';
