import { Router } from 'express';
import { TokenMetadataController } from '../../controllers/token/tokenMetadataController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

// All token routes require authentication
router.use(requireAuthWithUserId);

// Get token metadata
router.get('/:chain/:address/metadata', TokenMetadataController.getTokenMetadata);

// Get token price
router.get('/:chain/:address/price', TokenMetadataController.getTokenPrice);

// Get popular tokens
router.get('/:chain/popular', TokenMetadataController.getPopularTokens);

// Search tokens
router.get('/search', TokenMetadataController.searchTokens);

export default router;

