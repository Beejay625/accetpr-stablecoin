'use client'

import { useAuth } from '@clerk/nextjs'
import { useAccount, useChainId } from 'wagmi'
import { useState, useEffect } from 'react'
import { walletApi } from '@/lib/api'
import BalanceDisplay from './BalanceDisplay'
import TransactionsList from './TransactionsList'
import WithdrawForm from './WithdrawForm'
import BatchWithdrawForm from './BatchWithdrawForm'
import ChainSwitcher from './ChainSwitcher'
import CopyButton from './CopyButton'
import { formatAddress } from '@/lib/utils'
import StatisticsDashboard from './StatisticsDashboard'
import ActivityFeed from './ActivityFeed'
import AddressBook from './AddressBook'
import QRCodeModal from './QRCodeModal'
import { useState } from 'react'

export default function WalletDashboard() {
  const { getToken } = useAuth()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const [selectedChain, setSelectedChain] = useState<string>('base')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'addressbook'>('dashboard')

  // Map chainId to chain name
  const getChainName = (chainId: number): string => {
    const chainMap: Record<number, string> = {
      1: 'ethereum',
      8453: 'base',
      42161: 'arbitrum',
      84532: 'base-sepolia',
    }
    return chainMap[chainId] || 'base'
  }

  useEffect(() => {
    if (isConnected && chainId) {
      const chainName = getChainName(chainId)
      setSelectedChain(chainName)
    }
  }, [isConnected, chainId])

  if (!isConnected) {
    return (
      <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Please connect your wallet to view your dashboard
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 w-full max-w-4xl">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold">Wallet Dashboard</h2>
          <ChainSwitcher />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-gray-600 dark:text-gray-400">
            Connected: {address ? formatAddress(address) : 'N/A'}
          </p>
          {address && (
            <>
              <CopyButton text={address} label="Copy Address" />
              <button
                onClick={() => setShowQRCode(true)}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Show QR Code"
              >
                QR
              </button>
            </>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Chain: {selectedChain}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BalanceDisplay chain={selectedChain} getToken={getToken} />
        <WithdrawForm chain={selectedChain} getToken={getToken} />
      </div>

      <div className="mt-6">
        <BatchWithdrawForm chain={selectedChain} getToken={getToken} />
      </div>

      <div className="mt-6">
        <TransactionsList chain={selectedChain} getToken={getToken} />
      </div>
    </div>
  )
}

