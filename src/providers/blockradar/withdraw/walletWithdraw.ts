import { BlockRadarBase } from '../base';

/**
 * Withdraw assets from wallet address
 */
export async function withdrawFromAddress(walletId: string, addressId: string, withdrawRequest: any): Promise<any> {
  return await BlockRadarBase.request(`/wallets/${walletId}/addresses/${addressId}/withdraw`, 'POST', withdrawRequest);
}