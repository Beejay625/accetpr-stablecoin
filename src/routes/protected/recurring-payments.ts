import { Router } from 'express';
import { RecurringPaymentsController } from '../../controllers/payment/recurringPaymentsController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

router.post('/', RecurringPaymentsController.createRecurringPayment);
router.get('/', RecurringPaymentsController.getRecurringPayments);
router.get('/:id', RecurringPaymentsController.getRecurringPayment);
router.put('/:id', RecurringPaymentsController.updateRecurringPayment);
router.delete('/:id', RecurringPaymentsController.deleteRecurringPayment);

export default router;

