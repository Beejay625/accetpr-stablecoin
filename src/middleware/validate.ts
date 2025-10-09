/**
 * Zod validation middleware
 * 
 * Validates request data (body, query, or params) against a Zod schema.
 * Throws AppError if validation fails.
 * 
 * Usage:
 *   router.post('/', validate(createUserSchema, 'body'), handler);
 *   router.get('/:id', validate(idParamSchema, 'params'), handler);
 */

import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { Err } from '../errors/factory';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(Err.validation('Validation failed', result.error.flatten()));
    }
    // Assign parsed data back for type safety
    (req as any)[source] = result.data;
    next();
  };
}
