import { clerkClient, clerkMiddleware, requireAuth, getAuth } from '@clerk/express';

// Core Clerk middleware - handles token verification and attaches auth to request
export const clerkMiddlewareHandler = clerkMiddleware();

// Export Clerk utilities for use in routes
export { clerkClient, requireAuth, getAuth };