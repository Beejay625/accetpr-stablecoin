import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';
import { walletRepository } from '../../repositories/database/wallet';
import { SingleWithdrawRequest } from '../../providers/blockradar/withdraw/withdraw.interface';
import { GasPriceOracleService } from './gasPriceOracleService';

/**
 * Transaction Validation Service
 * 
 * Pre-transaction validation with balance checks, gas estimation, and risk assessment
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  estimatedGasFee?: string;
  estimatedGasFeeUsd?: number;
  balanceCheck?: {
    sufficient: boolean;
    currentBalance: string;
    requiredBalance: string;
    asset: string;
  };
  gasEstimation?: {
    gasLimit: string;
    gasPrice: string;
    totalFee: string;
    totalFeeUsd?: number;
  };
  riskAssessment?: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

export class TransactionValidationService {
  private static logger = createLoggerWithFunction('TransactionValidationService', { module: 'transaction' });

  /**
   * Validate a transaction before execution
   */
  static async validateTransaction(
    userId: string,
    transaction: SingleWithdrawRequest
  ): Promise<ValidationResult> {
    const logger = createLoggerWithFunction('validateTransaction', { module: 'transaction' });
    
    try {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: []
      };

      // Validate basic fields
      this.validateBasicFields(transaction, result);

      // Check balance
      await this.validateBalance(userId, transaction, result);

      // Estimate gas
      await this.estimateGas(transaction, result);

      // Risk assessment
      await this.assessRisk(transaction, result);

      // Determine if valid (no errors)
      result.valid = result.errors.length === 0;

      logger.info({ userId, valid: result.valid, errors: result.errors.length, warnings: result.warnings.length }, 'Transaction validation completed');

      return result;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to validate transaction');
      throw error;
    }
  }

  /**
   * Validate basic transaction fields
   */
  private static validateBasicFields(
    transaction: SingleWithdrawRequest,
    result: ValidationResult
  ): void {
    // Validate chain
    if (!transaction.chain || typeof transaction.chain !== 'string') {
      result.errors.push('Chain is required');
      result.valid = false;
    }

    // Validate asset
    if (!transaction.asset || typeof transaction.asset !== 'string') {
      result.errors.push('Asset is required');
      result.valid = false;
    }

    // Validate address
    if (!transaction.address || typeof transaction.address !== 'string') {
      result.errors.push('Recipient address is required');
      result.valid = false;
    } else {
      // Basic Ethereum address validation
      if (!/^0x[a-fA-F0-9]{40}$/.test(transaction.address)) {
        result.errors.push('Invalid recipient address format');
        result.valid = false;
      }
    }

    // Validate amount
    if (!transaction.amount || typeof transaction.amount !== 'string') {
      result.errors.push('Amount is required');
      result.valid = false;
    } else {
      const amount = parseFloat(transaction.amount);
      if (isNaN(amount) || amount <= 0) {
        result.errors.push('Amount must be a positive number');
        result.valid = false;
      } else if (amount > 1000000) {
        result.warnings.push('Large transaction amount detected');
      }
    }
  }

  /**
   * Validate balance sufficiency
   */
  private static async validateBalance(
    userId: string,
    transaction: SingleWithdrawRequest,
    result: ValidationResult
  ): Promise<void> {
    try {
      // Get wallet balance
      const addressId = await walletRepository.getAddressId(userId, transaction.chain);
      if (!addressId) {
        result.errors.push('Wallet address not found for chain');
        result.valid = false;
        return;
      }

      // Get balance from BlockRadar (simplified - would need actual balance check)
      // For now, we'll use a placeholder
      const currentBalance = '0'; // Would fetch actual balance
      const requiredBalance = transaction.amount;

      const balanceNum = parseFloat(currentBalance);
      const requiredNum = parseFloat(requiredBalance);

      result.balanceCheck = {
        sufficient: balanceNum >= requiredNum,
        currentBalance,
        requiredBalance,
        asset: transaction.asset
      };

      if (!result.balanceCheck.sufficient) {
        result.errors.push(`Insufficient balance. Current: ${currentBalance} ${transaction.asset}, Required: ${requiredBalance} ${transaction.asset}`);
        result.valid = false;
      }
    } catch (error: any) {
      result.warnings.push('Could not verify balance');
    }
  }

  /**
   * Estimate gas fees
   */
  private static async estimateGas(
    transaction: SingleWithdrawRequest,
    result: ValidationResult
  ): Promise<void> {
    try {
      const gasPrices = await GasPriceOracleService.getGasPrices(transaction.chain);
      
      if (gasPrices) {
        // Standard gas limit for ERC20 transfer
        const gasLimit = '65000'; // Typical ERC20 transfer gas limit
        const gasPrice = gasPrices.standard; // Use standard gas price
        
        const gasLimitNum = BigInt(gasLimit);
        const gasPriceNum = BigInt(Math.floor(parseFloat(gasPrice) * 1e9)); // Convert gwei to wei
        
        const totalFee = gasLimitNum * gasPriceNum;
        const totalFeeEth = Number(totalFee) / 1e18;

        result.gasEstimation = {
          gasLimit,
          gasPrice,
          totalFee: totalFee.toString(),
          totalFeeUsd: totalFeeEth * 2000 // Rough USD estimate (ETH price)
        };

        result.estimatedGasFee = totalFee.toString();
        result.estimatedGasFeeUsd = result.gasEstimation.totalFeeUsd;

        // Warning for high gas fees
        if (totalFeeEth > 0.01) {
          result.warnings.push('High gas fee detected');
        }
      }
    } catch (error: any) {
      result.warnings.push('Could not estimate gas fees');
    }
  }

  /**
   * Assess transaction risk
   */
  private static async assessRisk(
    transaction: SingleWithdrawRequest,
    result: ValidationResult
  ): Promise<void> {
    const factors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check amount
    const amount = parseFloat(transaction.amount);
    if (amount > 10000) {
      factors.push('Large transaction amount');
      riskLevel = 'medium';
    }
    if (amount > 100000) {
      riskLevel = 'high';
    }

    // Check if address is in whitelist (would need whitelist service)
    // For now, we'll skip this check

    // Check gas price (high gas = potential urgency/risk)
    const gasPrices = await GasPriceOracleService.getGasPrices(transaction.chain);
    if (gasPrices) {
      const standardGas = parseFloat(gasPrices.standard);
      if (standardGas > 100) {
        factors.push('High network congestion');
        if (riskLevel === 'low') riskLevel = 'medium';
      }
    }

    result.riskAssessment = {
      level: riskLevel,
      factors
    };

    if (riskLevel === 'high') {
      result.warnings.push('High-risk transaction detected');
    }
  }

  /**
   * Validate multiple transactions (batch validation)
   */
  static async validateBatch(
    userId: string,
    transactions: SingleWithdrawRequest[]
  ): Promise<ValidationResult[]> {
    const logger = createLoggerWithFunction('validateBatch', { module: 'transaction' });
    
    try {
      const results = await Promise.all(
        transactions.map(tx => this.validateTransaction(userId, tx))
      );

      logger.info({ userId, count: transactions.length, valid: results.filter(r => r.valid).length }, 'Batch validation completed');

      return results;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to validate batch');
      throw error;
    }
  }
}

