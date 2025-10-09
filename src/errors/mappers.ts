/**
 * Error mappers for external libraries
 * 
 * These functions convert library-specific errors into AppError instances.
 * This keeps error handling consistent across the application.
 */

import { Prisma } from '@prisma/client';
import { AppError } from './AppError';
import { Err } from './factory';

/**
 * Map Prisma errors to AppError
 * 
 * Common Prisma error codes:
 * - P2002: Unique constraint violation
 * - P2025: Record not found
 * - P2003: Foreign key constraint violation
 */
export function mapPrismaError(error: any): never {
  // Unique constraint violation
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const fields = error.meta?.target as string[] | undefined;
      let message = 'Resource already exists';
      
      if (fields) {
        if (fields.includes('slug')) {
          message = 'A product with this slug already exists. Please use a different slug.';
        } else if (fields.includes('uniqueName')) {
          message = 'This unique name is already taken. Please choose a different one.';
        } else if (fields.includes('chain')) {
          message = 'A wallet for this chain already exists.';
        } else if (fields.includes('email')) {
          message = 'This email is already registered.';
        } else {
          message = `Duplicate entry. A record with this ${fields.join(', ')} already exists.`;
        }
      }
      
      throw Err.conflict(message, {
        constraint: 'unique',
        fields,
        prismaCode: error.code,
      });
    }
    
    // Record not found
    if (error.code === 'P2025') {
      throw Err.notFound('Record not found', {
        prismaCode: error.code,
        meta: error.meta,
      });
    }
    
    // Foreign key constraint violation
    if (error.code === 'P2003') {
      throw Err.badRequest('Invalid reference. Related record does not exist.', {
        prismaCode: error.code,
        meta: error.meta,
      });
    }
  }
  
  // Validation error
  if (error instanceof Prisma.PrismaClientValidationError) {
    throw Err.badRequest('Invalid database operation', {
      error: error.message,
    });
  }
  
  // Unknown Prisma error - let it bubble to 500 handler
  throw error;
}

/**
 * Map Clerk errors to AppError
 * 
 * Clerk API errors have a status property (401, 403, 404, etc.)
 */
export function mapClerkError(error: any): never {
  if (error.status === 401) {
    throw Err.unauthorized('Invalid authentication token', {
      clerkError: error.message,
    });
  }
  
  if (error.status === 403) {
    throw Err.forbidden('Access denied', {
      clerkError: error.message,
    });
  }
  
  if (error.status === 404) {
    throw Err.notFound('User not found', {
      clerkError: error.message,
    });
  }
  
  // Unknown Clerk error
  throw Err.internal('Authentication service error', {
    clerkError: error.message,
    clerkStatus: error.status,
  });
}

/**
 * Map BlockRadar API errors to AppError
 */
export function mapBlockRadarError(error: any): never {
  if (error.message?.includes('BLOCKRADAR_API_KEY is required')) {
    throw Err.internal('BlockRadar API key not configured');
  }
  
  if (error.message?.includes('BlockRadar API error')) {
    const statusMatch = error.message.match(/error (\d+):/);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : 500;
    
    if (status === 401) {
      throw Err.internal('BlockRadar API authentication failed');
    }
    
    if (status === 404) {
      throw Err.notFound('Wallet or address not found');
    }
    
    throw Err.internal('BlockRadar API error', {
      originalError: error.message,
    });
  }
  
  // Unknown BlockRadar error
  throw error;
}

/**
 * Map Stripe errors to AppError
 */
export function mapStripeError(error: any): never {
  if (error.type === 'StripeCardError') {
    throw Err.badRequest('Payment failed: ' + error.message);
  }
  
  if (error.type === 'StripeInvalidRequestError') {
    throw Err.badRequest('Invalid payment request: ' + error.message);
  }
  
  if (error.type === 'StripeAPIError') {
    throw Err.unavailable('Payment service temporarily unavailable');
  }
  
  if (error.type === 'StripeConnectionError') {
    throw Err.unavailable('Unable to connect to payment service');
  }
  
  if (error.type === 'StripeAuthenticationError') {
    throw Err.internal('Payment service authentication failed');
  }
  
  // Unknown Stripe error
  throw error;
}

