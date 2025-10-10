import { Router } from 'express';
import { requireAuthWithUserId } from '../../middleware/auth';
import walletRouter from './wallet';
import productRouter from './product';
import uniqueNameRouter from './user/uniqueName';
import paymentRouter from './payment';
import { adminRouter } from '../../../admin/routes';

export const protectedRouter = Router();

// Apply authentication middleware globally to ALL protected routes
protectedRouter.use(requireAuthWithUserId);

// Wallet endpoints
protectedRouter.use('/wallet', walletRouter);

// Product endpoints
protectedRouter.use('/product', productRouter);

// User endpoints
protectedRouter.use('/unique-name', uniqueNameRouter);

// Payment endpoints
protectedRouter.use('/payment', paymentRouter);

// Admin endpoints (additional admin-only authorization applied within)
protectedRouter.use('/admin', adminRouter);

export default protectedRouter;
