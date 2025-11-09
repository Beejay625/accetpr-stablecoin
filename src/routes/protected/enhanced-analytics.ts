import { Router } from 'express';
import { EnhancedAnalyticsController } from '../../controllers/transaction/enhancedAnalyticsController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

// Enhanced analytics endpoints
router.get('/', EnhancedAnalyticsController.getAnalytics);

export default router;

