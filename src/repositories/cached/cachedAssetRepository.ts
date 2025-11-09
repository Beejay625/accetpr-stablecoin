import { createLoggerWithFunction } from '../../logger';
import { getAssets, Asset } from '../../providers/blockradar/assets/getAssets';
import { cacheService } from '../../services/cache';

/**
 * Cached Asset Repository
 * 
 * Handles caching of assets data on server startup.
 * Assets are stored in Redis without expiration for fast access.
 */
export class CachedAssetRepository {
  private static logger = createLoggerWithFunction('CachedAssetRepository', { module: 'repository' });
  private static readonly CACHE_KEY = 'blockradar:assets:all';



  /**
   * Find asset ID by chain and asset symbol (with caching)
   * 
   * @param chain - The blockchain chain (e.g., 'polygon', 'ethereum')
   * @param asset - The asset symbol (e.g., 'USDC', 'BUSD')
   * @returns Promise<string | null> - The asset ID or null if not found
   * 
   * @example
   * ```typescript
   * const assetId = await cachedAssetRepository.findAssetId('polygon', 'USDC');
   * // Returns: "94213838-1c82-4120-b5fb-37d4a6a83835" or null
   * ```
   */
  static async findAssetId(chain: string, asset: string): Promise<string | null> {
    const logger = createLoggerWithFunction('findAssetId', { module: 'repository' });
    
    try {
      logger.debug({ chain, asset }, 'Finding asset ID');
      
      // Try to get assets from cache first
      let assets: Asset[] | null = null;
      try {
        const cachedAssets = await cacheService.get(this.CACHE_KEY);
        if (cachedAssets) {
          assets = JSON.parse(cachedAssets);
        }
      } catch (error: any) {
        logger.debug({ error: error.message }, 'Failed to get cached assets');
      }
      
      // If not in cache, fetch from API as fallback
      if (!assets) {
        logger.debug('Assets not in cache, fetching from API as fallback');
        assets = await getAssets();
      }
      
      // Find matching asset
      const matchingAsset = assets.find((a: Asset) => 
        a.chain.toLowerCase() === chain.toLowerCase() && 
        a.asset.toLowerCase() === asset.toLowerCase()
      );
      
      if (matchingAsset) {
        logger.debug({ chain, asset, assetId: matchingAsset.assetId }, 'Asset ID found');
        return matchingAsset.assetId;
      }
      
      logger.warn({ chain, asset }, 'Asset not found');
      return null;
    } catch (error: any) {
      logger.error({ chain, asset, error: error.message }, 'Failed to find asset ID');
      throw error;
    }
  }

}

export const cachedAssetRepository = new CachedAssetRepository();