/**
 * Wallet Session Management
 * Handles wallet session persistence, auto-reconnect, and state management
 */

import { type Address } from 'viem'

export interface WalletSession {
  address: Address
  chainId: number
  walletType: string
  connectedAt: number
  lastActivity: number
}

const SESSION_STORAGE_KEY = 'wallet_session'
const SESSION_TIMEOUT = 1000 * 60 * 60 * 24 // 24 hours

class WalletSessionManager {
  /**
   * Save session to localStorage
   */
  saveSession(session: WalletSession): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to save wallet session:', error)
    }
  }

  /**
   * Get session from localStorage
   */
  getSession(): WalletSession | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!stored) return null
      
      const session: WalletSession = JSON.parse(stored)
      
      // Check if session is expired
      const now = Date.now()
      if (now - session.lastActivity > SESSION_TIMEOUT) {
        this.clearSession()
        return null
      }
      
      return session
    } catch (error) {
      console.error('Failed to get wallet session:', error)
      return null
    }
  }

  /**
   * Update session activity timestamp
   */
  updateActivity(): void {
    const session = this.getSession()
    if (session) {
      session.lastActivity = Date.now()
      this.saveSession(session)
    }
  }

  /**
   * Clear session
   */
  clearSession(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear wallet session:', error)
    }
  }

  /**
   * Check if session exists and is valid
   */
  hasValidSession(): boolean {
    return this.getSession() !== null
  }

  /**
   * Auto-reconnect logic
   * Returns session if valid, null otherwise
   */
  shouldAutoReconnect(): WalletSession | null {
    const session = this.getSession()
    if (!session) return null
    
    // Check if session is still valid
    const now = Date.now()
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      this.clearSession()
      return null
    }
    
    return session
  }
}

// Singleton instance
export const walletSessionManager = new WalletSessionManager()

