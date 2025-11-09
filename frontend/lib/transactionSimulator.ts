/**
 * Transaction Simulation and Preview
 * Simulates transactions before execution to show expected outcomes
 */

import { type Address, type Hash, parseUnits, formatUnits } from 'viem'

export interface TransactionSimulation {
  id: string
  from: Address
  to: Address
  value: bigint
  data: `0x${string}`
  gasEstimate: bigint
  gasPrice: bigint
  totalCost: bigint
  balanceBefore: bigint
  balanceAfter: bigint
  tokenBalanceBefore?: bigint
  tokenBalanceAfter?: bigint
  success: boolean
  error?: string
  timestamp: number
}

export interface SimulationResult {
  simulation: TransactionSimulation
  warnings: string[]
  recommendations: string[]
}

class TransactionSimulator {
  /**
   * Simulate a transaction
   */
  async simulate(
    from: Address,
    to: Address,
    value: bigint,
    data: `0x${string}`,
    gasPrice: bigint,
    currentBalance: bigint,
    tokenBalance?: bigint
  ): Promise<SimulationResult> {
    // Estimate gas (simplified - in production would use actual estimation)
    const gasEstimate = this.estimateGas(data, value)
    const totalCost = gasEstimate * gasPrice + value

    const simulation: TransactionSimulation = {
      id: `sim_${Date.now()}`,
      from,
      to,
      value,
      data,
      gasEstimate,
      gasPrice,
      totalCost,
      balanceBefore: currentBalance,
      balanceAfter: currentBalance - totalCost,
      tokenBalanceBefore: tokenBalance,
      tokenBalanceAfter: tokenBalance ? tokenBalance - value : undefined,
      success: currentBalance >= totalCost,
      timestamp: Date.now(),
    }

    if (currentBalance < totalCost) {
      simulation.error = 'Insufficient balance for transaction'
    }

    const warnings: string[] = []
    const recommendations: string[] = []

    // Check for warnings
    if (simulation.balanceAfter < parseUnits('0.01', 18)) {
      warnings.push('Balance will be very low after this transaction')
      recommendations.push('Consider keeping some ETH for future transactions')
    }

    if (gasEstimate > parseUnits('21000', 0)) {
      warnings.push('Gas estimate is higher than standard transfer')
      recommendations.push('Review transaction data - may be a complex operation')
    }

    if (value > currentBalance / 2n) {
      warnings.push('Transaction value is more than 50% of balance')
      recommendations.push('Double-check the transaction amount')
    }

    return {
      simulation,
      warnings,
      recommendations,
    }
  }

  /**
   * Estimate gas for a transaction
   */
  private estimateGas(data: `0x${string}`, value: bigint): bigint {
    // Base gas for transaction
    let gas = 21000n

    // Add gas for data (68 gas per non-zero byte, 4 gas per zero byte)
    if (data && data !== '0x') {
      const dataBytes = data.slice(2)
      for (let i = 0; i < dataBytes.length; i += 2) {
        const byte = dataBytes.slice(i, i + 2)
        gas += byte === '00' ? 4n : 68n
      }
    }

    // Add gas for value transfer
    if (value > 0n) {
      gas += 21000n // Additional gas for value transfer
    }

    return gas
  }

  /**
   * Format simulation result for display
   */
  formatSimulation(simulation: TransactionSimulation): {
    gasEstimate: string
    totalCost: string
    balanceBefore: string
    balanceAfter: string
    balanceChange: string
  } {
    return {
      gasEstimate: formatUnits(simulation.gasEstimate, 0),
      totalCost: formatUnits(simulation.totalCost, 18),
      balanceBefore: formatUnits(simulation.balanceBefore, 18),
      balanceAfter: formatUnits(simulation.balanceAfter, 18),
      balanceChange: formatUnits(
        simulation.balanceBefore - simulation.balanceAfter,
        18
      ),
    }
  }

  /**
   * Validate transaction before simulation
   */
  validateTransaction(
    from: Address,
    to: Address,
    value: bigint,
    currentBalance: bigint
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!from || !to) {
      errors.push('From and To addresses are required')
    }

    if (from === to) {
      errors.push('Cannot send to the same address')
    }

    if (value < 0n) {
      errors.push('Transaction value cannot be negative')
    }

    if (value > currentBalance) {
      errors.push('Insufficient balance')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

// Singleton instance
export const transactionSimulator = new TransactionSimulator()

