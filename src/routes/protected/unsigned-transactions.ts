import { Router } from 'express';
import { TransactionSigningController } from '../../controllers/transaction/transactionSigningController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

router.post('/', TransactionSigningController.createUnsignedTransaction);
router.get('/', TransactionSigningController.getUnsignedTransactions);
router.get('/:id', TransactionSigningController.getUnsignedTransaction);
router.get('/:id/sign', TransactionSigningController.getTransactionForSigning);
router.post('/:id/signed', TransactionSigningController.markAsSigned);
router.post('/:id/broadcast', TransactionSigningController.markAsBroadcast);
router.post('/:id/cancel', TransactionSigningController.cancelTransaction);

export default router;

