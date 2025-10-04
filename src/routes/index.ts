import { Router } from 'express';
import publicRouter from './public';
import protectedRouter from './protected';

export const router = Router();

router.use('/public', publicRouter);
router.use('/protected', protectedRouter);
