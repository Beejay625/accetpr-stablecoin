import { Router } from 'express';
import { NotificationPreferencesController } from '../../controllers/notification/notificationPreferencesController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(requireAuthWithUserId);

// Get notification preferences
router.get('/preferences', NotificationPreferencesController.getPreferences);

// Update notification preferences
router.put('/preferences', NotificationPreferencesController.updatePreferences);

export default router;

