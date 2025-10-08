import { Router } from 'express';
import { healthRouter } from './health';
import { statusRouter } from './status';
import { paymentIntentRouter } from './paymentIntent';
import { webhookRouter } from './webhook';
import { logsRouter } from './logs';
import productRouter from './product';

export const publicRouter = Router();

publicRouter.use('/health', healthRouter);
publicRouter.use('/status', statusRouter);
publicRouter.use('/payment', paymentIntentRouter);
publicRouter.use('/webhook', webhookRouter);
publicRouter.use('/logs', logsRouter);
publicRouter.use('/', productRouter); // Product payment links (e.g., /p/:uniqueName/:slug)

export default publicRouter;

