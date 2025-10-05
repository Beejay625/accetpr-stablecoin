import { Router } from 'express';
import testAuthRouter from './test/test-auth';
import walletRouter from './wallet/getBalance';
import withdrawRouter from './wallet/withdraw';
import transactionsRouter from './wallet/transactions';

export const protectedRouter = Router();

// All protected routes require authentication
// Add your protected endpoints here

// Test authentication endpoint
protectedRouter.use('/', testAuthRouter);

// Wallet endpoints
protectedRouter.use('/wallet', walletRouter);

// Withdraw endpoints
protectedRouter.use('/wallet', withdrawRouter);

// Transactions endpoints
protectedRouter.use('/wallet', transactionsRouter);

export default protectedRouter;
