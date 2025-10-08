import { Router } from 'express';
import walletRouter from './wallet/getBalance';
import withdrawRouter from './wallet/withdraw';
import transactionsRouter from './wallet/transactions';
import productRouter from './product/product';
import uniqueNameRouter from './user/uniqueName';

export const protectedRouter = Router();

// All protected routes require authentication
// Add your protected endpoints here

// Wallet endpoints
protectedRouter.use('/wallet', walletRouter);

// Withdraw endpoints
protectedRouter.use('/wallet', withdrawRouter);

// Transactions endpoints
protectedRouter.use('/wallet', transactionsRouter);

// Product endpoints
protectedRouter.use('/product', productRouter);

// User endpoints
protectedRouter.use('/unique-name', uniqueNameRouter);

export default protectedRouter;
