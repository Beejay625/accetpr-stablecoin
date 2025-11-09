/**
 * Token Approval Management
 * Manage ERC20 token approvals for DEX and DeFi protocols
 */

import { type Address } from 'viem'
import { parseUnits, formatUnits, maxUint256 } from 'viem'

export interface TokenApproval {
  tokenAddress: Address
  tokenSymbol: string
  spender: Address
  spenderName?: string
  amount: bigint
  isUnlimited: boolean
  chainId: number
  approvedAt: number
  txHash?: string
}

export interface ApprovalRequest {
  tokenAddress: Address
  spender: Address
  amount: bigint
  isUnlimited: boolean
}

class TokenApprovalManager {
  private approvals: Map<string, TokenApproval> = new Map()
  private storageKey = 'token_approvals'

  constructor() {
    this.loadApprovals()
  }

  /**
   * Record token approval
   */
  recordApproval(approval: TokenApproval): void {
    const key = this.getApprovalKey(
      approval.tokenAddress,
      approval.spender,
      approval.chainId
    )
    this.approvals.set(key, approval)
    this.saveApprovals()
  }

  /**
   * Get approval for token and spender
   */
  getApproval(
    tokenAddress: Address,
    spender: Address,
    chainId: number
  ): TokenApproval | undefined {
    const key = this.getApprovalKey(tokenAddress, spender, chainId)
    return this.approvals.get(key)
  }

  /**
   * Get all approvals for a token
   */
  getTokenApprovals(tokenAddress: Address, chainId: number): TokenApproval[] {
    return Array.from(this.approvals.values()).filter(
      approval =>
        approval.tokenAddress.toLowerCase() === tokenAddress.toLowerCase() &&
        approval.chainId === chainId
    )
  }

  /**
   * Get all approvals
   */
  getAllApprovals(): TokenApproval[] {
    return Array.from(this.approvals.values())
  }

  /**
   * Check if approval exists and is sufficient
   */
  hasSufficientApproval(
    tokenAddress: Address,
    spender: Address,
    requiredAmount: bigint,
    chainId: number
  ): boolean {
    const approval = this.getApproval(tokenAddress, spender, chainId)
    if (!approval) return false

    if (approval.isUnlimited) return true
    return approval.amount >= requiredAmount
  }

  /**
   * Revoke approval (set to 0)
   */
  revokeApproval(
    tokenAddress: Address,
    spender: Address,
    chainId: number
  ): void {
    const key = this.getApprovalKey(tokenAddress, spender, chainId)
    this.approvals.delete(key)
    this.saveApprovals()
  }

  /**
   * Get approval key
   */
  private getApprovalKey(
    tokenAddress: Address,
    spender: Address,
    chainId: number
  ): string {
    return `${chainId}_${tokenAddress.toLowerCase()}_${spender.toLowerCase()}`
  }

  /**
   * Format approval amount
   */
  formatApprovalAmount(approval: TokenApproval): string {
    if (approval.isUnlimited) {
      return 'Unlimited'
    }
    return formatUnits(approval.amount, 18) // Assuming 18 decimals
  }

  /**
   * Get common DeFi spenders
   */
  getCommonSpenders(chainId: number): Array<{ address: Address; name: string }> {
    const spenders: Record<number, Array<{ address: Address; name: string }>> = {
      1: [ // Ethereum
        { address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', name: 'Uniswap V2 Router' },
        { address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', name: 'Uniswap V3 Router' },
        { address: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', name: 'SushiSwap Router' },
      ],
      8453: [ // Base
        { address: '0x2626664c2603336E57B271c5C0b26F421741e481', name: 'Uniswap V3 Router' },
      ],
    }

    return spenders[chainId] || []
  }

  /**
   * Calculate required approval amount
   */
  calculateRequiredApproval(
    currentApproval: bigint | undefined,
    requiredAmount: bigint
  ): bigint {
    if (!currentApproval) return requiredAmount
    if (currentApproval >= requiredAmount) return 0n
    return requiredAmount - currentApproval
  }

  /**
   * Check if unlimited approval is safe
   */
  isUnlimitedApprovalSafe(spender: Address): boolean {
    // In production, check against known safe contracts
    // For now, return false to be conservative
    return false
  }

  /**
   * Save approvals to localStorage
   */
  private saveApprovals(): void {
    if (typeof window === 'undefined') return
    try {
      const data = Array.from(this.approvals.entries())
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save approvals:', error)
    }
  }

  /**
   * Load approvals from localStorage
   */
  private loadApprovals(): void {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data: [string, TokenApproval][] = JSON.parse(stored)
        this.approvals = new Map(data)
      }
    } catch (error) {
      console.error('Failed to load approvals:', error)
    }
  }
}

// Singleton instance
export const tokenApprovalManager = new TokenApprovalManager()

