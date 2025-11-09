import { Router } from 'express';
import { TransactionSchedulingController } from '../../controllers/transaction/transactionSchedulingController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

// Transaction scheduling endpoints
router.post('/', TransactionSchedulingController.scheduleTransaction);
router.get('/', TransactionSchedulingController.getUserScheduledTransactions);
router.get('/:scheduledId', TransactionSchedulingController.getScheduledTransaction);
router.post('/:scheduledId/cancel', TransactionSchedulingController.cancelScheduledTransaction);

export default router;

