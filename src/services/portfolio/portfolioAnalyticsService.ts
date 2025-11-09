import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';

/**
 * Portfolio Analytics Service
 * 
 * Provides advanced portfolio tracking and analytics
 */
export interface PortfolioSnapshot {
  userId: string;
  timestamp: Date;
  totalValue: string; // USD value
  assets: PortfolioAsset[];
  chains: ChainBalance[];
  distribution: {
    byChain: Record<string, { value: string; percentage: number }>;
    byAsset: Record<string, { value: string; percentage: number }>;
  };
}

export interface PortfolioAsset {
  chain: string;
  asset: string;
  balance: string;
  value: string; // USD value
  price: string; // USD price per unit
}

export interface ChainBalance {
  chain: string;
  totalValue: string; // USD value
  assetCount: number;
}

export interface PortfolioMetrics {
  totalValue: string;
  totalValueChange24h: string;
  totalValueChangePercent24h: number;
  topAssets: Array<{ asset: string; chain: string; value: string; percentage: number }>;
  topChains: Array<{ chain: string; value: string; percentage: number }>;
  assetCount: number;
  chainCount: number;
}

export class PortfolioAnalyticsService {
  private static logger = createLoggerWithFunction('PortfolioAnalyticsService', { module: 'portfolio' });

  /**
   * Create portfolio snapshot
   */
  static async createSnapshot(
    userId: string,
    assets: PortfolioAsset[]
  ): Promise<PortfolioSnapshot> {
    const logger = createLoggerWithFunction('createSnapshot', { module: 'portfolio' });
    
    try {
      logger.debug({ userId, assetCount: assets.length }, 'Creating portfolio snapshot');

      // Calculate total value
      const totalValue = assets.reduce((sum, asset) => {
        return sum + parseFloat(asset.value || '0');
      }, 0).toString();

      // Group by chain
      const chainsMap = new Map<string, { value: number; assets: Set<string> }>();
      assets.forEach(asset => {
        const existing = chainsMap.get(asset.chain) || { value: 0, assets: new Set() };
        existing.value += parseFloat(asset.value || '0');
        existing.assets.add(asset.asset);
        chainsMap.set(asset.chain, existing);
      });

      const chains: ChainBalance[] = Array.from(chainsMap.entries()).map(([chain, data]) => ({
        chain,
        totalValue: data.value.toString(),
        assetCount: data.assets.size
      }));

      // Calculate distribution
      const byChain: Record<string, { value: string; percentage: number }> = {};
      const byAsset: Record<string, { value: string; percentage: number }> = {};

      chains.forEach(chain => {
        const percentage = (parseFloat(chain.totalValue) / parseFloat(totalValue)) * 100;
        byChain[chain.chain] = {
          value: chain.totalValue,
          percentage: isNaN(percentage) ? 0 : percentage
        };
      });

      assets.forEach(asset => {
        const key = `${asset.chain}:${asset.asset}`;
        const existing = byAsset[key] || { value: '0', percentage: 0 };
        const currentValue = parseFloat(existing.value) + parseFloat(asset.value || '0');
        const percentage = (currentValue / parseFloat(totalValue)) * 100;
        byAsset[key] = {
          value: currentValue.toString(),
          percentage: isNaN(percentage) ? 0 : percentage
        };
      });

      const snapshot: PortfolioSnapshot = {
        userId,
        timestamp: new Date(),
        totalValue,
        assets,
        chains,
        distribution: {
          byChain,
          byAsset
        }
      };

      // Store snapshot
      const snapshotId = `snapshot_${Date.now()}`;
      const cacheKey = `portfolio:snapshot:${userId}:${snapshotId}`;
      await cacheService.set(cacheKey, JSON.stringify(snapshot), 86400 * 90); // 90 days

      // Add to snapshots list
      await this.addToSnapshotsList(userId, snapshotId);

      logger.info({ userId, snapshotId, totalValue }, 'Portfolio snapshot created');

      return snapshot;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to create portfolio snapshot');
      throw error;
    }
  }

  /**
   * Get portfolio metrics
   */
  static async getPortfolioMetrics(userId: string): Promise<PortfolioMetrics | null> {
    const logger = createLoggerWithFunction('getPortfolioMetrics', { module: 'portfolio' });
    
    try {
      // Get latest snapshot
      const latestSnapshot = await this.getLatestSnapshot(userId);
      if (!latestSnapshot) {
        return null;
      }

      // Get snapshot from 24h ago for comparison
      const previousSnapshot = await this.getSnapshot24hAgo(userId);
      
      const totalValue = latestSnapshot.totalValue;
      const previousValue = previousSnapshot?.totalValue || '0';
      const totalValueChange24h = (parseFloat(totalValue) - parseFloat(previousValue)).toString();
      const totalValueChangePercent24h = parseFloat(previousValue) > 0
        ? ((parseFloat(totalValueChange24h) / parseFloat(previousValue)) * 100)
        : 0;

      // Get top assets
      const topAssets = Object.entries(latestSnapshot.distribution.byAsset)
        .map(([key, data]) => {
          const [chain, asset] = key.split(':');
          return { asset, chain, value: data.value, percentage: data.percentage };
        })
        .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
        .slice(0, 5);

      // Get top chains
      const topChains = Object.entries(latestSnapshot.distribution.byChain)
        .map(([chain, data]) => ({
          chain,
          value: data.value,
          percentage: data.percentage
        }))
        .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
        .slice(0, 5);

      const metrics: PortfolioMetrics = {
        totalValue,
        totalValueChange24h,
        totalValueChangePercent24h,
        topAssets,
        topChains,
        assetCount: latestSnapshot.assets.length,
        chainCount: latestSnapshot.chains.length
      };

      return metrics;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to get portfolio metrics');
      return null;
    }
  }

  /**
   * Get portfolio history
   */
  static async getPortfolioHistory(
    userId: string,
    days: number = 30
  ): Promise<PortfolioSnapshot[]> {
    const logger = createLoggerWithFunction('getPortfolioHistory', { module: 'portfolio' });
    
    try {
      const listKey = `portfolio:snapshots:list:${userId}`;
      const list = await cacheService.get(listKey);
      
      if (!list) {
        return [];
      }

      const snapshotIds: string[] = JSON.parse(list);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const snapshots = await Promise.all(
        snapshotIds.map(async (id) => {
          const cacheKey = `portfolio:snapshot:${userId}:${id}`;
          const cached = await cacheService.get(cacheKey);
          if (cached) {
            const snapshot: PortfolioSnapshot = JSON.parse(cached);
            if (new Date(snapshot.timestamp) >= cutoffDate) {
              return snapshot;
            }
          }
          return null;
        })
      );

      return snapshots
        .filter((s): s is PortfolioSnapshot => s !== null)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error: any) {
      logger.error({ userId, days, error: error.message }, 'Failed to get portfolio history');
      return [];
    }
  }

  /**
   * Get latest snapshot
   */
  private static async getLatestSnapshot(userId: string): Promise<PortfolioSnapshot | null> {
    const listKey = `portfolio:snapshots:list:${userId}`;
    const list = await cacheService.get(listKey);
    
    if (!list) {
      return null;
    }

    const snapshotIds: string[] = JSON.parse(list);
    if (snapshotIds.length === 0) {
      return null;
    }

    // Get the most recent snapshot (last in list)
    const latestId = snapshotIds[snapshotIds.length - 1];
    const cacheKey = `portfolio:snapshot:${userId}:${latestId}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  /**
   * Get snapshot from 24h ago
   */
  private static async getSnapshot24hAgo(userId: string): Promise<PortfolioSnapshot | null> {
    const history = await this.getPortfolioHistory(userId, 2);
    const targetTime = Date.now() - 24 * 60 * 60 * 1000;
    
    // Find snapshot closest to 24h ago
    let closest: PortfolioSnapshot | null = null;
    let minDiff = Infinity;

    history.forEach(snapshot => {
      const diff = Math.abs(new Date(snapshot.timestamp).getTime() - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = snapshot;
      }
    });

    return closest;
  }

  /**
   * Add to snapshots list
   */
  private static async addToSnapshotsList(userId: string, snapshotId: string): Promise<void> {
    const listKey = `portfolio:snapshots:list:${userId}`;
    const existing = await cacheService.get(listKey);
    const list: string[] = existing ? JSON.parse(existing) : [];
    
    list.push(snapshotId);
    
    // Keep only last 100 snapshots
    if (list.length > 100) {
      list.shift();
    }
    
    await cacheService.set(listKey, JSON.stringify(list), 86400 * 90);
  }
}

