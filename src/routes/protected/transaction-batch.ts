import { Router } from 'express';
import { TransactionBatchController } from '../../controllers/transaction/transactionBatchController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

// Batch transaction endpoints
router.post('/', TransactionBatchController.createBatch);
router.get('/', TransactionBatchController.getUserBatches);
router.get('/:batchId', TransactionBatchController.getBatch);
router.post('/:batchId/execute', TransactionBatchController.executeBatch);
router.post('/:batchId/cancel', TransactionBatchController.cancelBatch);

export default router;

