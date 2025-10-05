import { createLoggerWithFunction } from '../logger';
import { getAssets } from '../providers/blockradar/assets/getAssets';
import { cacheService } from '../services/cache';

/**
 * Cache Assets On Startup
 * 
 * Handles caching of assets data on server startup.
 * Assets are stored in Redis without expiration for fast access.
 */
export class CacheAssetsOnStartup {
  private static logger = createLoggerWithFunction('CacheAssetsOnStartup', { module: 'server' });
  private static readonly CACHE_KEY = 'blockradar:assets:all';

  /**
   * Load and cache all assets on server startup
   * 
   * @returns Promise<void>
   */
  static async loadAssetsOnStartup(): Promise<void> {
    this.logger.info('Starting asset cache initialization on startup');
    
    try {
      // Check if assets are already cached
      const existingAssets = await cacheService.get(this.CACHE_KEY);
      
      if (existingAssets) {
        this.logger.info('Assets already cached, skipping initialization');
        return;
      }
      
      this.logger.info('Fetching assets from BlockRadar API');
      
      // Fetch all assets from BlockRadar
      const assets = await getAssets();
      
      // Store in Redis without expiration
      await cacheService.set(this.CACHE_KEY, JSON.stringify(assets));
      
      this.logger.info({ 
        count: assets.length,
        cacheKey: this.CACHE_KEY 
      }, 'Assets cached successfully on startup');
      
    } catch (error: any) {
      this.logger.error({ 
        error: error.message 
      }, 'Failed to cache assets on startup');
      
      // Don't throw error to prevent server startup failure
      // Assets will be fetched on-demand if cache fails
      this.logger.warn('Server will continue startup, assets will be fetched on-demand');
    }
  }
}
