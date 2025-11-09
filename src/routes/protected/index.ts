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
import webhooksRouter from './webhooks';
import transactionsReplayRouter from './transactions-replay';
import tokensRouter from './tokens';
import notificationsRouter from './notifications';
import feesRouter from './fees';
import transactionNotesRouter from './transaction-notes';
import transactionMonitoringRouter from './transaction-monitoring';
import gasRouter from './gas';
import whitelistRouter from './whitelist';
import limitsRouter from './limits';

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

// Webhook management endpoints
protectedRouter.use('/webhooks', webhooksRouter);

// Transaction replay endpoints
protectedRouter.use('/transactions', transactionsReplayRouter);

// Token metadata endpoints
protectedRouter.use('/tokens', tokensRouter);

// Notification preferences endpoints
protectedRouter.use('/notifications', notificationsRouter);

// Fee calculator endpoints
protectedRouter.use('/fees', feesRouter);

export default protectedRouter;
