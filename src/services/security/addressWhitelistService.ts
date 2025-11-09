import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';

/**
 * Address Whitelist Service
 * 
 * Manages whitelisted addresses for enhanced security
 */
export interface WhitelistedAddress {
  id: string;
  userId: string;
  address: string;
  label: string;
  chain?: string; // If specified, only valid for this chain
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

export interface WhitelistConfig {
  userId: string;
  whitelistOnly: boolean; // If true, only whitelisted addresses can receive funds
  requireApproval: boolean; // If true, require approval for new whitelist entries
  maxAddresses: number; // Maximum number of whitelisted addresses
}

export class AddressWhitelistService {
  private static logger = createLoggerWithFunction('AddressWhitelistService', { module: 'security' });

  /**
   * Add address to whitelist
   */
  static async addToWhitelist(
    userId: string,
    address: string,
    label: string,
    chain?: string
  ): Promise<WhitelistedAddress> {
    const logger = createLoggerWithFunction('addToWhitelist', { module: 'security' });
    
    try {
      logger.debug({ userId, address, label, chain }, 'Adding address to whitelist');

      // Validate address format
      if (!this.isValidAddress(address)) {
        throw new Error('Invalid address format');
      }

      // Check max addresses limit
      const config = await this.getWhitelistConfig(userId);
      if (config) {
        const existing = await this.getWhitelistedAddresses(userId);
        if (existing.length >= config.maxAddresses) {
          throw new Error(`Maximum whitelist limit reached (${config.maxAddresses})`);
        }
      }

      const addressId = `whitelist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const whitelistedAddress: WhitelistedAddress = {
        id: addressId,
        userId,
        address: address.toLowerCase(),
        label,
        chain,
        createdAt: new Date(),
        useCount: 0
      };

      // Store whitelisted address
      const cacheKey = `whitelist:address:${userId}:${addressId}`;
      await cacheService.set(cacheKey, JSON.stringify(whitelistedAddress), 86400 * 365);

      // Add to user's whitelist index
      await this.addToWhitelistIndex(userId, addressId);

      logger.info({ userId, addressId, address }, 'Address added to whitelist');

      return whitelistedAddress;
    } catch (error: any) {
      logger.error({ userId, address, error: error.message }, 'Failed to add address to whitelist');
      throw error;
    }
  }

  /**
   * Remove address from whitelist
   */
  static async removeFromWhitelist(
    userId: string,
    addressId: string
  ): Promise<boolean> {
    const logger = createLoggerWithFunction('removeFromWhitelist', { module: 'security' });
    
    try {
      const cacheKey = `whitelist:address:${userId}:${addressId}`;
      await cacheService.delete(cacheKey);

      // Remove from whitelist index
      await this.removeFromWhitelistIndex(userId, addressId);

      logger.info({ userId, addressId }, 'Address removed from whitelist');

      return true;
    } catch (error: any) {
      logger.error({ userId, addressId, error: error.message }, 'Failed to remove address from whitelist');
      return false;
    }
  }

  /**
   * Get all whitelisted addresses for a user
   */
  static async getWhitelistedAddresses(userId: string): Promise<WhitelistedAddress[]> {
    const logger = createLoggerWithFunction('getWhitelistedAddresses', { module: 'security' });
    
    try {
      const indexKey = `whitelist:index:${userId}`;
      const index = await cacheService.get(indexKey);
      
      if (!index) {
        return [];
      }

      const addressIds: string[] = JSON.parse(index);
      const addresses = await Promise.all(
        addressIds.map(async (addressId) => {
          const cacheKey = `whitelist:address:${userId}:${addressId}`;
          const cached = await cacheService.get(cacheKey);
          return cached ? JSON.parse(cached) : null;
        })
      );

      return addresses.filter((addr): addr is WhitelistedAddress => addr !== null);
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get whitelisted addresses');
      return [];
    }
  }

  /**
   * Check if address is whitelisted
   */
  static async isWhitelisted(
    userId: string,
    address: string,
    chain?: string
  ): Promise<boolean> {
    const logger = createLoggerWithFunction('isWhitelisted', { module: 'security' });
    
    try {
      const whitelisted = await this.getWhitelistedAddresses(userId);
      const normalizedAddress = address.toLowerCase();
      
      return whitelisted.some(addr => {
        const addressMatch = addr.address === normalizedAddress;
        const chainMatch = !addr.chain || !chain || addr.chain === chain;
        return addressMatch && chainMatch;
      });
    } catch (error: any) {
      logger.error({ userId, address, error: error.message }, 'Failed to check whitelist status');
      return false;
    }
  }

  /**
   * Update address usage
   */
  static async recordUsage(
    userId: string,
    address: string
  ): Promise<void> {
    const logger = createLoggerWithFunction('recordUsage', { module: 'security' });
    
    try {
      const whitelisted = await this.getWhitelistedAddresses(userId);
      const normalizedAddress = address.toLowerCase();
      
      const addressEntry = whitelisted.find(addr => addr.address === normalizedAddress);
      if (addressEntry) {
        addressEntry.useCount = (addressEntry.useCount || 0) + 1;
        addressEntry.lastUsed = new Date();
        
        const cacheKey = `whitelist:address:${userId}:${addressEntry.id}`;
        await cacheService.set(cacheKey, JSON.stringify(addressEntry), 86400 * 365);
      }
    } catch (error: any) {
      logger.error({ userId, address, error: error.message }, 'Failed to record usage');
    }
  }

  /**
   * Configure whitelist settings
   */
  static async configureWhitelist(
    userId: string,
    config: Partial<WhitelistConfig>
  ): Promise<WhitelistConfig> {
    const logger = createLoggerWithFunction('configureWhitelist', { module: 'security' });
    
    try {
      const existing = await this.getWhitelistConfig(userId);
      
      const updated: WhitelistConfig = {
        userId,
        whitelistOnly: config.whitelistOnly ?? existing?.whitelistOnly ?? false,
        requireApproval: config.requireApproval ?? existing?.requireApproval ?? false,
        maxAddresses: config.maxAddresses ?? existing?.maxAddresses ?? 100
      };

      const cacheKey = `whitelist:config:${userId}`;
      await cacheService.set(cacheKey, JSON.stringify(updated), 86400 * 365);

      logger.info({ userId }, 'Whitelist configuration updated');

      return updated;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to configure whitelist');
      throw error;
    }
  }

  /**
   * Get whitelist configuration
   */
  static async getWhitelistConfig(userId: string): Promise<WhitelistConfig | null> {
    const cacheKey = `whitelist:config:${userId}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  /**
   * Validate address format
   */
  private static isValidAddress(address: string): boolean {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Add to whitelist index
   */
  private static async addToWhitelistIndex(userId: string, addressId: string): Promise<void> {
    const indexKey = `whitelist:index:${userId}`;
    const existing = await cacheService.get(indexKey);
    const index: string[] = existing ? JSON.parse(existing) : [];
    
    if (!index.includes(addressId)) {
      index.push(addressId);
      await cacheService.set(indexKey, JSON.stringify(index), 86400 * 365);
    }
  }

  /**
   * Remove from whitelist index
   */
  private static async removeFromWhitelistIndex(userId: string, addressId: string): Promise<void> {
    const indexKey = `whitelist:index:${userId}`;
    const existing = await cacheService.get(indexKey);
    
    if (existing) {
      const index: string[] = JSON.parse(existing);
      const filtered = index.filter(id => id !== addressId);
      await cacheService.set(indexKey, JSON.stringify(filtered), 86400 * 365);
    }
  }
}

