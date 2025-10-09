import { Router } from 'express';
import createRouter from './create';
import listRouter from './list';
import updateRouter from './update';
import statsRouter from './stats';

const router = Router();

// Mount all product routes
router.use('/', createRouter);  // POST /
router.use('/', listRouter);    // GET /
router.use('/', updateRouter);  // PUT /:productId
router.use('/', statsRouter);   // GET /:productId/payment-counts, GET /:productId/payment-amounts, GET /stats

export default router;

