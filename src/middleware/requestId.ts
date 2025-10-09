/**
 * Request ID middleware
 * 
 * Generates a unique ID for each request and attaches it to the request object.
 * Also adds the ID to the response headers for tracing.
 * 
 * This is useful for:
 * - Correlating logs across multiple services
 * - Debugging specific requests
 * - Providing users with a reference ID for support
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};

