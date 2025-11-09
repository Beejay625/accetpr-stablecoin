/**
 * BlockRadar Withdraw API Types
 * Based on the official BlockRadar API documentation
 */

export interface WithdrawAsset {
  address: string;
  amount: string;
  chain: string;
  asset: string;
  metadata?: {
    id: string;
    [key: string]: any;
  };
  reference?: string;
}

// Single withdrawal request (top-level fields)
export interface SingleWithdrawRequest {
  chain: string;
  asset: string;
  amount: string;
  address: string;
  metadata?: {
    id: string;
    [key: string]: any;
  };
  reference?: string;
}

// Batch withdrawal request (array of assets)
export interface BatchWithdrawRequest {
  assets: WithdrawAsset[];
}

// Union type for both withdrawal patterns
export type WithdrawRequest = SingleWithdrawRequest | BatchWithdrawRequest;

export interface BlockchainInfo {
  createdAt: string;
  derivationPath: string;
  id: string;
  isActive: boolean;
  isEvmCompatible: boolean;
  logoUrl: string;
  name: string;
  slug: string;
  symbol: string;
  tokenStandard: string;
  updatedAt: string;
}

export interface AssetInfo {
  address: string;
  blockchain: BlockchainInfo;
  createdAt: string;
  decimals: number;
  id: string;
  isActive: boolean;
  logoUrl: string;
  name: string;
  network: string;
  standard: string;
  symbol: string;
  updatedAt: string;
}

export interface WalletInfo {
  id: string;
}

export interface WithdrawTransaction {
  amlScreening: any;
  amount: string;
  amountPaid: string;
  asset: AssetInfo;
  assetSwept: any;
  assetSweptAmount: any;
  assetSweptAt: any;
  assetSweptGasFee: any;
  assetSweptHash: any;
  assetSweptRecipientAddress: any;
  assetSweptResponse: any;
  assetSweptSenderAddress: any;
  blockHash: string | null;
  blockNumber: number | null;
  blockchain: BlockchainInfo;
  chainId: string | null;
  confirmations: number | null;
  confirmed: boolean;
  createdAt: string;
  currency: string;
  fee: any;
  feeMetadata: any;
  gasFee: any;
  gasPrice: any;
  gasUsed: any;
  hash: string;
  id: string;
  metadata: any;
  network: string;
  note: string | null;
  reason: string | null;
  recipientAddress: string;
  senderAddress: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
  tokenAddress: string | null;
  type: 'WITHDRAW';
  updatedAt: string;
  wallet: WalletInfo;
}

export interface WithdrawResponse {
  data: WithdrawTransaction;
  message: string;
  statusCode: number;
}

export interface WithdrawError {
  message: string;
  statusCode: number;
  error?: string;
}