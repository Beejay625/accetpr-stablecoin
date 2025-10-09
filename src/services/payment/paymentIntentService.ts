import { createLoggerWithFunction } from '../../logger';
import { StripePaymentProvider, StripeCurrency, convertToCents, StripeCancelPaymentProvider, StripeVerifyMicrodepositsProvider } from '../../providers/stripe';
import { extractUserAndSlugFromLink, findUserByUniqueName, findProductByUserAndSlug, validateProductStatus } from './helpers/paymentLinkHelpers';
import { PaymentRepository } from '../../repositories/database/payment/paymentRepository';
import { PaymentIntent, PaymentIntentStatus } from '../../repositories/database/payment/payment.interface';
import { Err } from '../../errors';
import { env } from '../../config/env';

/**
 * Payment Intent Service
 * 
 * Handles payment intent creation from payment links with idempotency support
 */
export class PaymentIntentService {
  private static logger = createLoggerWithFunction('PaymentIntentService', { module: 'service' });

  /**
   * Build payment link from user unique name and slug
   */
  private static buildPaymentLink(userUniqueName: string, slug: string): string {
    return `${env.BASE_URL}/${userUniqueName}/${slug}`;
  }

  /**
   * Create or retrieve a payment intent
   * 
   * If clientSecret is provided, retrieve the existing payment intent.
   * Otherwise, create a new one.
   * 
   * @param paymentLink - The payment link
   * @param clientSecret - Optional existing client secret
   * @returns Promise<{ clientSecret: string; productId: string; amount: number; currency: string; isExisting: boolean }>
   */
  static async createOrRetrievePaymentIntent(
    paymentLink: string,
    clientSecret?: string
  ): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    productId: string;
    amount: number;
    currency: string;
    status: string;
    paymentLink: string;
    isExisting: boolean;
  }> {
    // If client secret provided, try to retrieve existing payment intent
    if (clientSecret) {
      try {
        const existing = await this.retrievePaymentIntentByClientSecret(clientSecret, paymentLink);
        if (existing) {
          return { ...existing, isExisting: true };
        }
        // If not found, fall through to create new one
        this.logger.info('createOrRetrievePaymentIntent', { clientSecret: clientSecret.substring(0, 20) }, 'Client secret provided but payment intent not found, creating new one');
      } catch (error: any) {
        // If retrieval fails, log and create new one
        this.logger.warn('createOrRetrievePaymentIntent', { 
          error: error.message 
        }, 'Failed to retrieve existing payment intent, creating new one');
      }
    }

    // Create new payment intent
    const newIntent = await this.createPaymentIntent(paymentLink);
    return { ...newIntent, isExisting: false };
  }

  /**
   * Retrieve existing payment intent by client secret
   */
  private static async retrievePaymentIntentByClientSecret(
    clientSecret: string,
    paymentLink: string
  ): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    productId: string;
    amount: number;
    currency: string;
    status: string;
    paymentLink: string;
  } | null> {
    try {
      // Extract payment intent ID from client secret
      // Format: pi_{id}_secret_{secret}
      const paymentIntentId = clientSecret.split('_secret_')[0];
      
      if (!paymentIntentId) {
        return null;
      }

      // Retrieve payment intent from Stripe
      const stripeIntent = await StripePaymentProvider.retrievePaymentIntent(paymentIntentId);
      
      // Verify it matches the payment link (get product from link)
      const { userUniqueName, slug } = extractUserAndSlugFromLink(paymentLink);
      const user = await findUserByUniqueName(userUniqueName);
      if (!user) {
        return null;
      }
      
      const product = await findProductByUserAndSlug(user.clerkUserId, slug);
      if (!product) {
        return null;
      }

      // Verify the payment intent matches this product
      if (stripeIntent.metadata.product_id !== product.id) {
        this.logger.warn('retrievePaymentIntentByClientSecret', {
          expectedProductId: product.id,
          actualProductId: stripeIntent.metadata.product_id
        }, 'Payment intent does not match payment link product');
        return null;
      }

      this.logger.info('retrievePaymentIntentByClientSecret', {
        paymentIntentId,
        productId: product.id,
        status: stripeIntent.status
      }, 'Existing payment intent retrieved');

      // Map Stripe status to database status
      const dbStatus = this.mapStripeStatusToDbStatus(stripeIntent.status);

      return {
        paymentIntentId,
        clientSecret,
        productId: product.id,
        amount: parseFloat(product.amount),
        currency: stripeIntent.currency,
        status: dbStatus,
        paymentLink: product.paymentLink
      };
    } catch (error: any) {
      this.logger.error('retrievePaymentIntentByClientSecret', {
        error: error.message
      }, 'Failed to retrieve payment intent by client secret');
      return null;
    }
  }

  /**
   * Create a payment intent from a payment link
   * 
   * @param paymentLink - The payment link (e.g., https://pay.stablestack.com/johndoe/premium-subscription)
   * @returns Promise<{ paymentIntentId: string; clientSecret: string; productId: string; amount: number; currency: string; status: string }>
   */
  private static async createPaymentIntent(paymentLink: string): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    productId: string;
    amount: number;
    currency: string;
    status: string;
    paymentLink: string;
  }> {
    try {
      // Extract user unique name and slug from payment link
      const { userUniqueName, slug } = extractUserAndSlugFromLink(paymentLink);

      // Find user by unique name to get user ID
      const user = await findUserByUniqueName(userUniqueName);
      if (!user) {
        throw Err.notFound(`User with unique name "${userUniqueName}" not found`);
      }

      // Find product by Clerk user ID and slug (Product.userId now stores clerkUserId)
      const product = await findProductByUserAndSlug(user.clerkUserId, slug);
      if (!product) {
        throw Err.notFound(`Product with slug "${slug}" not found for user "${userUniqueName}"`);
      }

      // Validate product is active and not expired
      validateProductStatus(product);

      // Convert amount to cents for Stripe
      const amountInCents = convertToCents(parseFloat(product.amount));
      
      // Map crypto token to Stripe currency
      // USDC/USDT are USD stablecoins, so payments are processed in USD
      const currency = StripeCurrency.USD;

      // Create Stripe payment intent and get full response
      const stripeIntent = await StripePaymentProvider.createPaymentIntent(
        amountInCents,
        currency,
        product.productName,
        product.id,
        user.clerkUserId // Use the Clerk user ID we already have
      );

      // Create payment intent object for database (id will be auto-generated by database)
      // Extract what we need from the Stripe payment intent interface
      const paymentIntent: Omit<PaymentIntent, 'id' | 'paymentMethodTypes'> = {
        userId: user.clerkUserId, // Use the Clerk user ID consistently
        productId: product.id,
        slug: slug,
        userUniqueName: userUniqueName,
        paymentIntentId: stripeIntent.id, // Get ID from Stripe payment intent interface
        clientSecret: stripeIntent.client_secret, // Get client secret from interface
        amount: stripeIntent.amount, // Get amount from interface (already in cents)
        currency: stripeIntent.currency, // Get currency from interface
        status: PaymentIntentStatus.INITIATED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save payment intent to database
      await PaymentRepository.savePaymentIntent(paymentIntent);

      this.logger.info('createPaymentIntent', {
        paymentIntentId: stripeIntent.id,
        productId: product.id,
        amount: stripeIntent.amount
      }, 'Payment intent created successfully');

      return {
        paymentIntentId: stripeIntent.id,
        clientSecret: stripeIntent.client_secret,
        productId: product.id,
        amount: parseFloat(product.amount), // Return in dollars for user-friendly display
        currency: stripeIntent.currency,
        status: PaymentIntentStatus.INITIATED,
        paymentLink: product.paymentLink
      };
    } catch (error: any) {
      // If it's already an AppError, just re-throw it
      if (error.name === 'AppError') {
        throw error;
      }
      
      // Log and re-throw unexpected errors
      this.logger.error('createPaymentIntent', { 
        paymentLink, 
        error: error.message
      }, 'Failed to create payment intent');
      
      throw error;
    }
  }

  /**
   * Cancel a payment intent by client secret
   * 
   * @param clientSecret - The client secret from the payment intent
   * @param cancellationReason - Optional reason for cancellation
   * @returns Promise<{ paymentIntentId: string; clientSecret: string; productId: string; amount: number; currency: string; status: string; message: string }>
   */
  static async cancelPaymentIntentByClientSecret(
    clientSecret: string,
    cancellationReason?: string
  ): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    productId: string;
    amount: number;
    currency: string;
    status: string;
    paymentLink: string;
    message: string;
  }> {
    try {
      // Extract payment intent ID from client secret
      // Format: pi_{id}_secret_{secret}
      const paymentIntentId = clientSecret.split('_secret_')[0];

      if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
        throw Err.badRequest('Invalid client secret format');
      }

      // Find payment intent in database by client secret
      const dbPaymentIntent = await PaymentRepository.findByClientSecret(clientSecret);

      if (!dbPaymentIntent) {
        throw Err.notFound('Payment intent not found');
      }

      // Check if already canceled
      if (dbPaymentIntent.status === PaymentIntentStatus.CANCELLED) {
        this.logger.info('cancelPaymentIntentByClientSecret', {
          paymentIntentId,
          currentStatus: dbPaymentIntent.status
        }, 'Payment intent already canceled');

        return {
          paymentIntentId: dbPaymentIntent.paymentIntentId,
          clientSecret: dbPaymentIntent.clientSecret,
          productId: dbPaymentIntent.productId,
          amount: dbPaymentIntent.amount / 100, // Convert cents to dollars
          currency: dbPaymentIntent.currency,
          status: PaymentIntentStatus.CANCELLED,
          paymentLink: this.buildPaymentLink(dbPaymentIntent.userUniqueName, dbPaymentIntent.slug),
          message: 'Payment intent is already canceled'
        };
      }

      // Cancel the payment intent in Stripe with optional reason
      const canceledIntent = await StripeCancelPaymentProvider.cancelPaymentIntent(
        paymentIntentId,
        cancellationReason
      );

      // Update status in database
      await PaymentRepository.updatePaymentIntentStatus(
        dbPaymentIntent.id,
        PaymentIntentStatus.CANCELLED
      );

      this.logger.info('cancelPaymentIntentByClientSecret', {
        paymentIntentId,
        dbId: dbPaymentIntent.id,
        previousStatus: dbPaymentIntent.status,
        newStatus: PaymentIntentStatus.CANCELLED,
        cancellationReason: cancellationReason || 'none',
        canceled_at: canceledIntent.canceled_at
      }, 'Payment intent canceled successfully');

      return {
        paymentIntentId: dbPaymentIntent.paymentIntentId,
        clientSecret: dbPaymentIntent.clientSecret,
        productId: dbPaymentIntent.productId,
        amount: dbPaymentIntent.amount / 100, // Convert cents to dollars
        currency: dbPaymentIntent.currency,
        status: PaymentIntentStatus.CANCELLED,
        paymentLink: this.buildPaymentLink(dbPaymentIntent.userUniqueName, dbPaymentIntent.slug),
        message: 'Payment intent canceled successfully'
      };
    } catch (error: any) {
      // If it's already an AppError, just re-throw it
      if (error.name === 'AppError') {
        throw error;
      }

      // Log and re-throw unexpected errors
      this.logger.error('cancelPaymentIntentByClientSecret', {
        error: error.message
      }, 'Failed to cancel payment intent');

      throw error;
    }
  }

  /**
   * Verify microdeposits for a payment intent by client secret
   * 
   * @param clientSecret - The client secret from the payment intent
   * @param amounts - Two microdeposit amounts (e.g., [32, 45])
   * @returns Promise<{ paymentIntentId: string; clientSecret: string; productId: string; amount: number; currency: string; status: string; message: string }>
   */
  static async verifyMicrodepositsByClientSecret(
    clientSecret: string,
    amounts: [number, number]
  ): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    productId: string;
    amount: number;
    currency: string;
    status: string;
    paymentLink: string;
    message: string;
  }> {
    try {
      // Extract payment intent ID from client secret
      // Format: pi_{id}_secret_{secret}
      const paymentIntentId = clientSecret.split('_secret_')[0];

      if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
        throw Err.badRequest('Invalid client secret format');
      }

      // Validate amounts
      if (!Array.isArray(amounts) || amounts.length !== 2) {
        throw Err.badRequest('Amounts must be an array of exactly 2 numbers');
      }

      if (amounts.some(amount => typeof amount !== 'number' || amount < 0 || amount > 99)) {
        throw Err.badRequest('Each amount must be a number between 0 and 99');
      }

      // Find payment intent in database by client secret
      const dbPaymentIntent = await PaymentRepository.findByClientSecret(clientSecret);

      if (!dbPaymentIntent) {
        throw Err.notFound('Payment intent not found');
      }

      // Verify the microdeposits in Stripe
      const verifiedIntent = await StripeVerifyMicrodepositsProvider.verifyMicrodeposits(
        paymentIntentId,
        amounts
      );

      // Update status to MICRODEPOSITS_VERIFIED after successful verification
      const newStatus = PaymentIntentStatus.MICRODEPOSITS_VERIFIED;

      if (newStatus !== dbPaymentIntent.status) {
        await PaymentRepository.updatePaymentIntentStatus(
          dbPaymentIntent.id,
          newStatus
        );
      }

      this.logger.info('verifyMicrodepositsByClientSecret', {
        paymentIntentId,
        dbId: dbPaymentIntent.id,
        previousStatus: dbPaymentIntent.status,
        newStatus: newStatus,
        stripeStatus: verifiedIntent.status
      }, 'Microdeposits verified successfully');

      return {
        paymentIntentId: dbPaymentIntent.paymentIntentId,
        clientSecret: dbPaymentIntent.clientSecret,
        productId: dbPaymentIntent.productId,
        amount: dbPaymentIntent.amount / 100, // Convert cents to dollars
        currency: dbPaymentIntent.currency,
        status: newStatus,
        paymentLink: this.buildPaymentLink(dbPaymentIntent.userUniqueName, dbPaymentIntent.slug),
        message: 'Microdeposits verified successfully'
      };
    } catch (error: any) {
      // If it's already an AppError, just re-throw it
      if (error.name === 'AppError') {
        throw error;
      }

      // Log and re-throw unexpected errors
      this.logger.error('verifyMicrodepositsByClientSecret', {
        error: error.message
      }, 'Failed to verify microdeposits');

      throw error;
    }
  }

  /**
   * Map Stripe payment intent status to database status
   * 
   * @param stripeStatus - Stripe payment intent status
   * @returns PaymentIntentStatus - Database status
   */
  private static mapStripeStatusToDbStatus(
    stripeStatus: string
  ): PaymentIntentStatus {
    switch (stripeStatus) {
      case 'requires_payment_method':
      case 'requires_confirmation':
        return PaymentIntentStatus.INITIATED;

      case 'requires_action':
        return PaymentIntentStatus.REQUIRES_ACTION;

      case 'processing':
        return PaymentIntentStatus.PROCESSING;

      case 'requires_capture':
        return PaymentIntentStatus.PENDING;

      case 'succeeded':
        return PaymentIntentStatus.SUCCEEDED;

      case 'canceled':
        return PaymentIntentStatus.CANCELLED;

      default:
        this.logger.warn('mapStripeStatusToDbStatus', {
          stripeStatus
        }, 'Unknown Stripe status, defaulting to PENDING');
        return PaymentIntentStatus.PENDING;
    }
  }

}
