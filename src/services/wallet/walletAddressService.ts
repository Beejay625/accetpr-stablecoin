import { createLoggerWithFunction } from '../../logger';
import { walletRepository } from '../../repositories/database/wallet';
import { DEFAULT_CHAINS } from '../../types/chains';

/**
 * Wallet Address Service
 * 
 * Provides wallet address management functionality.
 */
export interface WalletAddressInfo {
  id: string;
  chain: string;
  address: string;
  addressName: string;
  createdAt: string;
}

export class WalletAddressService {
  private static logger = createLoggerWithFunction('WalletAddressService', { module: 'service' });

  /**
   * Get all wallet addresses for a user
   */
  static async getUserWalletAddresses(userId: string): Promise<WalletAddressInfo[]> {
    this.logger.info({ userId }, 'Fetching user wallet addresses');

    try {
      const walletAddresses = await walletRepository.findByUserId(userId);

      const addresses: WalletAddressInfo[] = walletAddresses.map(wallet => ({
        id: wallet.id,
        chain: wallet.chain,
        address: wallet.address,
        addressName: wallet.addressName,
        createdAt: wallet.createdAt.toISOString()
      }));

      this.logger.info({ userId, count: addresses.length }, 'Wallet addresses retrieved successfully');

      return addresses;
    } catch (error: any) {
      this.logger.error({ userId, error: error.message }, 'Failed to get wallet addresses');
      throw error;
    }
  }

  /**
   * Get wallet address details for a specific chain
   */
  static async getWalletAddressByChain(
    userId: string,
    chain: string
  ): Promise<WalletAddressInfo | null> {
    this.logger.info({ userId, chain }, 'Fetching wallet address by chain');

    try {
      // Validate chain
      if (!DEFAULT_CHAINS.includes(chain)) {
        throw new Error(`Invalid chain: ${chain}. Supported chains: ${DEFAULT_CHAINS.join(', ')}`);
      }

      const walletAddress = await walletRepository.findByChain(userId, chain);

      if (!walletAddress) {
        this.logger.warn({ userId, chain }, 'Wallet address not found');
        return null;
      }

      const addressInfo: WalletAddressInfo = {
        id: walletAddress.id,
        chain: walletAddress.chain,
        address: walletAddress.address,
        addressName: walletAddress.addressName,
        createdAt: walletAddress.createdAt.toISOString()
      };

      this.logger.info({ userId, chain }, 'Wallet address retrieved successfully');

      return addressInfo;
    } catch (error: any) {
      this.logger.error({ userId, chain, error: error.message }, 'Failed to get wallet address');
      throw error;
    }
  }
}

