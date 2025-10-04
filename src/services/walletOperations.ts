import { clerkClient } from '../middleware/auth';
import { BlockRadarProvider, BlockRadarError } from '../providers/blockradar';

/**
 * Wallet Operations Service
 * Handles wallet-related operations for authenticated users using BlockRadar provider
 */
export class WalletOperations {
  /**
   * Generate a new wallet address for a user using BlockRadar provider
   * @param userId - The authenticated user's ID
   * @param walletId - The wallet ID to generate address for
   * @param addressName - Optional name for the address
   * @returns Promise with generated address data
   */
  static async generateAddress(
    userId: string, 
    walletId: string, 
    addressName?: string
  ): Promise<{ 
    message: string; 
    data: { 
      address: string; 
      privateKey?: string; 
      walletId: string; 
      addressName?: string; 
      metadata?: any;
    } 
  }> {
    try {
      // Get user data for verification and metadata
      const user = await clerkClient.users.getUser(userId);

      // Call BlockRadar provider to generate address
      const blockRadarData = await BlockRadarProvider.generateAddress(walletId, addressName);

      // Prepare response data
      const addressData = {
        address: blockRadarData.data?.address || '',
        privateKey: blockRadarData.data?.privateKey,
        walletId,
        addressName,
        metadata: {
          userId,
          userEmail: user.emailAddresses[0]?.emailAddress,
          createdAt: new Date().toISOString(),
          blockRadarWalletId: walletId,
          generatedBy: 'blockradar-provider'
        }
      };

      return {
        message: blockRadarData.message || 'Address generated successfully',
        data: addressData
      };

    } catch (error) {
      if (error instanceof BlockRadarError) {
        throw new Error(`BlockRadar error: ${error.message}`);
      }
      throw new Error(`Failed to generate wallet address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get wallet balance using BlockRadar provider
   * @param walletId - The wallet ID to get balance for
   * @returns Promise with wallet balance data
   */
  static async getWalletBalance(walletId: string): Promise<{
    message: string;
    data: {
      walletId: string;
      balance: number;
      currency: string;
      lastUpdated: string;
    }
  }> {
    try {
      // Call BlockRadar provider to get balance
      const blockRadarData = await BlockRadarProvider.getWalletBalance(walletId);

      return {
        message: blockRadarData.message || 'Balance retrieved successfully',
        data: {
          walletId,
          balance: blockRadarData.data?.balance || 0,
          currency: blockRadarData.data?.currency || 'ETH',
          lastUpdated: new Date().toISOString()
        }
      };

    } catch (error) {
      if (error instanceof BlockRadarError) {
        throw new Error(`BlockRadar error: ${error.message}`);
      }
      throw new Error(`Failed to get wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if BlockRadar is properly configured
   * @returns boolean indicating if BlockRadar is configured
   */
  static isBlockRadarConfigured(): boolean {
    return BlockRadarProvider.isConfigured();
  }
}