/**
 * React Hook for Smart Contract Interactions
 * Combines contract utilities into easy-to-use hooks
 */

import { useAccount, useChainId } from 'wagmi'
import { useTokenBalance, useTokenTotalSupply, useTokenSymbol, useTokenDecimals, useTokenTransfer, COMMON_TOKENS } from '@/lib/contracts'
import { type Address } from 'viem'

/**
 * Hook to get token information and balance
 */
export function useTokenInfo(tokenAddress: Address | undefined) {
  const { address } = useAccount()
  const chainId = useChainId()
  
  const balance = useTokenBalance(tokenAddress || '0x', address)
  const totalSupply = useTokenTotalSupply(tokenAddress || '0x')
  const symbol = useTokenSymbol(tokenAddress || '0x')
  const decimals = useTokenDecimals(tokenAddress || '0x')
  
  return {
    balance: balance.data,
    totalSupply: totalSupply.data,
    symbol: symbol.data,
    decimals: decimals.data,
    isLoading: balance.isLoading || totalSupply.isLoading || symbol.isLoading || decimals.isLoading,
    error: balance.error || totalSupply.error || symbol.error || decimals.error,
  }
}

/**
 * Hook to get common token address for current chain
 */
export function useCommonTokenAddress(token: 'USDC' | 'USDT' | 'DAI'): Address | undefined {
  const chainId = useChainId()
  
  // Map chain IDs to token addresses
  const chainIdToKey: Record<number, keyof typeof COMMON_TOKENS.USDC> = {
    1: 'ethereum',
    8453: 'base',
    42161: 'arbitrum',
    10: 'optimism',
    137: 'polygon',
  }
  
  const chainKey = chainIdToKey[chainId]
  if (!chainKey) return undefined
  
  return COMMON_TOKENS[token]?.[chainKey]
}

/**
 * Hook for token transfers with transaction tracking
 */
export function useTokenTransferWithTracking() {
  const transfer = useTokenTransfer()
  
  return {
    ...transfer,
    transfer: async (tokenAddress: Address, to: Address, amount: bigint) => {
      return transfer.transfer(tokenAddress, to, amount)
    },
  }
}

