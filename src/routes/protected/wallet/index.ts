import { Router } from 'express';
import balanceRouter from './balance';
import withdrawSingleRouter from './withdrawSingle';
import withdrawBatchRouter from './withdrawBatch';
import transactionsRouter from './transactions';

const router = Router();

// Mount all wallet routes
router.use('/', balanceRouter);          // GET /balance
router.use('/', withdrawSingleRouter);   // POST /withdraw/single
router.use('/', withdrawBatchRouter);    // POST /withdraw/batch
router.use('/', transactionsRouter);     // GET /transactions/:chain

export default router;

