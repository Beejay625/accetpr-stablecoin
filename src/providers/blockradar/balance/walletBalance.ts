import { BlockRadarBase } from '../base';
import { getWalletIdForChain } from '../walletIdAndTokenManagement';

/**
 * Get wallet address balances for all assets
 * Returns array of balances for all assets on the address
 */
export async function getAddressBalance(addressId: string): Promise<{ convertedBalance: string; chain: string; asset: string }[]> {
  const walletId = getWalletIdForChain('default');
  const response = await BlockRadarBase.request(walletId, `addresses/${addressId}/balances`);
  
  // Map all asset balances
  const balances = response.data.map((item: any) => ({
    convertedBalance: item.convertedBalance,
    chain: item.asset.asset.blockchain.slug,
    asset: item.asset.asset.symbol
  }));
  
  return balances;
}