import { BlockRadarBase } from '../base';

/**
 * Get wallet address balance
 */
export async function getAddressBalance(walletId: string, addressId: string): Promise<any> {
  return await BlockRadarBase.request(`/wallets/${walletId}/addresses/${addressId}/balances`);
}