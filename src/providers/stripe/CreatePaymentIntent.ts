import Stripe from 'stripe';
import { createLoggerWithFunction } from '../../logger';
import { StripeCurrency, validateAmount } from './currencies';
import { StripePaymentIntent } from './interfaces/CreatepaymentIntent.interface';

/**
 * Stripe Payment Provider
 * 
 * Handles Stripe payment intent creation and management
 */
export class StripePaymentProvider {
  private static logger = createLoggerWithFunction('StripePaymentProvider', { module: 'provider' });
  private static stripe: Stripe;

  /**
   * Initialize Stripe configuration
   */
  static initialize(): void {
    const secretKey = process.env['STRIPE_SECRET_KEY'];
    
    if (!secretKey) {
      throw new Error('Stripe configuration is incomplete. Please check STRIPE_SECRET_KEY environment variable.');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover', // Use latest API version
    });

    this.logger.info('Stripe payment provider initialized');
  }

  /**
   * Create a Stripe payment intent
   * 
   * @param amount - The amount in minor units (e.g., 2999 for $29.99 USD)
   * @param currency - The currency code (e.g., 'usd', 'eur', 'gbp')
   * @param productName - The product name (used for statement descriptor)
   * @param productId - The product ID for tracking
   * @param userId - The user ID for tracking
   * @returns Promise<StripePaymentIntent> - The full Stripe payment intent object
   */
  static async createPaymentIntent(
    amount: number,
    currency: StripeCurrency,
    productName: string,
    productId: string,
    userId: string
  ): Promise<StripePaymentIntent> {
    this.logger.info('createPaymentIntent', { 
      amount, 
      currency,
      productName,
      productId,
      userId
    }, 'Creating Stripe payment intent');

    try {
      // Validate amount and currency
      const validation = validateAmount(amount, currency);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const currencyInfo = validation.info;
      this.logger.info('createPaymentIntent', { 
        currency: currencyInfo.name,
        minimumAmount: currencyInfo.minimumAmount,
        isZeroDecimal: currencyInfo.isZeroDecimal,
        supportsAmericanExpress: currencyInfo.supportsAmericanExpress
      }, 'Currency validation passed');
      
      // Create statement descriptor from product name (max 22 characters, customer sees this)
      const statementDescriptor = this.createStatementDescriptor(productName);

      // Create a PaymentIntent with all payment methods
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        description: productName,                           // Description: Just the product name
        statement_descriptor_suffix: statementDescriptor,  // Customer statement suffix (max 22 chars)
        
        // Enable automatic payment methods to accept all available payment methods
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'always'
        },
        
        // Metadata for tracking
        metadata: {
          user_id: userId,
          product_id: productId
        }
      });

      this.logger.info('createPaymentIntent', { 
        paymentIntentId: paymentIntent.id,
        productId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        captureMethod: paymentIntent.capture_method,
        paymentMethodTypes: paymentIntent.payment_method_types
      }, 'Stripe payment intent created successfully');

      // Return the full payment intent as StripePaymentIntent interface
      return paymentIntent as StripePaymentIntent;
    } catch (error: any) {
      this.logger.error('createPaymentIntent', { 
        productId, 
        amount, 
        error: error.message 
      }, 'Failed to create Stripe payment intent');
      throw new Error(`Stripe payment intent creation failed: ${error.message}`);
    }
  }


  /**
   * Retrieve an existing payment intent from Stripe
   * 
   * @param paymentIntentId - The payment intent ID
   * @returns Promise<StripePaymentIntent>
   */
  static async retrievePaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    try {
      this.logger.info('retrievePaymentIntent', { paymentIntentId }, 'Retrieving payment intent from Stripe');

      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      this.logger.info('retrievePaymentIntent', {
        paymentIntentId,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }, 'Payment intent retrieved successfully');

      return paymentIntent as StripePaymentIntent;
    } catch (error: any) {
      this.logger.error('retrievePaymentIntent', {
        paymentIntentId,
        error: error.message
      }, 'Failed to retrieve payment intent from Stripe');
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Create statement descriptor from product name
   * 
   * @param productName - The product name
   * @returns string - Statement descriptor (max 22 characters)
   */
  private static createStatementDescriptor(productName: string): string {
    // Remove special characters and convert to uppercase
    const cleanName = productName
      .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove special characters
      .replace(/\s+/g, ' ')            // Normalize spaces
      .trim()
      .toUpperCase();
    
    // Return product name (max 22 characters for Stripe's limit)
    if (cleanName.length <= 22) {
      return cleanName;
    } else {
      // Truncate product name to fit 22 character limit
      return cleanName.substring(0, 22);
    }
  }

  /**
   * Convert amount from dollars to cents
   * 
   * @param amountInDollars - Amount in dollars (e.g., 29.99)
   * @returns number - Amount in cents (e.g., 2999)
   */
  static convertToCents(amountInDollars: number): number {
    return Math.round(amountInDollars * 100);
  }

  /**
   * Convert amount from cents to dollars
   * 
   * @param amountInCents - Amount in cents (e.g., 2999)
   * @returns number - Amount in dollars (e.g., 29.99)
   */
  static convertToDollars(amountInCents: number): number {
    return amountInCents / 100;
  }
}
