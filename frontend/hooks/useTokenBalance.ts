'use client'

import { useState, useEffect } from 'react'
import { useReadContract, useAccount, useChainId } from 'wagmi'
import { erc20Abi } from 'viem'
import { getTokenAddress, formatTokenAmount } from '@/lib/contracts'

interface UseTokenBalanceOptions {
  tokenSymbol: string
  chain?: string
  enabled?: boolean
}

export function useTokenBalance({ tokenSymbol, chain, enabled = true }: UseTokenBalanceOptions) {
  const { address } = useAccount()
  const chainId = useChainId()
  const [tokenAddress, setTokenAddress] = useState<`0x${string}` | null>(null)
  const [decimals, setDecimals] = useState<number>(18)

  // Get token address
  useEffect(() => {
    if (chain && tokenSymbol) {
      const address = getTokenAddress(chain, tokenSymbol)
      setTokenAddress(address)
    }
  }, [chain, tokenSymbol])

  // Get decimals
  const { data: decimalsData } = useReadContract({
    address: tokenAddress || undefined,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress && enabled,
    },
  })

  useEffect(() => {
    if (decimalsData) {
      setDecimals(decimalsData as number)
    }
  }, [decimalsData])

  // Get balance
  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress || undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!tokenAddress && !!address && enabled,
    },
  })

  return {
    balance: balance ? formatTokenAmount(balance as bigint, decimals) : '0',
    rawBalance: balance as bigint | undefined,
    isLoading,
    error,
    refetch,
    tokenAddress,
    decimals,
  }
}

