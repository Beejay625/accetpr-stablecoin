/**
 * 404 Not Found middleware
 * 
 * This middleware catches all requests that don't match any routes.
 * It should be placed AFTER all route definitions but BEFORE the error handler.
 */

import { Request, Response } from 'express';

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      requestId: req.id,
      path: req.path,
    },
  });
}

