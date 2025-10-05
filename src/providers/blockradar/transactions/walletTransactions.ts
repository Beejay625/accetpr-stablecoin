import { BlockRadarBase } from '../base';

/**
 * Get wallet address transactions
 */
export async function getAddressTransactions(addressId: string): Promise<any> {
  BlockRadarBase.validateConfiguration();
  return await BlockRadarBase.request(`addresses/${addressId}/transactions`);
}