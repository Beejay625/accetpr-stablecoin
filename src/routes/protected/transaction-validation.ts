import { Router } from 'express';
import { TransactionValidationController } from '../../controllers/transaction/transactionValidationController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

// Transaction validation endpoints
router.post('/', TransactionValidationController.validateTransaction);
router.post('/batch', TransactionValidationController.validateBatch);

export default router;

