/**
 * Wallet Service Interface Types
 */

export interface WalletAddress {
  address: string;
  walletId: string;
  name?: string;
  createdAt?: Date;
}

export interface WalletBalance {
  balance: number;
  currency: string;
  lastUpdated?: Date;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  fromAddress?: string;
  toAddress?: string;
  timestamp: Date;
  notes?: string;
}

export interface TransactionHistory {
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
}

export interface WithdrawalRequest {
  amount: number;
  destinationAddress: string;
  notes?: string;
}

export interface WithdrawalResponse {
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedCompletionTime?: Date;
}

export interface WalletSummary {
  walletId: string;
  balance: number;
  currency: string;
  recentTransactions: Transaction[];
  totalTransactions: number;
  lastActivity?: Date;
}

export interface GenerateAddressRequest {
  addressName: string;
  userId: string;
}

export interface GenerateAddressResponse {
  address: string;
  walletId: string;
  qrCode?: string; // Optional QR code for the address
}
