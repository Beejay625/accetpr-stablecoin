import { Router } from 'express';
import { TransactionMonitoringController } from '../../controllers/transaction/transactionMonitoringController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

// Start monitoring
router.post('/:id/monitor', TransactionMonitoringController.startMonitoring);

// Get monitored transaction
router.get('/:id/monitor', TransactionMonitoringController.getMonitoredTransaction);

// Stop monitoring
router.delete('/:id/monitor', TransactionMonitoringController.stopMonitoring);

// Get all monitored transactions
router.get('/monitor', TransactionMonitoringController.getMonitoredTransactions);

// Configure monitoring
router.put('/monitor/config', TransactionMonitoringController.configureMonitoring);
router.get('/monitor/config', TransactionMonitoringController.getMonitoringConfig);

export default router;

