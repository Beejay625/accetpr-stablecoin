import { Router } from 'express';
import earningsRouter from './earnings';
import heatmapRouter from './heatmap';
import transactionsRouter from './transactions';

const router = Router();

// Payment endpoints
router.use('/', earningsRouter);
router.use('/', heatmapRouter);
router.use('/', transactionsRouter);

export default router;

