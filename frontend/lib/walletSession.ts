export interface WalletSession {
  address: string
  chainId: number
  connectedAt: number
  lastActivity: number
  expiresAt: number
}

const SESSION_STORAGE_KEY = 'wallet_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

class WalletSessionManager {
  /**
   * Create a new session
   */
  createSession(address: string, chainId: number): WalletSession {
    const now = Date.now()
    const session: WalletSession = {
      address,
      chainId,
      connectedAt: now,
      lastActivity: now,
      expiresAt: now + SESSION_DURATION,
    }

    this.saveSession(session)
    return session
  }

  /**
   * Get current session
   */
  getSession(): WalletSession | null {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!stored) return null

      const session: WalletSession = JSON.parse(stored)

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.clearSession()
        return null
      }

      return session
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  /**
   * Update session activity
   */
  updateActivity(): void {
    const session = this.getSession()
    if (session) {
      session.lastActivity = Date.now()
      // Extend session on activity
      session.expiresAt = Date.now() + SESSION_DURATION
      this.saveSession(session)
    }
  }

  /**
   * Update chain ID
   */
  updateChainId(chainId: number): void {
    const session = this.getSession()
    if (session) {
      session.chainId = chainId
      session.lastActivity = Date.now()
      this.saveSession(session)
    }
  }

  /**
   * Check if session is valid
   */
  isValid(): boolean {
    const session = this.getSession()
    return session !== null
  }

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    const session = this.getSession()
    if (!session) return true
    return Date.now() > session.expiresAt
  }

  /**
   * Get time until expiration
   */
  getTimeUntilExpiration(): number {
    const session = this.getSession()
    if (!session) return 0
    return Math.max(0, session.expiresAt - Date.now())
  }

  /**
   * Clear session
   */
  clearSession(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  /**
   * Save session to localStorage
   */
  private saveSession(session: WalletSession): void {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  /**
   * Auto-reconnect if session exists
   */
  shouldAutoReconnect(): boolean {
    return this.isValid() && !this.isExpired()
  }
}

// Singleton instance
export const walletSession = new WalletSessionManager()
