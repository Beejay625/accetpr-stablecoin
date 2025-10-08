import { BlockRadarBase } from '../base';
import { WalletBalanceResponse } from './walletBalance.interface';
import { getWalletIdForChain } from '../walletIdManagement';

/**
 * Get wallet address balance
 * Uses default wallet ID since balance queries work with any wallet ID
 */
export async function getAddressBalance(addressId: string): Promise<{ convertedBalance: string; chain: string; asset: string }> {
  const walletId = getWalletIdForChain('default');
  const response = await BlockRadarBase.request(walletId, `addresses/${addressId}/balance`) as WalletBalanceResponse;
  
  return {
    convertedBalance: response.data.convertedBalance,
    chain: response.data.asset.asset.blockchain.slug,
    asset: response.data.asset.asset.symbol
  };
}