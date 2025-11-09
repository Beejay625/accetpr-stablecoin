import { Router } from 'express';
import { FeeCalculatorController } from '../../controllers/transaction/feeCalculatorController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

// All fee calculator routes require authentication
router.use(requireAuthWithUserId);

// Calculate fee
router.post('/calculate/:chain', FeeCalculatorController.calculateFee);

// Compare fee estimates
router.post('/compare/:chain', FeeCalculatorController.compareFeeEstimates);

export default router;

