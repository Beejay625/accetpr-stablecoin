import { Router } from 'express';
import { TransactionReplayController } from '../../controllers/transaction/replayController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

// All transaction replay routes require authentication
router.use(requireAuthWithUserId);

// Replay transaction
router.post('/:id/replay', TransactionReplayController.replayTransaction);

// Get replay history
router.get('/:id/replay-history', TransactionReplayController.getReplayHistory);

// Check if can replay
router.get('/:id/can-replay', TransactionReplayController.canReplay);

export default router;

