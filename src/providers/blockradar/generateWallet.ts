import { BlockRadarBase } from './base';

/**
 * Simple wallet address generation
 */
export class GenerateWalletProvider extends BlockRadarBase {
  
  static async generateAddress(
    walletId: string, 
    options: {
      name: string;
      disableAutoSweep?: boolean;
      enableGaslessWithdraw?: boolean;
      metadata?: any;
      showPrivateKey?: boolean;
    }
  ): Promise<any> {
    this.validateConfiguration();
    
    return await this.request(`/wallets/${walletId}/addresses`, 'POST', options);
  }
}
