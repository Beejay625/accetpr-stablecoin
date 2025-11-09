import { createLoggerWithFunction } from '../../logger';
import { GasPriceOracleService, GasPriceData } from './gasPriceOracleService';

/**
 * Gas Optimization Recommendations Service
 * 
 * Provides smart gas price recommendations based on network conditions
 */
export interface GasRecommendation {
  priority: 'low' | 'standard' | 'high' | 'urgent';
  gasPrice: string; // gwei
  estimatedConfirmationTime: number; // seconds
  estimatedCost: string; // wei
  estimatedCostUsd?: number;
  recommendation: string;
  networkCongestion: 'low' | 'medium' | 'high';
  currentGasPrices: GasPriceData;
}

export interface OptimizationStrategy {
  name: string;
  description: string;
  gasPrice: string;
  estimatedConfirmationTime: number;
  estimatedCost: string;
  estimatedCostUsd?: number;
}

export class GasOptimizationService {
  private static logger = createLoggerWithFunction('GasOptimizationService', { module: 'gas' });

  /**
   * Get gas price recommendation based on urgency and network conditions
   */
  static async getRecommendation(
    chain: string,
    urgency: 'low' | 'standard' | 'high' | 'urgent' = 'standard',
    gasLimit?: string
  ): Promise<GasRecommendation> {
    const logger = createLoggerWithFunction('getRecommendation', { module: 'gas' });
    
    try {
      const gasPrices = await GasPriceOracleService.getGasPrices(chain);
      
      if (!gasPrices) {
        throw new Error('Could not fetch gas prices');
      }

      // Determine network congestion
      const networkCongestion = this.assessNetworkCongestion(gasPrices);

      // Get recommended gas price based on urgency
      const recommendation = this.calculateRecommendation(gasPrices, urgency, networkCongestion);

      // Estimate confirmation time
      const estimatedConfirmationTime = this.estimateConfirmationTime(urgency, networkCongestion);

      // Calculate cost
      const defaultGasLimit = gasLimit || '21000'; // Standard ETH transfer
      const gasLimitNum = BigInt(defaultGasLimit);
      const gasPriceNum = BigInt(Math.floor(parseFloat(recommendation.gasPrice) * 1e9)); // Convert gwei to wei
      const estimatedCost = gasLimitNum * gasPriceNum;
      const estimatedCostEth = Number(estimatedCost) / 1e18;
      const estimatedCostUsd = estimatedCostEth * 2000; // Rough USD estimate

      const result: GasRecommendation = {
        priority: urgency,
        gasPrice: recommendation.gasPrice,
        estimatedConfirmationTime,
        estimatedCost: estimatedCost.toString(),
        estimatedCostUsd,
        recommendation: recommendation.reason,
        networkCongestion,
        currentGasPrices: gasPrices
      };

      logger.info({ chain, urgency, gasPrice: recommendation.gasPrice, confirmationTime: estimatedConfirmationTime }, 'Gas recommendation generated');

      return result;
    } catch (error: any) {
      logger.error({ chain, urgency, error: error.message }, 'Failed to get gas recommendation');
      throw error;
    }
  }

  /**
   * Get all optimization strategies for comparison
   */
  static async getAllStrategies(
    chain: string,
    gasLimit?: string
  ): Promise<OptimizationStrategy[]> {
    const logger = createLoggerWithFunction('getAllStrategies', { module: 'gas' });
    
    try {
      const gasPrices = await GasPriceOracleService.getGasPrices(chain);
      
      if (!gasPrices) {
        throw new Error('Could not fetch gas prices');
      }

      const strategies: OptimizationStrategy[] = [];

      // Low priority strategy
      const lowGasPrice = gasPrices.slow;
      const lowConfirmationTime = this.estimateConfirmationTime('low', this.assessNetworkCongestion(gasPrices));
      const lowCost = this.calculateCost(lowGasPrice, gasLimit || '21000');
      
      strategies.push({
        name: 'Low Priority',
        description: 'Lowest gas price, slowest confirmation (15-30 minutes)',
        gasPrice: lowGasPrice,
        estimatedConfirmationTime: lowConfirmationTime,
        estimatedCost: lowCost.cost,
        estimatedCostUsd: lowCost.costUsd
      });

      // Standard priority strategy
      const standardGasPrice = gasPrices.standard;
      const standardConfirmationTime = this.estimateConfirmationTime('standard', this.assessNetworkCongestion(gasPrices));
      const standardCost = this.calculateCost(standardGasPrice, gasLimit || '21000');
      
      strategies.push({
        name: 'Standard Priority',
        description: 'Balanced gas price and confirmation time (2-5 minutes)',
        gasPrice: standardGasPrice,
        estimatedConfirmationTime: standardConfirmationTime,
        estimatedCost: standardCost.cost,
        estimatedCostUsd: standardCost.costUsd
      });

      // High priority strategy
      const highGasPrice = gasPrices.fast;
      const highConfirmationTime = this.estimateConfirmationTime('high', this.assessNetworkCongestion(gasPrices));
      const highCost = this.calculateCost(highGasPrice, gasLimit || '21000');
      
      strategies.push({
        name: 'High Priority',
        description: 'Higher gas price for faster confirmation (30-60 seconds)',
        gasPrice: highGasPrice,
        estimatedConfirmationTime: highConfirmationTime,
        estimatedCost: highCost.cost,
        estimatedCostUsd: highCost.costUsd
      });

      // Urgent priority strategy (120% of fast)
      const urgentGasPrice = (parseFloat(gasPrices.fast) * 1.2).toFixed(2);
      const urgentConfirmationTime = this.estimateConfirmationTime('urgent', this.assessNetworkCongestion(gasPrices));
      const urgentCost = this.calculateCost(urgentGasPrice, gasLimit || '21000');
      
      strategies.push({
        name: 'Urgent Priority',
        description: 'Highest gas price for immediate confirmation (< 30 seconds)',
        gasPrice: urgentGasPrice,
        estimatedConfirmationTime: urgentConfirmationTime,
        estimatedCost: urgentCost.cost,
        estimatedCostUsd: urgentCost.costUsd
      });

      logger.info({ chain, strategyCount: strategies.length }, 'Generated optimization strategies');

      return strategies;
    } catch (error: any) {
      logger.error({ chain, error: error.message }, 'Failed to get optimization strategies');
      throw error;
    }
  }

  /**
   * Assess network congestion level
   */
  private static assessNetworkCongestion(gasPrices: GasPriceData): 'low' | 'medium' | 'high' {
    const standardGas = parseFloat(gasPrices.standard);
    
    // These thresholds are chain-specific and would ideally be dynamic
    if (standardGas < 10) {
      return 'low';
    } else if (standardGas < 50) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Calculate recommended gas price
   */
  private static calculateRecommendation(
    gasPrices: GasPriceData,
    urgency: 'low' | 'standard' | 'high' | 'urgent',
    congestion: 'low' | 'medium' | 'high'
  ): { gasPrice: string; reason: string } {
    let gasPrice: string;
    let reason: string;

    switch (urgency) {
      case 'low':
        gasPrice = gasPrices.slow;
        reason = 'Low priority: Use slow gas price for cost savings. Confirmation may take 15-30 minutes.';
        break;
      case 'standard':
        gasPrice = gasPrices.standard;
        reason = 'Standard priority: Balanced gas price for normal transactions. Confirmation typically takes 2-5 minutes.';
        break;
      case 'high':
        gasPrice = gasPrices.fast;
        reason = 'High priority: Use fast gas price for quicker confirmation. Confirmation typically takes 30-60 seconds.';
        break;
      case 'urgent':
        // 120% of fast price
        gasPrice = (parseFloat(gasPrices.fast) * 1.2).toFixed(2);
        reason = 'Urgent priority: Maximum gas price for immediate confirmation. Confirmation typically takes less than 30 seconds.';
        break;
    }

    // Adjust based on congestion
    if (congestion === 'high' && urgency !== 'urgent') {
      const adjustedPrice = (parseFloat(gasPrice) * 1.1).toFixed(2);
      reason += ` Network congestion is high. Consider increasing gas price by 10% for better confirmation times.`;
      gasPrice = adjustedPrice;
    }

    return { gasPrice, reason };
  }

  /**
   * Estimate confirmation time based on priority and congestion
   */
  private static estimateConfirmationTime(
    urgency: 'low' | 'standard' | 'high' | 'urgent',
    congestion: 'low' | 'medium' | 'high'
  ): number {
    // Base times in seconds
    const baseTimes: Record<string, number> = {
      low: 900,      // 15 minutes
      standard: 180, // 3 minutes
      high: 45,      // 45 seconds
      urgent: 15     // 15 seconds
    };

    let time = baseTimes[urgency] || 180;

    // Adjust for congestion
    if (congestion === 'high') {
      time = Math.ceil(time * 1.5);
    } else if (congestion === 'medium') {
      time = Math.ceil(time * 1.2);
    }

    return time;
  }

  /**
   * Calculate transaction cost
   */
  private static calculateCost(gasPrice: string, gasLimit: string): { cost: string; costUsd: number } {
    const gasLimitNum = BigInt(gasLimit);
    const gasPriceNum = BigInt(Math.floor(parseFloat(gasPrice) * 1e9)); // Convert gwei to wei
    const cost = gasLimitNum * gasPriceNum;
    const costEth = Number(cost) / 1e18;
    const costUsd = costEth * 2000; // Rough USD estimate

    return {
      cost: cost.toString(),
      costUsd
    };
  }

  /**
   * Get optimal gas price for a target confirmation time
   */
  static async getOptimalGasPrice(
    chain: string,
    targetConfirmationTime: number, // seconds
    gasLimit?: string
  ): Promise<GasRecommendation> {
    const logger = createLoggerWithFunction('getOptimalGasPrice', { module: 'gas' });
    
    try {
      const gasPrices = await GasPriceOracleService.getGasPrices(chain);
      
      if (!gasPrices) {
        throw new Error('Could not fetch gas prices');
      }

      // Determine urgency based on target time
      let urgency: 'low' | 'standard' | 'high' | 'urgent';
      if (targetConfirmationTime <= 30) {
        urgency = 'urgent';
      } else if (targetConfirmationTime <= 60) {
        urgency = 'high';
      } else if (targetConfirmationTime <= 300) {
        urgency = 'standard';
      } else {
        urgency = 'low';
      }

      return await this.getRecommendation(chain, urgency, gasLimit);
    } catch (error: any) {
      logger.error({ chain, targetConfirmationTime, error: error.message }, 'Failed to get optimal gas price');
      throw error;
    }
  }
}

