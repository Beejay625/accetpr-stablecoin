import { createLoggerWithFunction } from '../logger';
import { testDatabaseConnection } from '../db/prisma';
import { registerAllEventHandlers } from '../events/handlers';
import { CacheAssetsOnStartup } from './cacheAssetsOnStartup';
import { ImageStorageService } from '../providers/cloudinary/imageStorage';
import { StripePaymentProvider } from '../providers/stripe/paymentIntent';
import { WebhookController } from '../controllers/payment/webhookController';

/**
 * Service Initializer
 * 
 * Handles initialization of all services in the application.
 */

export class ServiceInitializer {
  /**
   * Initialize all services in one function
   */
  static async initializeAllServices(): Promise<void> {
    const logger = createLoggerWithFunction('initializeAllServices', { module: 'server' });
    
    try {
      logger.info('Initializing all services...');

      // Initialize database connection
      await this.initializeDatabase();
      
      // Initialize cache service
      await this.initializeCache();
      
      // Initialize event handlers
      await this.initializeEventHandlers();
      
      // Initialize asset cache
      await this.initializeAssetCache();
      
      // Initialize image storage
      await this.initializeImageStorage();
      
      // Initialize Stripe payment provider
      await this.initializeStripeProvider();
      
      // Initialize webhook controller
      await this.initializeWebhookController();
      
      // Initialize other services as needed
      await this.initializeOtherServices();

      logger.info('All services initialized successfully');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to initialize services');
      throw error;
    }
  }

  /**
   * Initialize database connection
   */
  private static async initializeDatabase(): Promise<void> {
    const logger = createLoggerWithFunction('initializeDatabase', { module: 'server' });
    
    try {
      const isConnected = await testDatabaseConnection();
      if (isConnected) {
        logger.info('Database connection established');
      } else {
        throw new Error('Database connection failed');
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Database initialization failed');
      throw error;
    }
  }

  /**
   * Initialize cache service
   */
  private static async initializeCache(): Promise<void> {
    const logger = createLoggerWithFunction('initializeCache', { module: 'server' });
    
    try {
      // Cache initialization logic would go here
      logger.info('Cache service initialized');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Cache initialization failed');
      throw error;
    }
  }

  /**
   * Initialize event handlers
   */
  private static async initializeEventHandlers(): Promise<void> {
    const logger = createLoggerWithFunction('initializeEventHandlers', { module: 'server' });
    
    try {
      registerAllEventHandlers();
      logger.info('Event handlers initialized');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Event handlers initialization failed');
      throw error;
    }
  }

  /**
   * Initialize asset cache
   */
  private static async initializeAssetCache(): Promise<void> {
    const logger = createLoggerWithFunction('initializeAssetCache', { module: 'server' });
    
    try {
      await CacheAssetsOnStartup.loadAssetsOnStartup();
      logger.info('Asset cache initialized');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Asset cache initialization failed');
      throw error;
    }
  }

  /**
   * Initialize image storage
   */
  private static async initializeImageStorage(): Promise<void> {
    const logger = createLoggerWithFunction('initializeImageStorage', { module: 'server' });
    
    try {
      ImageStorageService.initialize();
      logger.info('Image storage (Cloudinary) initialized');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Image storage initialization failed');
      throw error;
    }
  }

  /**
   * Initialize Stripe payment provider
   */
  private static async initializeStripeProvider(): Promise<void> {
    const logger = createLoggerWithFunction('initializeStripeProvider', { module: 'server' });
    
    try {
      StripePaymentProvider.initialize();
      logger.info('Stripe payment provider initialized');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Stripe payment provider initialization failed');
      throw error;
    }
  }

  /**
   * Initialize webhook controller
   */
  private static async initializeWebhookController(): Promise<void> {
    const logger = createLoggerWithFunction('initializeWebhookController', { module: 'server' });
    
    try {
      WebhookController.initialize();
      logger.info('Webhook controller initialized');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Webhook controller initialization failed');
      throw error;
    }
  }

  /**
   * Initialize other services
   */
  private static async initializeOtherServices(): Promise<void> {
    const logger = createLoggerWithFunction('initializeOtherServices', { module: 'server' });
    
    try {
      // Other service initialization logic would go here
      logger.info('Other services initialized');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Other services initialization failed');
      throw error;
    }
  }
}