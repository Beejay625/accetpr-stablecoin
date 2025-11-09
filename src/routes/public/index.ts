import { Router } from 'express';
import { healthRouter } from './health';
import { statusRouter } from './status';

export const publicRouter = Router();

publicRouter.use('/health', healthRouter);
publicRouter.use('/status', statusRouter);

export default publicRouter;

