import { Router } from 'express';
import { AddressWhitelistController } from '../../controllers/security/addressWhitelistController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

// Whitelist addresses
router.post('/addresses', AddressWhitelistController.addToWhitelist);
router.get('/addresses', AddressWhitelistController.getWhitelistedAddresses);
router.get('/addresses/check', AddressWhitelistController.checkWhitelist);
router.delete('/addresses/:id', AddressWhitelistController.removeFromWhitelist);

// Whitelist configuration
router.put('/config', AddressWhitelistController.configureWhitelist);
router.get('/config', AddressWhitelistController.getWhitelistConfig);

export default router;

