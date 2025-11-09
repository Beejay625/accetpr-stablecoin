import { Router } from 'express';
import { GasPriceOracleController } from '../../controllers/gas/gasPriceOracleController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

// Get gas prices
router.get('/prices/:chain', GasPriceOracleController.getGasPrices);

// Get gas price history
router.get('/prices/:chain/history', GasPriceOracleController.getGasPriceHistory);

// Gas price alerts
router.post('/alerts', GasPriceOracleController.createAlert);
router.get('/alerts', GasPriceOracleController.getUserAlerts);
router.delete('/alerts/:id', GasPriceOracleController.deleteAlert);

export default router;

