import { BlockRadarBase } from '../base';

/**
 * Generate wallet address
 */
export async function generateAddress(walletId: string, addressName: string): Promise<any> {
  return await BlockRadarBase.request(`/wallets/${walletId}/addresses`, 'POST', { name: addressName });
}

// Export types
export * from './generateWallet.interface';