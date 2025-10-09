import { Router } from 'express';
import { requireAuthWithUserId } from '../../middleware/auth';
import walletRouter from './wallet/getBalance';
import withdrawRouter from './wallet/withdraw';
import transactionsRouter from './wallet/transactions';
import productRouter from './product/product';
import uniqueNameRouter from './user/uniqueName';

export const protectedRouter = Router();

// Apply authentication middleware globally to ALL protected routes
protectedRouter.use(requireAuthWithUserId);

// Wallet endpoints
protectedRouter.use('/wallet', walletRouter);
protectedRouter.use('/wallet', withdrawRouter);
protectedRouter.use('/wallet', transactionsRouter);

// Product endpoints
protectedRouter.use('/product', productRouter);

// User endpoints
protectedRouter.use('/unique-name', uniqueNameRouter);

export default protectedRouter;
