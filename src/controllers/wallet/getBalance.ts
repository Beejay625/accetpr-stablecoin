import { Response } from 'express';
import { WalletService } from '../../services/wallet/walletService';
import { createLoggerWithFunction } from '../../logger';
import { sendSuccess } from '../../utils/successResponse';

/**
 * Wallet Controller
 * 
 * Handles all wallet-related HTTP requests including balance checking,
 * wallet generation, and transaction operations.
 */
const logger = createLoggerWithFunction('WalletController', { module: 'controller' });

export class WalletController {

  /**
   * Get wallet balance for authenticated user
   * GET /api/v1/protected/wallet/balance
   */
  static async getBalance(req: any, res: Response): Promise<void> {
    const clerkUserId = req.authUserId!;
    const chain = req.query.chain as string;
    
    logger.info('getBalance', { clerkUserId, chain }, 'Getting wallet balance');

    // Get wallet balances using WalletService (returns array of all assets)
    const balances = await WalletService.getWalletBalance(clerkUserId, chain);

    logger.info('getBalance', { 
      clerkUserId, 
      chain, 
      balanceCount: balances.length,
      balances: balances.map(b => ({ asset: b.asset, balance: b.convertedBalance }))
    }, 'Wallet balances retrieved successfully');

    // Return success response with all asset balances
    sendSuccess(res, 'Wallet balance retrieved successfully', {
      balances,
      chain,
      userId: clerkUserId,
      timestamp: new Date().toISOString()
    });
  }

}
