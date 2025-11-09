import { Router } from 'express';
import testAuthRouter from './test/test-auth';
import walletRouter from './wallet/getBalance';
import withdrawRouter from './wallet/withdraw';
import transactionsRouter from './wallet/transactions';
import statisticsRouter from './wallet/statistics';
import addressesRouter from './wallet/addresses';
import searchRouter from './wallet/search';
import balanceRouter from './wallet/balance';
import activityRouter from './wallet/activity';

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

// Statistics endpoints
protectedRouter.use('/wallet', statisticsRouter);

// Addresses endpoints
protectedRouter.use('/wallet', addressesRouter);

// Search endpoints
protectedRouter.use('/wallet', searchRouter);

// Balance aggregation endpoints
protectedRouter.use('/wallet', balanceRouter);

// Activity timeline endpoints
protectedRouter.use('/wallet', activityRouter);

export default protectedRouter;
