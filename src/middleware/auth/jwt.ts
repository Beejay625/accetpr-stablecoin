import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/httpError';

export interface AuthPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return next(new HttpError(401, 'Missing bearer token'));
  const token = auth.slice('Bearer '.length);
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return next(new HttpError(500, 'JWT secret not configured'));
    const payload = jwt.verify(token, secret) as AuthPayload;
    // @ts-expect-error attach for downstream
    req.user = payload;
    next();
  } catch (err) {
    next(new HttpError(401, 'Invalid token'));
  }
}
