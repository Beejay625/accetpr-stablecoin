import { createLoggerWithFunction } from '../../../logger';
import { DatabaseOperations } from '../../../db/databaseOperations';
import { cacheService } from '../../../services/cache';
import { Err } from '../../../errors';
import { CachedAssetRepository } from '../../cached/cachedAssetRepository';

/**
 * Wallet Repository
 * 
 * Handles all database operations for wallet addresses.
 * Uses DatabaseOperations for consistent error handling and race condition protection.
 */

export class WalletRepository {
  /**
   * Get address ID for a user and chain (with caching)
   */
  async getAddressId(userId: string, chain: string): Promise<string> {
    const logger = createLoggerWithFunction('getAddressId', { module: 'repository' });
    
    try {
      // Try to get address ID from cache first
      const cacheKey = `user:${userId}:address-id:${chain}`;
      let addressId = await cacheService.get(cacheKey);
      
      if (!addressId) {
        logger.debug('getAddressId', { userId, chain }, 'Address ID not in cache, fetching from database');
        
        // Get address from database by chain
        const walletAddress = await this.findByChain(userId, chain);
        if (!walletAddress) {
          throw Err.notFound(`No wallet address found for user on chain ${chain}. Please ensure your wallet is connected.`);
        }
        
        addressId = walletAddress.addressId;
        
        // Cache the address ID for 1 hour
        await cacheService.set(cacheKey, addressId, 3600);
        
        logger.debug('getAddressId', { userId, chain, addressId }, 'Address ID cached');
      } else {
        logger.debug('getAddressId', { userId, chain, addressId }, 'Address ID retrieved from cache');
      }
      
      return addressId;
    } catch (error: any) {
      logger.error('getAddressId', { userId, chain, error: error.message }, 'Failed to get address ID');
      throw error;
    }
  }
  /**
   * Create a new wallet address record with race condition protection
   */
  async createWalletAddress(data: {
    userId: string;
    address: string;
    addressId: string;
    addressName: string;
    chain: string;
  }): Promise<{ id: string; userId: string; address: string; addressId: string; addressName: string; chain: string; createdAt: Date }> {
    const logger = createLoggerWithFunction('createWalletAddress', { module: 'repository' });
    try {
      // Use DatabaseOperations with race condition protection
      // Prevent duplicate addresses for same user
      const walletAddress = await DatabaseOperations.create(
        'walletAddress',
        {
          userId: data.userId,
          address: data.address,
          addressId: data.addressId,
          addressName: data.addressName,
          chain: data.chain,
        },
        ['userId', 'chain'] // Unique constraint on userId + chain
      ) as { id: string; userId: string; address: string; addressId: string; addressName: string; chain: string; createdAt: Date };
      
      logger.info({ 
        userId: data.userId, 
        address: data.address,
        chain: data.chain,
        id: walletAddress.id
      }, 'Wallet address created with race protection');
      return walletAddress;
    } catch (error: any) {
      logger.error({ 
        userId: data.userId, 
        address: data.address,
        error: error.message 
      }, 'Failed to create wallet address');
      throw error;
    }
  }

  /**
   * Find wallet address by user ID and address
   */
  async findByUserAndAddress(userId: string, address: string): Promise<{ id: string; userId: string; address: string; addressName: string; chain: string; createdAt: Date } | null> {
    const logger = createLoggerWithFunction('findByUserAndAddress', { module: 'repository' });
    try {
      const walletAddress = await DatabaseOperations.findMany('walletAddress', {
        userId,
        address,
      });
      
      const result = walletAddress.length > 0 ? walletAddress[0] : null;
      logger.debug({ userId, address, found: !!result }, 'Wallet address lookup');
      return result as { id: string; userId: string; address: string; addressName: string; chain: string; createdAt: Date } | null;
    } catch (error: any) {
      logger.error({ userId, address, error: error.message }, 'Failed to find wallet address');
      throw error;
    }
  }

  /**
   * Find all wallet addresses for a user
   */
  async findByUserId(userId: string): Promise<{ id: string; userId: string; address: string; addressName: string; chain: string; createdAt: Date }[]> {
    const logger = createLoggerWithFunction('findByUserId', { module: 'repository' });
    try {
      const walletAddresses = await DatabaseOperations.findMany('walletAddress', {
        userId,
      }, {
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      logger.debug({ userId, count: walletAddresses.length }, 'User wallet addresses retrieved');
      return walletAddresses as { id: string; userId: string; address: string; addressName: string; chain: string; createdAt: Date }[];
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to find user wallet addresses');
      throw error;
    }
  }

  /**
   * Find wallet address by chain (returns single address due to unique constraint)
   */
  async findByChain(userId: string, chain: string): Promise<{ id: string; userId: string; address: string; addressId: string; addressName: string; chain: string; createdAt: Date } | null> {
    const logger = createLoggerWithFunction('findByChain', { module: 'repository' });
    try {
      const walletAddresses = await DatabaseOperations.findMany('walletAddress', {
        userId,
        chain,
      });
      
      const result = walletAddresses.length > 0 ? walletAddresses[0] : null;
      logger.debug({ userId, chain, found: !!result }, 'Wallet address by chain retrieved');
      return result as { id: string; userId: string; address: string; addressId: string; addressName: string; chain: string; createdAt: Date } | null;
    } catch (error: any) {
      logger.error({ userId, chain, error: error.message }, 'Failed to find wallet addresses by chain');
      throw error;
    }
  }

  /**
   * Find asset ID by chain and asset symbol
   * 
   * @param chain - The blockchain chain (e.g., 'polygon', 'ethereum')
   * @param asset - The asset symbol (e.g., 'USDC', 'BUSD')
   * @returns Promise<string | null> - The asset ID or null if not found
   * 
   * @example
   * ```typescript
   * const assetId = await walletRepository.findAssetId('polygon', 'USDC');
   * // Returns: "94213838-1c82-4120-b5fb-37d4a6a83835" or null
   * ```
   */
  async findAssetId(chain: string, asset: string): Promise<string | null> {
    const logger = createLoggerWithFunction('findAssetId', { module: 'repository' });
    
    try {
      logger.debug('findAssetId', { chain, asset }, 'Finding asset ID');
      
      // Use cached asset repository to find asset ID
      const assetId = await CachedAssetRepository.findAssetId(chain, asset);
      
      if (assetId) {
        logger.debug('findAssetId', { chain, asset, assetId }, 'Asset ID found');
        return assetId;
      }
      
      logger.warn('findAssetId', { chain, asset }, 'Asset not found');
      return null;
    } catch (error: any) {
      logger.error('findAssetId', { chain, asset, error: error.message }, 'Failed to find asset ID');
      throw error;
    }
  }

}

export const walletRepository = new WalletRepository();
