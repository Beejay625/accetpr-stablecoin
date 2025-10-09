import { Router } from 'express';
import createRouter from './createProduct';
import listRouter from './listProducts';
import updateRouter from './updateProduct';
import statsRouter from './stats';

const router = Router();

// Mount all product routes
router.use('/', createRouter);  // POST /
router.use('/', listRouter);    // GET /
router.use('/', updateRouter);  // PUT /:productId
router.use('/', statsRouter);   // GET /:productId/payment-counts, GET /:productId/payment-amounts, GET /stats

export default router;

