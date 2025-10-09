import { PrismaClient } from '@prisma/client';
import { createLoggerWithFunction } from '../logger';
import { prisma } from '../db/prisma';

/**
 * Database Operations
 * 
 * Centralized database operations with built-in protection:
 * - Race condition protection for create operations
 * - Existence checks for update and delete operations
 * - Atomic operations with rollback
 * - Duplicate entry handling
 */

export class DatabaseOperations {
  /**
   * Create operation with race condition protection
   */
  static async create<T>(
    model: keyof PrismaClient,
    data: any,
    uniqueFields?: string[]
  ): Promise<T> {
    const logger = createLoggerWithFunction('create', { module: 'database-ops' });
    
    try {
      if (uniqueFields && uniqueFields.length > 0) {
        // Use upsert for race condition protection
        let whereClause: any;
        
        if (uniqueFields.length > 1) {
          // Compound unique constraint (e.g., userId + chain)
          // Prisma expects the format: { userId_chain: { userId: "...", chain: "..." } }
          const compoundKey = uniqueFields.join('_');
          const compoundValue = uniqueFields.reduce((acc, field) => {
            acc[field] = data[field];
            return acc;
          }, {} as any);
          
          whereClause = { [compoundKey]: compoundValue };
        } else {
          // Single unique field
          const firstField = uniqueFields[0];
          if (firstField) {
            whereClause = { [firstField]: data[firstField] };
          }
        }

        const result = await (prisma[model] as any).upsert({
          where: whereClause,
          update: {},
          create: data,
        });

        logger.info({ model, uniqueFields }, 'Record created with race protection');
        return result;
      } else {
        // Regular create
        const result = await (prisma[model] as any).create({
          data,
        });

        logger.info({ model }, 'Record created');
        return result;
      }
    } catch (error: any) {
      logger.error({ model, error: error.message }, 'Failed to create record');
      throw error;
    }
  }

  /**
   * Update operation with existence check
   */
  static async update<T>(
    model: keyof PrismaClient,
    where: any,
    data: any
  ): Promise<T> {
    const logger = createLoggerWithFunction('update', { module: 'database-ops' });
    
    try {
      // Check if record exists first
      const existing = await (prisma[model] as any).findUnique({
        where,
      });

      if (!existing) {
        throw new Error(`Record not found for update in ${String(model)}`);
      }

      const result = await (prisma[model] as any).update({
        where,
        data,
      });

      logger.info({ model, where }, 'Record updated');
      return result;
    } catch (error: any) {
      logger.error({ model, where, error: error.message }, 'Failed to update record');
      throw error;
    }
  }

  /**
   * Delete operation with existence check
   */
  static async delete<T>(
    model: keyof PrismaClient,
    where: any
  ): Promise<T> {
    const logger = createLoggerWithFunction('delete', { module: 'database-ops' });
    
    try {
      // Check if record exists first
      const existing = await (prisma[model] as any).findUnique({
        where,
      });

      if (!existing) {
        throw new Error(`Record not found for deletion in ${String(model)}`);
      }

      const result = await (prisma[model] as any).delete({
        where,
      });

      logger.info({ model, where }, 'Record deleted');
      return result;
    } catch (error: any) {
      logger.error({ model, where, error: error.message }, 'Failed to delete record');
      throw error;
    }
  }

  /**
   * Atomic upsert operation
   */
  static async upsert<T>(
    model: keyof PrismaClient,
    where: any,
    createData: any,
    updateData: any
  ): Promise<T> {
    const logger = createLoggerWithFunction('upsert', { module: 'database-ops' });
    
    try {
      const result = await (prisma[model] as any).upsert({
        where,
        create: createData,
        update: updateData,
      });

      logger.info({ model, where }, 'Record upserted');
      return result;
    } catch (error: any) {
      logger.error({ model, where, error: error.message }, 'Failed to upsert record');
      throw error;
    }
  }

  /**
   * Batch atomic operations
   */
  static async batchAtomic<T>(
    operations: Array<{
      model: keyof PrismaClient;
      operation: 'create' | 'update' | 'delete' | 'upsert';
      where?: any;
      data?: any;
      createData?: any;
      updateData?: any;
    }>
  ): Promise<T[]> {
    const logger = createLoggerWithFunction('batchAtomic', { module: 'database-ops' });
    
    try {
      const results = await prisma.$transaction(async (tx: any) => {
        const batchResults: T[] = [];
        
        for (const op of operations) {
          let result: T;
          
          switch (op.operation) {
            case 'create':
              result = await tx[op.model].create({ data: op.data });
              break;
            case 'update':
              result = await tx[op.model].update({
                where: op.where,
                data: op.data,
              });
              break;
            case 'delete':
              result = await tx[op.model].delete({ where: op.where });
              break;
            case 'upsert':
              result = await tx[op.model].upsert({
                where: op.where,
                create: op.createData,
                update: op.updateData,
              });
              break;
            default:
              throw new Error(`Unknown operation: ${op.operation}`);
          }
          
          batchResults.push(result);
        }
        
        return batchResults;
      });

      logger.info({ operationCount: operations.length }, 'Batch atomic operations completed');
      return results;
    } catch (error: any) {
      logger.error({ operationCount: operations.length, error: error.message }, 'Batch atomic operations failed');
      throw error;
    }
  }

  /**
   * Find unique record
   */
  static async findUnique<T>(
    model: keyof PrismaClient,
    where: any
  ): Promise<T | null> {
    const logger = createLoggerWithFunction('findUnique', { module: 'database-ops' });
    
    try {
      const result = await (prisma[model] as any).findUnique({
        where,
      });

      logger.debug({ model, where, found: !!result }, 'Find unique operation');
      return result;
    } catch (error: any) {
      logger.error({ model, where, error: error.message }, 'Failed to find unique record');
      throw error;
    }
  }

  /**
   * Find many records
   */
  static async findMany<T>(
    model: keyof PrismaClient,
    where?: any,
    options?: any
  ): Promise<T[]> {
    const logger = createLoggerWithFunction('findMany', { module: 'database-ops' });
    
    try {
      const result = await (prisma[model] as any).findMany({
        where,
        ...options,
      });

      logger.debug({ model, where, count: result.length }, 'Find many operation');
      return result;
    } catch (error: any) {
      logger.error({ model, where, error: error.message }, 'Failed to find many records');
      throw error;
    }
  }
}
