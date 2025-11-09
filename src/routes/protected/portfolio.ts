import { Router } from 'express';
import { PortfolioAnalyticsController } from '../../controllers/portfolio/portfolioAnalyticsController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

router.post('/snapshot', PortfolioAnalyticsController.createSnapshot);
router.get('/metrics', PortfolioAnalyticsController.getPortfolioMetrics);
router.get('/history', PortfolioAnalyticsController.getPortfolioHistory);

export default router;

