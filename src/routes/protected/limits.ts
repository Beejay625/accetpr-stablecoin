import { Router } from 'express';
import { TransactionLimitsController } from '../../controllers/security/transactionLimitsController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

// Transaction limits
router.put('/', TransactionLimitsController.setLimits);
router.get('/', TransactionLimitsController.getLimits);

// Check limit
router.post('/check', TransactionLimitsController.checkLimit);

// Usage statistics
router.get('/usage', TransactionLimitsController.getUsage);

export default router;

