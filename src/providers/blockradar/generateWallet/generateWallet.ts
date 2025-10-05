import { BlockRadarBase } from '../base';
import { GenerateWalletResponse } from './generateWallet.interface';

/**
 * Simple wallet address generation
 */
export class GenerateWalletProvider extends BlockRadarBase {
  static async generateAddress(name: string): Promise<{ address: string; addressId: string }> {
    const response = await this.request('addresses', 'POST', { name }) as GenerateWalletResponse;
    
    return {
      address: response.data.address,
      addressId: response.data.id
    };
  }
}

/**
 * Generate wallet address function
 */
export async function generateAddress(name: string): Promise<{ address: string; addressId: string }> {
  return await GenerateWalletProvider.generateAddress(name);
}
