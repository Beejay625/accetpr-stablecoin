import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';

/**
 * Transaction Fee Calculator Service
 * 
 * Provides advanced fee estimation and calculation
 */
export interface FeeEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  totalFee: string;
  totalFeeUsd?: number;
  breakdown: {
    baseFee?: string;
    priorityFee?: string;
    gasLimit: string;
    gasPrice: string;
  };
  estimatedConfirmationTime?: number; // seconds
  networkCongestion?: 'low' | 'medium' | 'high';
}

export interface FeeCalculationOptions {
  transactionType: 'transfer' | 'contract' | 'swap' | 'approval';
  data?: string;
  to?: string;
  value?: string;
  gasMultiplier?: number; // Safety multiplier (default: 1.2)
  priority?: 'low' | 'standard' | 'high' | 'urgent';
}

export class FeeCalculatorService {
  private static logger = createLoggerWithFunction('FeeCalculatorService', { module: 'fee' });

  /**
   * Calculate transaction fee estimate
   */
  static async calculateFee(
    chain: string,
    options: FeeCalculationOptions
  ): Promise<FeeEstimate> {
    const logger = createLoggerWithFunction('calculateFee', { module: 'fee' });
    
    try {
      // Get current gas prices from cache or network
      const gasPrices = await this.getGasPrices(chain);
      
      // Estimate gas limit based on transaction type
      const gasLimit = await this.estimateGasLimit(chain, options);
      
      // Calculate fees based on gas price strategy
      const priorityMultiplier = this.getPriorityMultiplier(options.priority || 'standard');
      const gasPrice = BigInt(gasPrices.standard) * BigInt(Math.floor(priorityMultiplier * 100)) / BigInt(100);
      
      // Apply safety multiplier
      const safetyMultiplier = options.gasMultiplier || 1.2;
      const finalGasLimit = BigInt(Math.floor(Number(gasLimit) * safetyMultiplier));
      
      // Calculate total fee
      const totalFee = gasPrice * finalGasLimit;
      
      // Get USD price if available
      const feeUsd = await this.convertFeeToUsd(chain, totalFee.toString());
      
      // Estimate confirmation time based on priority
      const estimatedConfirmationTime = this.estimateConfirmationTime(
        chain,
        options.priority || 'standard',
        gasPrices
      );
      
      // Determine network congestion
      const networkCongestion = this.determineCongestion(gasPrices);

      const estimate: FeeEstimate = {
        gasLimit: finalGasLimit.toString(),
        gasPrice: gasPrice.toString(),
        totalFee: totalFee.toString(),
        totalFeeUsd: feeUsd,
        breakdown: {
          gasLimit: finalGasLimit.toString(),
          gasPrice: gasPrice.toString()
        },
        estimatedConfirmationTime,
        networkCongestion
      };

      // Add EIP-1559 fields if supported
      if (gasPrices.maxFeePerGas && gasPrices.maxPriorityFeePerGas) {
        estimate.maxFeePerGas = gasPrices.maxFeePerGas;
        estimate.maxPriorityFeePerGas = gasPrices.maxPriorityFeePerGas;
        estimate.breakdown.baseFee = gasPrices.baseFee;
        estimate.breakdown.priorityFee = gasPrices.maxPriorityFeePerGas;
      }

      logger.debug({ chain, options, estimate }, 'Fee calculated');

      return estimate;
    } catch (error: any) {
      logger.error({ chain, options, error: error.message }, 'Failed to calculate fee');
      throw error;
    }
  }

  /**
   * Compare fee estimates for different priority levels
   */
  static async compareFeeEstimates(
    chain: string,
    options: FeeCalculationOptions
  ): Promise<Record<string, FeeEstimate>> {
    const logger = createLoggerWithFunction('compareFeeEstimates', { module: 'fee' });
    
    try {
      const priorities: Array<'low' | 'standard' | 'high' | 'urgent'> = ['low', 'standard', 'high', 'urgent'];
      
      const estimates = await Promise.all(
        priorities.map(async (priority) => {
          const estimate = await this.calculateFee(chain, { ...options, priority });
          return { priority, estimate };
        })
      );

      const result: Record<string, FeeEstimate> = {};
      estimates.forEach(({ priority, estimate }) => {
        result[priority] = estimate;
      });

      return result;
    } catch (error: any) {
      logger.error({ chain, options, error: error.message }, 'Failed to compare fee estimates');
      throw error;
    }
  }

  /**
   * Get current gas prices for a chain
   */
  private static async getGasPrices(chain: string): Promise<{
    slow: string;
    standard: string;
    fast: string;
    baseFee?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  }> {
    const cacheKey = `gas:prices:${chain}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Default gas prices (in wei) - these would come from a gas price oracle
    const defaultPrices = {
      slow: '20000000000', // 20 gwei
      standard: '30000000000', // 30 gwei
      fast: '50000000000', // 50 gwei
      baseFee: '20000000000',
      maxFeePerGas: '50000000000',
      maxPriorityFeePerGas: '2000000000' // 2 gwei
    };

    return defaultPrices;
  }

  /**
   * Estimate gas limit based on transaction type
   */
  private static async estimateGasLimit(
    chain: string,
    options: FeeCalculationOptions
  ): Promise<string> {
    // Base gas limits for different transaction types
    const baseLimits: Record<string, string> = {
      transfer: '21000',
      contract: '100000',
      swap: '200000',
      approval: '46000'
    };

    let baseLimit = baseLimits[options.transactionType] || '21000';

    // Add extra gas for data if present
    if (options.data) {
      const dataLength = options.data.length / 2 - 1; // Remove '0x' prefix
      const dataGas = dataLength * 16; // 16 gas per byte
      baseLimit = (BigInt(baseLimit) + BigInt(dataGas)).toString();
    }

    return baseLimit;
  }

  /**
   * Get priority multiplier
   */
  private static getPriorityMultiplier(priority: 'low' | 'standard' | 'high' | 'urgent'): number {
    const multipliers = {
      low: 0.8,
      standard: 1.0,
      high: 1.5,
      urgent: 2.0
    };

    return multipliers[priority];
  }

  /**
   * Estimate confirmation time based on priority
   */
  private static estimateConfirmationTime(
    chain: string,
    priority: 'low' | 'standard' | 'high' | 'urgent',
    gasPrices: any
  ): number {
    // Average block times (seconds)
    const blockTimes: Record<string, number> = {
      ethereum: 12,
      base: 2,
      arbitrum: 0.25,
      optimism: 2,
      polygon: 2
    };

    const blockTime = blockTimes[chain] || 12;
    
    // Estimated blocks to confirmation based on priority
    const blocksToConfirmation: Record<string, number> = {
      low: 10,
      standard: 3,
      high: 1,
      urgent: 1
    };

    return blockTime * blocksToConfirmation[priority];
  }

  /**
   * Determine network congestion level
   */
  private static determineCongestion(gasPrices: any): 'low' | 'medium' | 'high' {
    const standardGas = BigInt(gasPrices.standard);
    const fastGas = BigInt(gasPrices.fast);
    
    // Calculate ratio
    const ratio = Number(fastGas) / Number(standardGas);
    
    if (ratio < 1.2) {
      return 'low';
    } else if (ratio < 1.5) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Convert fee to USD
   */
  private static async convertFeeToUsd(chain: string, feeWei: string): Promise<number | undefined> {
    try {
      // Get native token price (ETH, MATIC, etc.)
      const cacheKey = `token:price:native:${chain}`;
      const cached = await cacheService.get(cacheKey);
      
      if (!cached) {
        return undefined;
      }

      const priceData = JSON.parse(cached);
      const priceUsd = priceData.priceUsd || 0;
      
      // Convert wei to native token amount
      const nativeAmount = Number(feeWei) / 1e18;
      
      return nativeAmount * priceUsd;
    } catch {
      return undefined;
    }
  }
}

