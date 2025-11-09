'use client'

import { useAccount, useChainId } from 'wagmi'
import { getChainDisplayName } from '@/lib/utils'

export default function NetworkStatus() {
  const { isConnected } = useAccount()
  const chainId = useChainId()

  const getChainName = (chainId: number): string => {
    const chainMap: Record<number, string> = {
      1: 'ethereum',
      8453: 'base',
      42161: 'arbitrum',
      84532: 'base-sepolia',
    }
    return chainMap[chainId] || 'unknown'
  }

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-gray-500">Not Connected</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-gray-700 dark:text-gray-300">
        Connected to {getChainDisplayName(getChainName(chainId))}
      </span>
    </div>
  )
}

