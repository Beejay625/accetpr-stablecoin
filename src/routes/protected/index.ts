import { Router } from 'express';
import testAuthRouter from './test/test-auth';

export const protectedRouter = Router();

// All protected routes require authentication
// Add your protected endpoints here

// Test authentication endpoint
protectedRouter.use('/', testAuthRouter);

export default protectedRouter;
