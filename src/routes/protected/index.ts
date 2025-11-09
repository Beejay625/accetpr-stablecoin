import { Router } from 'express';
import testAuthRouter from './test/test-auth';
import walletRouter from './wallet/getBalance';
import withdrawRouter from './wallet/withdraw';
import transactionsRouter from './wallet/transactions';
import statisticsRouter from './wallet/statistics';
import addressesRouter from './wallet/addresses';
import transactionDetailsRouter from './wallet/transactionDetails';

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

// Transaction details and search endpoints
protectedRouter.use('/wallet', transactionDetailsRouter);

// Statistics endpoints
protectedRouter.use('/wallet', statisticsRouter);

// Addresses endpoints
protectedRouter.use('/wallet', addressesRouter);

export default protectedRouter;
