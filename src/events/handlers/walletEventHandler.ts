import { createLoggerWithFunction } from '../../logger';
import { WalletService } from '../../services/wallet/walletService';
import { DEFAULT_CHAINS } from '../../providers/blockradar/walletIdManagement/chainsAndTokens';

/**
 * Wallet Event Data Types
 */
export interface GenerateWalletEventData {
  userId: string;
}

/**
 * Wallet Event Handlers
 * Handles wallet-related events asynchronously
 */
export class WalletEventHandler {
  /**
   * Generate wallet address for user after login
   */
  static async handleGenerateWalletAfterLogin(data: GenerateWalletEventData): Promise<void> {
    const logger = createLoggerWithFunction('handleGenerateWalletAfterLogin', { module: 'event-handler' });
    
    try {
      const { userId } = data;
      
      logger.info({ userId }, 'Processing multi-chain wallet generation event');
      
      // Generate wallets for all default chains
      const wallets = await WalletService.generateMultiChainWallets(
        userId,
        userId, // Will be formatted as userId-chain in the service
        DEFAULT_CHAINS
      );
      
      logger.info({ 
        userId, 
        generatedWallets: wallets.length,
        chains: wallets.map(w => w.chain)
      }, 'Multi-chain wallets generated and saved successfully');
      
    } catch (error: any) {
      logger.error({ 
        userId: data.userId, 
        error: error.message 
      }, 'Failed to generate multi-chain wallets in event handler');
      // Don't throw - events should be fire-and-forget
    }
  }

}
