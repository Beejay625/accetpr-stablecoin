/**
 * BlockRadar API Response Types
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
  tokenStandard: string;
  updatedAt: string;
}

export interface AddressConfigurations {
  aml: {
    message: string;
    provider: string;
    status: string;
  };
  disableAutoSweep: boolean;
  enableGaslessWithdraw: boolean;
  showPrivateKey: boolean;
}

export interface AddressData {
  address: string;
  blockchain: BlockchainInfo;
  configurations: AddressConfigurations;
  createdAt: string;
  derivationPath: string;
  id: string;
  isActive: boolean;
  metadata: {
    user_id: number;
  };
  name: string;
  network: string;
  type: string;
  updatedAt: string;
}

export interface GenerateWalletResponse {
  data: AddressData;
  message: string;
  statusCode: number;
}