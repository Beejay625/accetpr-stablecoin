import { BlockRadarBase } from '../base';
import { GenerateWalletResponse } from './generateWallet.interface';
import { getWalletIdForChain } from '../walletIdManagement';

/**
 * Simple wallet address generation
 */
export class GenerateWalletProvider extends BlockRadarBase {
  static async generateAddress(chain: string, name: string): Promise<{ address: string; addressId: string }> {
    const walletId = getWalletIdForChain(chain);
    const response = await this.request(walletId, 'addresses', 'POST', { name }) as GenerateWalletResponse;
    
    return {
      address: response.data.address,
      addressId: response.data.id
    };
  }
}

/**
 * Generate wallet address function
 * Automatically selects the correct wallet ID based on chain
 */
export async function generateAddress(chain: string, name: string): Promise<{ address: string; addressId: string }> {
  return await GenerateWalletProvider.generateAddress(chain, name);
}
