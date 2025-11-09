'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { walletSession, type WalletSession } from '@/lib/walletSession'

export function useWalletSession() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [session, setSession] = useState<WalletSession | null>(null)

  useEffect(() => {
    if (isConnected && address) {
      const existingSession = walletSession.getSession()
      
      if (existingSession && existingSession.address === address) {
        // Update existing session
        walletSession.updateChainId(chainId)
        walletSession.updateActivity()
        setSession(walletSession.getSession())
      } else {
        // Create new session
        const newSession = walletSession.createSession(address, chainId)
        setSession(newSession)
      }
    } else {
      setSession(null)
    }
  }, [isConnected, address, chainId])

  useEffect(() => {
    if (isConnected) {
      // Update activity on user interaction
      const handleActivity = () => {
        walletSession.updateActivity()
        setSession(walletSession.getSession())
      }

      // Update activity every 5 minutes
      const interval = setInterval(handleActivity, 5 * 60 * 1000)

      return () => clearInterval(interval)
    }
  }, [isConnected])

  const shouldAutoReconnect = walletSession.shouldAutoReconnect()
  const isValid = walletSession.isValid()
  const isExpired = walletSession.isExpired()
  const timeUntilExpiration = walletSession.getTimeUntilExpiration()

  return {
    session,
    isValid,
    isExpired,
    shouldAutoReconnect,
    timeUntilExpiration,
    clearSession: () => {
      walletSession.clearSession()
      setSession(null)
    },
  }
}

