import { Router } from 'express';
import { requireAuthWithUserId } from '../../middleware/auth';
import walletRouter from './wallet';
import productRouter from './product';
import uniqueNameRouter from './user/uniqueName';

export const protectedRouter = Router();

// Apply authentication middleware globally to ALL protected routes
protectedRouter.use(requireAuthWithUserId);

// Wallet endpoints
protectedRouter.use('/wallet', walletRouter);

// Product endpoints
protectedRouter.use('/product', productRouter);

// User endpoints
protectedRouter.use('/unique-name', uniqueNameRouter);

export default protectedRouter;
