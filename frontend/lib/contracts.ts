import { Address, formatUnits, parseUnits } from 'viem'
import { erc20Abi } from 'viem'

// Common token addresses by chain
export const TOKEN_ADDRESSES: Record<string, Record<string, Address>> = {
  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as Address,
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917E0d69' as Address,
  },
  arbitrum: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address,
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as Address,
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' as Address,
  },
  ethereum: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
  },
}

export interface TokenMetadata {
  symbol: string
  decimals: number
  name: string
  totalSupply?: string
}

export interface TokenBalance {
  balance: string
  formatted: string
  decimals: number
  symbol: string
}

/**
 * Get ERC20 token address for a given chain and symbol
 */
export function getTokenAddress(chain: string, symbol: string): Address | null {
  const chainLower = chain.toLowerCase()
  const symbolUpper = symbol.toUpperCase()
  
  if (TOKEN_ADDRESSES[chainLower] && TOKEN_ADDRESSES[chainLower][symbolUpper]) {
    return TOKEN_ADDRESSES[chainLower][symbolUpper]
  }
  
  return null
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals)
}

/**
 * Parse token amount to bigint
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  return parseUnits(amount, decimals)
}

/**
 * Get ERC20 ABI for token interactions
 */
export function getERC20ABI() {
  return erc20Abi
}

/**
 * Common ERC20 function names
 */
export const ERC20_FUNCTIONS = {
  balanceOf: 'balanceOf',
  transfer: 'transfer',
  approve: 'approve',
  allowance: 'allowance',
  totalSupply: 'totalSupply',
  decimals: 'decimals',
  symbol: 'symbol',
  name: 'name',
} as const

/**
 * Get token metadata helper
 */
export async function getTokenMetadata(
  address: Address,
  publicClient: any
): Promise<TokenMetadata | null> {
  try {
    const [symbol, decimals, name] = await Promise.all([
      publicClient.readContract({
        address,
        abi: erc20Abi,
        functionName: 'symbol',
      }),
      publicClient.readContract({
        address,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
      publicClient.readContract({
        address,
        abi: erc20Abi,
        functionName: 'name',
      }),
    ])

    return {
      symbol: symbol as string,
      decimals: decimals as number,
      name: name as string,
    }
  } catch (error) {
    console.error('Failed to get token metadata:', error)
    return null
  }
}
