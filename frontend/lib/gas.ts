/**
 * Gas Optimization Utilities
 * Provides utilities for gas price estimation and optimization
 */

import { useEstimateGas, useGasPrice, useFeeData } from 'wagmi'
import { type Address, type Hash, parseUnits, formatUnits } from 'viem'

/**
 * Hook to get current gas price
 */
export function useCurrentGasPrice() {
  return useGasPrice()
}

/**
 * Hook to get fee data (EIP-1559)
 */
export function useFeeData() {
  return useFeeData()
}

/**
 * Hook to estimate gas for a transaction
 */
export function useGasEstimate(
  to: Address | undefined,
  data: Hash | undefined,
  value?: bigint
) {
  return useEstimateGas({
    to,
    data,
    value,
    query: {
      enabled: !!to && !!data,
    },
  })
}

/**
 * Calculate gas cost in ETH
 */
export function calculateGasCost(gasLimit: bigint, gasPrice: bigint): bigint {
  return gasLimit * gasPrice
}

/**
 * Format gas cost for display
 */
export function formatGasCost(gasCost: bigint): string {
  return formatUnits(gasCost, 18)
}

/**
 * Get optimal gas price based on urgency
 */
export function getOptimalGasPrice(
  baseGasPrice: bigint,
  urgency: 'low' | 'medium' | 'high' = 'medium'
): bigint {
  const multipliers = {
    low: 0.9n,
    medium: 1n,
    high: 1.2n,
  }
  
  return (baseGasPrice * multipliers[urgency]) / 100n
}

/**
 * Gas optimization strategies
 */
export const GasStrategy = {
  /**
   * Conservative strategy - lower gas price, slower confirmation
   */
  conservative: (basePrice: bigint) => basePrice * 90n / 100n,
  
  /**
   * Standard strategy - normal gas price
   */
  standard: (basePrice: bigint) => basePrice,
  
  /**
   * Aggressive strategy - higher gas price, faster confirmation
   */
  aggressive: (basePrice: bigint) => basePrice * 120n / 100n,
} as const

