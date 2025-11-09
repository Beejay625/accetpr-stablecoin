import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      isAuthenticated?: boolean;
      localUserId?: string;
    }
  }
}