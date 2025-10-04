/// <reference types="@clerk/express/env" />

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      isAuthenticated?: boolean;
    }
  }
}

// Global type export for authenticated requests after requireAuthWithUserId middleware
export {};
