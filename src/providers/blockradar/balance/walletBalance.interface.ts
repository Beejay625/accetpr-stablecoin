/**
 * BlockRadar Balance API Response Types
 */

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
  tokenStandard: string | null;
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
  standard: string | null;
  symbol: string;
  updatedAt: string;
}

export interface AssetData {
  asset: AssetInfo;
  createdAt: string;
  id: string;
  isActive: boolean;
  updatedAt: string;
}

export interface BalanceData {
  asset: AssetData;
  balance: string;
  convertedBalance: string;
}

export interface WalletBalanceResponse {
  data: BalanceData;
  message: string;
  statusCode: number;
}
