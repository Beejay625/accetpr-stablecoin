import { formatUnits, parseUnits } from 'viem'

export interface GasPriceData {
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  gasPrice?: bigint
}

export interface GasEstimate {
  gasLimit: bigint
  gasPrice: GasPriceData
  estimatedCost: string
  estimatedCostUSD?: string
}

export type GasStrategy = 'conservative' | 'standard' | 'aggressive'

/**
 * Get gas price data from public client
 */
export async function getGasPrice(publicClient: any): Promise<GasPriceData> {
  try {
    const block = await publicClient.getBlock({ blockTag: 'latest' })
    
    // Try EIP-1559 first
    if (block.baseFeePerGas) {
      const maxPriorityFeePerGas = await publicClient.estimateMaxPriorityFeePerGas()
      const maxFeePerGas = (block.baseFeePerGas * BigInt(2)) + maxPriorityFeePerGas
      
      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
      }
    }
    
    // Fallback to legacy gas price
    const gasPrice = await publicClient.getGasPrice()
    return { gasPrice }
  } catch (error) {
    console.error('Failed to get gas price:', error)
    // Return default values
    return {
      gasPrice: parseUnits('20', 'gwei'),
    }
  }
}

/**
 * Apply gas strategy multiplier
 */
export function applyGasStrategy(
  gasPrice: GasPriceData,
  strategy: GasStrategy = 'standard'
): GasPriceData {
  const multipliers = {
    conservative: 0.9,
    standard: 1.0,
    aggressive: 1.1,
  }

  const multiplier = multipliers[strategy]

  if (gasPrice.maxFeePerGas && gasPrice.maxPriorityFeePerGas) {
    return {
      maxFeePerGas: BigInt(Math.floor(Number(gasPrice.maxFeePerGas) * multiplier)),
      maxPriorityFeePerGas: BigInt(Math.floor(Number(gasPrice.maxPriorityFeePerGas) * multiplier)),
    }
  }

  if (gasPrice.gasPrice) {
    return {
      gasPrice: BigInt(Math.floor(Number(gasPrice.gasPrice) * multiplier)),
    }
  }

  return gasPrice
}

/**
 * Estimate gas cost
 */
export function estimateGasCost(
  gasLimit: bigint,
  gasPrice: GasPriceData,
  ethPriceUSD?: number
): { cost: string; costUSD?: string } {
  let costWei: bigint

  if (gasPrice.maxFeePerGas) {
    costWei = gasLimit * gasPrice.maxFeePerGas
  } else if (gasPrice.gasPrice) {
    costWei = gasLimit * gasPrice.gasPrice
  } else {
    costWei = BigInt(0)
  }

  const costEth = formatUnits(costWei, 18)
  
  let costUSD: string | undefined
  if (ethPriceUSD) {
    const costUSDNum = parseFloat(costEth) * ethPriceUSD
    costUSD = costUSDNum.toFixed(2)
  }

  return {
    cost: costEth,
    costUSD,
  }
}

/**
 * Format gas price for display
 */
export function formatGasPrice(gasPrice: GasPriceData): string {
  if (gasPrice.maxFeePerGas) {
    return `${formatUnits(gasPrice.maxFeePerGas, 'gwei')} gwei`
  }
  if (gasPrice.gasPrice) {
    return `${formatUnits(gasPrice.gasPrice, 'gwei')} gwei`
  }
  return 'N/A'
}

/**
 * Get recommended gas limit for common operations
 */
export const RECOMMENDED_GAS_LIMITS = {
  transfer: 21000n,
  erc20Transfer: 65000n,
  erc20Approve: 46000n,
  contractInteraction: 100000n,
} as const
