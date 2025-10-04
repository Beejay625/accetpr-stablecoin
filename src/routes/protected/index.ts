import { Router } from 'express';
import testAuthRouter from './test/test-auth';

const router = Router();

// All protected routes require authentication
// Add your protected endpoints here

// Test authentication endpoint
router.use('/', testAuthRouter);

export default router;
