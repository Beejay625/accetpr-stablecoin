/**
 * Multi-Signature Wallet Support
 * Handles multi-sig wallet operations and approvals
 */

import { type Address } from 'viem'

export interface MultisigWallet {
  address: Address
  threshold: number
  owners: Address[]
  name?: string
}

export interface MultisigTransaction {
  id: string
  multisigAddress: Address
  to: Address
  value: bigint
  data: `0x${string}`
  nonce: number
  approvals: Address[]
  executed: boolean
  timestamp: number
}

export interface MultisigProposal {
  transaction: MultisigTransaction
  proposer: Address
  description?: string
  expiresAt?: number
}

class MultisigManager {
  private wallets: Map<Address, MultisigWallet> = new Map()
  private proposals: Map<string, MultisigProposal> = new Map()
  private transactions: Map<string, MultisigTransaction> = new Map()

  /**
   * Register a multi-sig wallet
   */
  registerWallet(wallet: MultisigWallet): void {
    this.wallets.set(wallet.address, wallet)
  }

  /**
   * Get wallet by address
   */
  getWallet(address: Address): MultisigWallet | undefined {
    return this.wallets.get(address)
  }

  /**
   * Create a transaction proposal
   */
  createProposal(
    multisigAddress: Address,
    to: Address,
    value: bigint,
    data: `0x${string}`,
    proposer: Address,
    description?: string
  ): MultisigProposal {
    const wallet = this.getWallet(multisigAddress)
    if (!wallet) {
      throw new Error('Multisig wallet not found')
    }

    const transaction: MultisigTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      multisigAddress,
      to,
      value,
      data,
      nonce: this.getNextNonce(multisigAddress),
      approvals: [proposer],
      executed: false,
      timestamp: Date.now(),
    }

    const proposal: MultisigProposal = {
      transaction,
      proposer,
      description,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    }

    this.transactions.set(transaction.id, transaction)
    this.proposals.set(transaction.id, proposal)

    return proposal
  }

  /**
   * Approve a transaction
   */
  approveTransaction(transactionId: string, approver: Address): boolean {
    const transaction = this.transactions.get(transactionId)
    if (!transaction) {
      return false
    }

    const wallet = this.getWallet(transaction.multisigAddress)
    if (!wallet) {
      return false
    }

    // Check if approver is an owner
    if (!wallet.owners.includes(approver)) {
      return false
    }

    // Check if already approved
    if (transaction.approvals.includes(approver)) {
      return false
    }

    // Add approval
    transaction.approvals.push(approver)

    // Check if threshold is met
    if (transaction.approvals.length >= wallet.threshold) {
      transaction.executed = true
    }

    return true
  }

  /**
   * Get pending proposals for a wallet
   */
  getPendingProposals(multisigAddress: Address): MultisigProposal[] {
    return Array.from(this.proposals.values()).filter(
      proposal =>
        proposal.transaction.multisigAddress === multisigAddress &&
        !proposal.transaction.executed &&
        (!proposal.expiresAt || proposal.expiresAt > Date.now())
    )
  }

  /**
   * Get transaction by ID
   */
  getTransaction(transactionId: string): MultisigTransaction | undefined {
    return this.transactions.get(transactionId)
  }

  /**
   * Get next nonce for a wallet
   */
  private getNextNonce(multisigAddress: Address): number {
    const transactions = Array.from(this.transactions.values()).filter(
      tx => tx.multisigAddress === multisigAddress
    )
    return transactions.length
  }

  /**
   * Check if transaction can be executed
   */
  canExecute(transactionId: string): boolean {
    const transaction = this.transactions.get(transactionId)
    if (!transaction) return false

    const wallet = this.getWallet(transaction.multisigAddress)
    if (!wallet) return false

    return (
      transaction.approvals.length >= wallet.threshold &&
      !transaction.executed
    )
  }
}

// Singleton instance
export const multisigManager = new MultisigManager()

