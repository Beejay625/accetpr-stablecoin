import { createLoggerWithFunction } from '../../logger';
import { generateAddress } from '../../providers/blockradar/generateWallet';
import { getAddressBalance } from '../../providers/blockradar/balance/walletBalance';
import { walletRepository } from '../../repositories/database/wallet';
import { cacheService } from '../../services/cache';
import { DEFAULT_CHAINS, EVM_CHAINS } from '../../types/chains';

/**
 * Wallet Service
 * 
 * Handles all wallet operations including generation, balance checking,
 * transaction history, and withdrawals.
 */
export class WalletService {
  private static logger = createLoggerWithFunction('WalletService', { module: 'service' });

  /**
   * Get wallet balance for a user using cached address ID
   */
  static async getWalletBalance(
    userId: string,
    chain: string = 'base'
  ): Promise<{ convertedBalance: string; chain: string; asset: string }> {
    try {
      this.logger.debug('getWalletBalance', { userId, chain }, 'Getting wallet balance');
      
      // Get address ID using the repository method
      const addressId = await walletRepository.getAddressId(userId, chain);
      
      // Get balance using BlockRadar (provider handles wallet ID selection)
      const balanceData = await getAddressBalance(addressId);
      
      this.logger.debug('getWalletBalance', { 
        userId, 
        addressId,
        convertedBalance: balanceData.convertedBalance,
        chain: balanceData.chain,
        asset: balanceData.asset
      }, 'Wallet balance retrieved');
      
      return {
        convertedBalance: balanceData.convertedBalance,
        chain: balanceData.chain,
        asset: balanceData.asset
      };
    } catch (error: any) {
      this.logger.error('getWalletBalance', { 
        userId, 
        error: error.message 
      }, 'Failed to get wallet balance');
      throw error;
    }
  }

  /**
   * Generate wallet addresses for multiple chains for a user
   */
  static async generateMultiChainWallets(
    userId: string,
    addressName: string,
    chains: readonly string[] = DEFAULT_CHAINS
  ): Promise<{ address: string; addressId: string; id: string; chain: string }[]> {
    try {
      this.logger.info('generateMultiChainWallets', { userId, addressName, chains }, 'Generating multi-chain wallets');
      
      const results: { address: string; addressId: string; id: string; chain: string }[] = [];
      
      // Separate EVM and non-EVM chains
      const evmChains = chains.filter(chain => EVM_CHAINS.includes(chain as any));
      const nonEvmChains = chains.filter(chain => !EVM_CHAINS.includes(chain as any));
      
      this.logger.debug('generateMultiChainWallets', { userId, evmChains, nonEvmChains }, 'Separated chains by type');
      
      // Generate one wallet for all EVM chains (they share the same address)
      let evmAddressData: { address: string; addressId: string } | null = null;
      if (evmChains.length > 0) {
        this.logger.debug('generateMultiChainWallets', { userId, evmChains }, 'Generating single wallet for EVM chains');
        const firstEvmChain = evmChains[0];
        if (!firstEvmChain) {
          throw new Error('No EVM chain found');
        }
        evmAddressData = await generateAddress(firstEvmChain, addressName);
      }
      
      // Prepare all wallet data first with fail-fast behavior
      const walletDataPromises = chains.map(async (chain) => {
        this.logger.debug('generateMultiChainWallets', { userId, chain }, 'Processing wallet for chain');
        
        let addressData: { address: string; addressId: string };
        
        if (EVM_CHAINS.includes(chain as any)) {
          // Use the shared EVM address
          addressData = evmAddressData!;
          this.logger.debug('generateMultiChainWallets', { userId, chain }, 'Using shared EVM address');
        } else {
          // Generate unique address for non-EVM chains
          this.logger.debug('generateMultiChainWallets', { userId, chain }, 'Generating unique address for non-EVM chain');
          addressData = await generateAddress(chain, addressName);
        }
        
        return {
          userId,
          address: addressData.address,
          addressId: addressData.addressId,
          addressName: `${userId}-${chain}`, // Format: userId-chain
          chain,
          addressData
        };
      });
      
      // Wait for all wallet data to be prepared (fail-fast on any error)
      const walletDataResults = await Promise.all(walletDataPromises);
      
      // Batch create all wallet addresses with race condition protection
      this.logger.info('generateMultiChainWallets', { userId, count: walletDataResults.length }, 'Batch creating wallet addresses');
      const batchCreatePromises = walletDataResults.map((walletData) => 
        walletRepository.createWalletAddress({
          userId: walletData.userId,
          address: walletData.address,
          addressId: walletData.addressId,
          addressName: walletData.addressName,
          chain: walletData.chain,
        }).then(savedAddress => ({
          ...savedAddress,
          addressData: walletData.addressData
        }))
      );
      
      // Wait for all database operations to complete (fail-fast on any error)
      const savedAddresses = await Promise.all(batchCreatePromises);
      
      // Batch cache all address IDs (non-blocking - cache failures shouldn't fail the entire operation)
      const cachePromises = savedAddresses.map((savedAddress) => {
        const cacheKey = `user:${userId}:address-id:${savedAddress.chain}`;
        return cacheService.set(cacheKey, savedAddress.addressId, 3600)
          .then(() => {
            this.logger.debug('generateMultiChainWallets', { userId, chain: savedAddress.chain, addressId: savedAddress.addressId }, 'Address ID cached');
          })
          .catch((error: any) => {
            this.logger.warn('generateMultiChainWallets', { userId, chain: savedAddress.chain, error: error.message }, 'Failed to cache address ID (non-critical)');
          });
      });
      
      // Wait for all cache operations to complete (but don't fail if caching fails)
      await Promise.allSettled(cachePromises);
      
      // Prepare final results
      const walletResults = savedAddresses.map(savedAddress => ({
        address: savedAddress.address,
        addressId: savedAddress.addressId,
        id: savedAddress.id,
        chain: savedAddress.chain
      }));
      
      results.push(...walletResults);
      
      this.logger.info('generateMultiChainWallets', { userId, 
        addressName,
        generatedCount: results.length,
        chains: results.map(r => r.chain)
      }, 'Multi-chain wallets generated successfully');
      
      return results;
    } catch (error: any) {
      this.logger.error('generateMultiChainWallets', { userId, 
        addressName, 
        chains,
        error: error.message 
      }, 'Failed to generate multi-chain wallets');
      throw error;
    }
  }

}
