import { BlockRadarBase } from '../base';
import { WalletBalanceResponse } from './walletBalance.interface';

/**
 * Get wallet address balance
 */
export async function getAddressBalance(addressId: string): Promise<{ convertedBalance: string; chain: string; asset: string }> {
  const response = await BlockRadarBase.request(`addresses/${addressId}/balance`) as WalletBalanceResponse;
  
  return {
    convertedBalance: response.data.convertedBalance,
    chain: response.data.asset.asset.blockchain.slug,
    asset: response.data.asset.asset.symbol
  };
}