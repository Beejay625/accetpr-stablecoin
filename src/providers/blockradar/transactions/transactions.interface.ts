/**
 * BlockRadar Transactions API Types
 * Based on the official BlockRadar API documentation
 */

export interface AddressInfo {
  address: string;
  configurations: {
    aml: {
      message: string;
      provider: string;
      status: string;
    };
    disableAutoSweep: boolean;
    enableGaslessWithdraw: boolean;
    isActive: boolean;
    showPrivateKey: boolean;
  };
  createdAt: string;
  derivationPath: string;
  id: string;
  isActive: boolean;
  metadata: any;
  name: string | null;
  network: string;
  type: string;
  updatedAt: string;
}

export interface AssetInfo {
  address: string;
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

export interface AmlScreening {
  message: string;
  provider: string;
  status: string;
}

export interface Transaction {
  address: AddressInfo;
  amlScreening: AmlScreening;
  amount: string;
  amountPaid: string;
  asset: AssetInfo;
  assetSwept: boolean;
  assetSweptAmount: string | null;
  assetSweptAt: string | null;
  assetSweptGasFee: string | null;
  assetSweptHash: string | null;
  assetSweptRecipientAddress: string | null;
  assetSweptSenderAddress: string | null;
  blockHash: string | null;
  blockNumber: number | null;
  blockchain: BlockchainInfo;
  chainId: number | null;
  confirmations: number | null;
  confirmed: boolean;
  createdAt: string;
  currency: string;
  fee: any;
  gasFee: string | null;
  gasPrice: string | null;
  gasUsed: string | null;
  hash: string;
  id: string;
  metadata: any;
  network: string;
  note: string | null;
  reason: string | null;
  recipientAddress: string;
  reference: string | null;
  senderAddress: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  type: 'DEPOSIT' | 'WITHDRAW';
  updatedAt: string;
}

export interface TransactionsMeta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface TransactionsResponse {
  data: Transaction[];
  message: string;
  meta: TransactionsMeta;
  statusCode: number;
}

export interface TransactionsError {
  message: string;
  statusCode: number;
  error?: string;
}

// Simplified transaction response for our API
export interface SimplifiedTransaction {
  transactionId: string;
  hash: string;
  asset: string;
  chain: string;
  reference: string | null;
  amountPaid: string;
  status: string;
  transactionTime: string;
}