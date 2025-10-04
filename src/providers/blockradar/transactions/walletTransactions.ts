import { BlockRadarBase } from '../base';

/**
 * Get wallet address transactions
 */
export async function getAddressTransactions(walletId: string, addressId: string): Promise<any> {
  return await BlockRadarBase.request(`/wallets/${walletId}/addresses/${addressId}/transactions`);
}