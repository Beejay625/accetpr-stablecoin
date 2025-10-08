import { BlockRadarBase } from '../base';
import { BlockRadarAsset, Asset } from './getAssets.interface';

export type { Asset } from './getAssets.interface';

/**
 * Get all available assets from BlockRadar API
 * 
 * @returns Promise<Asset[]> - Array of simplified asset objects
 * 
 * @example
 * ```typescript
 * const assets = await getAssets();
 * // Returns: [
 * //   { assetId: "d343cb9b-01ad-43a2-bfea-c4c9ae297195", chain: "polygon", asset: "BUSD" },
 * //   { assetId: "7a070953-694b-4ee9-b783-545a6ff66cd0", chain: "ethereum", asset: "BUSD" },
 * //   ...
 * // ]
 * ```
 */
export async function getAssets(): Promise<Asset[]> {
  try {
    // Assets endpoint doesn't require wallet ID
    const response = await BlockRadarBase.requestPublic('assets', 'GET');
    
    // Transform the response to our simplified format
    const assets: Asset[] = response.data.map((asset: BlockRadarAsset) => ({
      assetId: asset.id,
      chain: asset.blockchain.slug,
      asset: asset.symbol
    }));
    
    return assets;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(`Failed to get assets: ${error.response.data.message || error.message}`);
    }
    
    throw new Error(`Failed to get assets: ${error.message}`);
  }
}