import { BlockRadarBase } from './base';

/**
 * Generate wallet address
 */
export async function generateAddress(walletId: string, addressName: string): Promise<any> {
  BlockRadarBase.validateConfiguration();
  return await BlockRadarBase.request(`/wallets/${walletId}/addresses`, 'POST', { name: addressName });
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(walletId: string): Promise<any> {
  BlockRadarBase.validateConfiguration();
  return await BlockRadarBase.request(`/wallets/${walletId}/balance`);
}
