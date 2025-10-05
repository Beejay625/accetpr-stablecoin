/**
 * BlockRadar Assets API Types
 * Based on the official BlockRadar API documentation
 */

export interface BlockRadarAsset {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  address: string;
  standard: string | null;
  currency: string;
  isActive: boolean;
  logoUrl: string;
  network: string;
  isNative: boolean;
  createdAt: string;
  updatedAt: string;
  blockchain: {
    id: string;
    name: string;
    symbol: string;
    slug: string;
    derivationPath: string;
    isEvmCompatible: boolean;
    isL2: boolean;
    logoUrl: string;
    isActive: boolean;
    tokenStandard: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface Asset {
  assetId: string;
  chain: string;
  asset: string;
}

export interface AssetsResponse {
  success: boolean;
  message: string;
  data: Asset[];
  timestamp: string;
}
