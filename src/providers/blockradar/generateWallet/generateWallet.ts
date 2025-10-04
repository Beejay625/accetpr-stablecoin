import { BlockRadarBase } from '../base';

/**
 * Simple wallet address generation
 */
export class GenerateWalletProvider extends BlockRadarBase {
  static async generateAddress(walletId: string, options: any) {
    this.validateConfiguration();
    return await this.request(`/wallets/${walletId}/addresses`, 'POST', options);
  }
}

/**
 * Generate wallet address function
 */
export async function generateAddress(walletId: string, options: any) {
  return await GenerateWalletProvider.generateAddress(walletId, options);
}
