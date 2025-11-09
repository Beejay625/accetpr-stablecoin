import { Router } from 'express';
import { WebhookController } from '../../controllers/webhook/webhookController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

// All webhook routes require authentication
router.use(requireAuthWithUserId);

// Create webhook
router.post('/', WebhookController.createWebhook);

// Get all webhooks
router.get('/', WebhookController.getWebhooks);

// Get specific webhook
router.get('/:id', WebhookController.getWebhook);

// Update webhook
router.put('/:id', WebhookController.updateWebhook);

// Delete webhook
router.delete('/:id', WebhookController.deleteWebhook);

// Test webhook
router.post('/:id/test', WebhookController.testWebhook);

export default router;

