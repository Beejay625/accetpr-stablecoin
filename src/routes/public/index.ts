import { Router } from 'express';
import { healthRouter } from './health/health';
import { statusRouter } from './status';
import { paymentIntentRouter } from './payment/paymentIntent';
import { webhookRouter } from './webhook';
import { logsRouter } from './logs';
import productRouter from './Product/product';
import configRouter from './config';

export const publicRouter = Router();

publicRouter.use('/health', healthRouter);
publicRouter.use('/status', statusRouter);
publicRouter.use('/', configRouter); // Configuration endpoints (chains, tokens)
publicRouter.use('/payment', paymentIntentRouter);
publicRouter.use('/webhook', webhookRouter);
publicRouter.use('/logs', logsRouter);
publicRouter.use('/', productRouter); // Product payment links (e.g., /p/:uniqueName/:slug)

export default publicRouter;

