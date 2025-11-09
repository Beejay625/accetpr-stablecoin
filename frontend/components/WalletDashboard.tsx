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
import NetworkStatus from './NetworkStatus'
import SettingsPanel from './SettingsPanel'
import HelpModal from './HelpModal'
import TransactionQueuePanel from './TransactionQueuePanel'
import GasPriceDisplay from './GasPriceDisplay'
import NotificationCenter from './NotificationCenter'
import TransactionTemplates from './TransactionTemplates'
import AddressValidator from './AddressValidator'
import PortfolioOverview from './PortfolioOverview'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useWalletSession } from '@/hooks/useWalletSession'
import { useEffect } from 'react'
import { keyboardShortcuts } from '@/lib/keyboardShortcuts'

export default function WalletDashboard() {
  const { getToken } = useAuth()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { track } = useAnalytics()
  const { session, isValid: sessionValid } = useWalletSession()
  const [selectedChain, setSelectedChain] = useState<string>('base')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'addressbook' | 'templates' | 'portfolio'>('dashboard')
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

  // Track wallet connection
  useEffect(() => {
    if (isConnected && address) {
      track('wallet_connected', { chain: selectedChain })
    } else {
      track('wallet_disconnected')
    }
  }, [isConnected, address, selectedChain, track])

  // Register keyboard shortcuts
  useEffect(() => {
    const unsubscribeRefresh = keyboardShortcuts.on('refresh_balance', () => {
      // Trigger balance refresh
      window.location.reload()
    })

    const unsubscribeSettings = keyboardShortcuts.on('open_settings', () => {
      setShowSettings(true)
    })

    const unsubscribeHelp = keyboardShortcuts.on('open_help', () => {
      setShowHelp(true)
    })

    return () => {
      unsubscribeRefresh()
      unsubscribeSettings()
      unsubscribeHelp()
    }
  }, [])

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
          <div className="flex items-center gap-4">
            <ChainSwitcher />
            <NotificationCenter />
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Settings"
            >
              ⚙️
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Help"
            >
              ?
            </button>
          </div>
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
        <div className="flex items-center gap-4 mt-2">
          <NetworkStatus />
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Chain: {selectedChain}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6 border-b dark:border-gray-700">
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedTab('dashboard')}
            className={`pb-2 px-1 border-b-2 ${
              selectedTab === 'dashboard'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setSelectedTab('addressbook')}
            className={`pb-2 px-1 border-b-2 ${
              selectedTab === 'addressbook'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Address Book
          </button>
          <button
            onClick={() => setSelectedTab('templates')}
            className={`pb-2 px-1 border-b-2 ${
              selectedTab === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setSelectedTab('portfolio')}
            className={`pb-2 px-1 border-b-2 ${
              selectedTab === 'portfolio'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Portfolio
          </button>
        </div>
      </div>

      {selectedTab === 'dashboard' ? (
        <>
          <TransactionQueuePanel />

          <div className="mb-6">
            <StatisticsDashboard chain={selectedChain} getToken={getToken} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <ActivityFeed chain={selectedChain} getToken={getToken} />
            </div>
            <div className="space-y-4">
              <BalanceDisplay chain={selectedChain} getToken={getToken} />
              <GasPriceDisplay />
              <AddressValidator
                onValidAddress={(address) => {
                  // Could auto-populate withdrawal form
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <WithdrawForm chain={selectedChain} getToken={getToken} />
            <BatchWithdrawForm chain={selectedChain} getToken={getToken} />
          </div>

          <div className="mt-6">
            <TransactionsList chain={selectedChain} getToken={getToken} />
          </div>
        </>
      ) : selectedTab === 'addressbook' ? (
        <AddressBook
          onSelectAddress={(address) => {
            // Could be used to populate withdrawal form
            console.log('Selected address:', address)
          }}
        />
      ) : selectedTab === 'templates' ? (
        <TransactionTemplates
          onSelectTemplate={(template) => {
            setSelectedTemplate(template)
            setSelectedTab('dashboard')
            // Could populate withdrawal form with template data
          }}
        />
      ) : (
        <PortfolioOverview
          chains={['base', 'arbitrum', 'ethereum']}
          getToken={getToken}
        />
      )}

      {address && (
        <QRCodeModal
          address={address}
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
        />
      )}

      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  )
}

