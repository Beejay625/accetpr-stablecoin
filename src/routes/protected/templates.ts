import { Router } from 'express';
import { TransactionTemplatesController } from '../../controllers/transaction/transactionTemplatesController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

router.post('/', TransactionTemplatesController.createTemplate);
router.get('/', TransactionTemplatesController.getTemplates);
router.get('/:id', TransactionTemplatesController.getTemplate);
router.put('/:id', TransactionTemplatesController.updateTemplate);
router.delete('/:id', TransactionTemplatesController.deleteTemplate);

export default router;

