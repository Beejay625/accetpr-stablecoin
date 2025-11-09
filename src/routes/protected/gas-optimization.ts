import { Router } from 'express';
import { GasOptimizationController } from '../../controllers/transaction/gasOptimizationController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

// Gas optimization endpoints
router.post('/:chain/recommendation', GasOptimizationController.getRecommendation);
router.get('/:chain/strategies', GasOptimizationController.getAllStrategies);
router.post('/:chain/optimal', GasOptimizationController.getOptimalGasPrice);

export default router;

