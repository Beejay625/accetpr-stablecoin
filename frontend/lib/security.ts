/**
 * Security Features
 * Transaction limits, 2FA, and security policies
 */

import { type Address } from 'viem'
import { parseUnits } from 'viem'

export interface SecurityPolicy {
  dailyLimit: bigint
  transactionLimit: bigint
  requireApproval: boolean
  whitelistOnly: boolean
  twoFactorEnabled: boolean
  cooldownPeriod: number // milliseconds
}

export interface TransactionLimit {
  address: Address
  dailySpent: bigint
  dailyLimit: bigint
  lastReset: number
  transactionCount: number
}

export interface SecurityEvent {
  type: 'limit_exceeded' | 'suspicious_activity' | 'whitelist_violation' | 'approval_required'
  address: Address
  amount: bigint
  timestamp: number
  blocked: boolean
}

class SecurityManager {
  private policies: Map<Address, SecurityPolicy> = new Map()
  private limits: Map<Address, TransactionLimit> = new Map()
  private events: SecurityEvent[] = []
  private defaultPolicy: SecurityPolicy = {
    dailyLimit: parseUnits('10000', 18), // 10,000 tokens
    transactionLimit: parseUnits('1000', 18), // 1,000 tokens per transaction
    requireApproval: false,
    whitelistOnly: false,
    twoFactorEnabled: false,
    cooldownPeriod: 0,
  }

  /**
   * Set security policy for an address
   */
  setPolicy(address: Address, policy: Partial<SecurityPolicy>): void {
    const existing = this.policies.get(address) || this.defaultPolicy
    this.policies.set(address, { ...existing, ...policy })
  }

  /**
   * Get security policy
   */
  getPolicy(address: Address): SecurityPolicy {
    return this.policies.get(address) || this.defaultPolicy
  }

  /**
   * Check if transaction is allowed
   */
  checkTransaction(
    from: Address,
    to: Address,
    amount: bigint,
    isWhitelisted: boolean
  ): { allowed: boolean; reason?: string; requiresApproval: boolean } {
    const policy = this.getPolicy(from)

    // Check whitelist
    if (policy.whitelistOnly && !isWhitelisted) {
      this.recordEvent({
        type: 'whitelist_violation',
        address: from,
        amount,
        timestamp: Date.now(),
        blocked: true,
      })
      return {
        allowed: false,
        reason: 'Recipient address is not whitelisted',
        requiresApproval: false,
      }
    }

    // Check transaction limit
    if (amount > policy.transactionLimit) {
      this.recordEvent({
        type: 'limit_exceeded',
        address: from,
        amount,
        timestamp: Date.now(),
        blocked: true,
      })
      return {
        allowed: false,
        reason: `Transaction amount exceeds limit of ${policy.transactionLimit}`,
        requiresApproval: policy.requireApproval,
      }
    }

    // Check daily limit
    const limit = this.getLimit(from)
    if (limit.dailySpent + amount > policy.dailyLimit) {
      this.recordEvent({
        type: 'limit_exceeded',
        address: from,
        amount,
        timestamp: Date.now(),
        blocked: true,
      })
      return {
        allowed: false,
        reason: `Daily limit exceeded. Remaining: ${policy.dailyLimit - limit.dailySpent}`,
        requiresApproval: policy.requireApproval,
      }
    }

    // Check if approval required
    if (policy.requireApproval) {
      return {
        allowed: true,
        requiresApproval: true,
      }
    }

    return {
      allowed: true,
      requiresApproval: false,
    }
  }

  /**
   * Record transaction for limit tracking
   */
  recordTransaction(address: Address, amount: bigint): void {
    const limit = this.getLimit(address)
    const now = Date.now()

    // Reset daily limit if needed
    if (now - limit.lastReset > 24 * 60 * 60 * 1000) {
      limit.dailySpent = 0n
      limit.lastReset = now
      limit.transactionCount = 0
    }

    limit.dailySpent += amount
    limit.transactionCount++
    this.limits.set(address, limit)
  }

  /**
   * Get transaction limit for address
   */
  getLimit(address: Address): TransactionLimit {
    const existing = this.limits.get(address)
    if (existing) {
      // Reset if new day
      const now = Date.now()
      if (now - existing.lastReset > 24 * 60 * 60 * 1000) {
        return {
          address,
          dailySpent: 0n,
          dailyLimit: this.getPolicy(address).dailyLimit,
          lastReset: now,
          transactionCount: 0,
        }
      }
      return existing
    }

    return {
      address,
      dailySpent: 0n,
      dailyLimit: this.getPolicy(address).dailyLimit,
      lastReset: Date.now(),
      transactionCount: 0,
    }
  }

  /**
   * Record security event
   */
  private recordEvent(event: SecurityEvent): void {
    this.events.push(event)
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }
  }

  /**
   * Get security events
   */
  getEvents(address?: Address): SecurityEvent[] {
    if (address) {
      return this.events.filter(event => event.address === address)
    }
    return [...this.events]
  }

  /**
   * Reset daily limit for address
   */
  resetLimit(address: Address): void {
    const limit = this.getLimit(address)
    limit.dailySpent = 0n
    limit.transactionCount = 0
    limit.lastReset = Date.now()
    this.limits.set(address, limit)
  }

  /**
   * Enable 2FA for address
   */
  enable2FA(address: Address): void {
    const policy = this.getPolicy(address)
    policy.twoFactorEnabled = true
    this.policies.set(address, policy)
  }

  /**
   * Disable 2FA for address
   */
  disable2FA(address: Address): void {
    const policy = this.getPolicy(address)
    policy.twoFactorEnabled = false
    this.policies.set(address, policy)
  }
}

// Singleton instance
export const securityManager = new SecurityManager()

