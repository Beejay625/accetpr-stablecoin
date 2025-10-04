import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { HttpError } from '../utils/httpError';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new HttpError(400, 'Validation failed', result.error.flatten()));
    }
    // assign parsed data back for type safety consumers
    (req as any)[source] = result.data;
    next();
  };
}
