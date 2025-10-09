import { Router } from 'express';
import balanceRouter from './getBalance';
import withdrawRouter from './withdraw';
import transactionsRouter from './transactions';

const router = Router();

// Mount all wallet routes
router.use('/', balanceRouter);      // GET /balance
router.use('/', withdrawRouter);     // POST /withdraw/single, POST /withdraw/batch
router.use('/', transactionsRouter); // GET /transactions/:chain

export default router;

