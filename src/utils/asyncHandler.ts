/**
 * Async handler wrapper
 * 
 * Wraps async route handlers to automatically catch errors and pass them to next()
 * This eliminates the need for try/catch blocks in every controller
 * 
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation();
 *     res.json({ ok: true, data });
 *   }));
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

