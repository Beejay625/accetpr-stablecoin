import { Router } from 'express';
import { ApiKeyController } from '../../controllers/auth/apiKeyController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

router.post('/', ApiKeyController.createApiKey);
router.get('/', ApiKeyController.getApiKeys);
router.get('/:id', ApiKeyController.getApiKey);
router.put('/:id', ApiKeyController.updateApiKey);
router.delete('/:id', ApiKeyController.deleteApiKey);

export default router;

