/**
 * Smart Contract Interaction Utilities
 * Provides hooks and utilities for interacting with smart contracts using Wagmi
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { type Address, type Hash } from 'viem'

/**
 * ERC20 Token ABI (minimal interface)
 */
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const

/**
 * Hook to read ERC20 token balance
 */
export function useTokenBalance(tokenAddress: Address, userAddress?: Address) {
  return useReadContract({
    abi: ERC20_ABI,
    address: tokenAddress,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!tokenAddress,
    },
  })
}

/**
 * Hook to read ERC20 token total supply
 */
export function useTokenTotalSupply(tokenAddress: Address) {
  return useReadContract({
    abi: ERC20_ABI,
    address: tokenAddress,
    functionName: 'totalSupply',
    query: {
      enabled: !!tokenAddress,
    },
  })
}

/**
 * Hook to read ERC20 token decimals
 */
export function useTokenDecimals(tokenAddress: Address) {
  return useReadContract({
    abi: ERC20_ABI,
    address: tokenAddress,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
    },
  })
}

/**
 * Hook to read ERC20 token symbol
 */
export function useTokenSymbol(tokenAddress: Address) {
  return useReadContract({
    abi: ERC20_ABI,
    address: tokenAddress,
    functionName: 'symbol',
    query: {
      enabled: !!tokenAddress,
    },
  })
}

/**
 * Hook to transfer ERC20 tokens
 */
export function useTokenTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const transfer = async (
    tokenAddress: Address,
    to: Address,
    amount: bigint
  ) => {
    writeContract({
      abi: ERC20_ABI,
      address: tokenAddress,
      functionName: 'transfer',
      args: [to, amount],
    })
  }

  return {
    transfer,
    hash,
    isPending,
    error,
  }
}

/**
 * Hook to wait for transaction receipt
 */
export function useTransactionReceipt(hash: Hash | undefined) {
  return useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  })
}

/**
 * Common token addresses (mainnet)
 */
export const COMMON_TOKENS = {
  USDC: {
    ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
    base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
    arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address,
    optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as Address,
    polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as Address,
  },
  USDT: {
    ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
    base: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as Address,
    arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as Address,
  },
  DAI: {
    ethereum: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
    base: '0x50c5725949A6F0c72E6C4a641F24049A917E0Cb6' as Address,
  },
} as const

