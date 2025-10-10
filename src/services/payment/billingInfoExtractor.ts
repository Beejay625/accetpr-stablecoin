import Stripe from 'stripe';
import { createLoggerWithFunction } from '../../logger';

/**
 * Billing Info Extractor Service
 * 
 * Extracts customer name and email from billing details in Stripe webhook events
 * using multiple fallback strategies to maximize the chance of getting customer data.
 */
export class BillingInfoExtractor {
  private static logger = createLoggerWithFunction('BillingInfoExtractor', { module: 'service' });

  /**
   * Extracts customer name and email from billing details in a Stripe webhook event
   * 
   * @param event - The Stripe webhook event object
   * @param stripe - The initialized Stripe client
   * @returns Promise<{name: string|null, email: string|null}> Customer billing info
   */
  static async extractFromEvent(
    event: Stripe.Event,
    stripe: Stripe
  ): Promise<{ name: string | null; email: string | null }> {
    // Default return values
    let name: string | null = null;
    let email: string | null = null;

    this.logger.info('extractFromEvent', {
      eventType: event.type,
      eventId: event.id
    }, 'Extracting customer billing info from webhook event');

    // Only proceed for relevant events
    if (!event || !event.data || !event.data.object) {
      this.logger.warn('extractFromEvent', {}, 'Invalid event structure');
      return { name, email };
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    try {
      // Strategy 1: Check charges data directly (for payment_intent.succeeded)
      // Note: charges data is typically expanded in webhook events
      if ((paymentIntent as any).charges && (paymentIntent as any).charges.data && (paymentIntent as any).charges.data.length > 0) {
        const charge = (paymentIntent as any).charges.data[0];

        if (charge.billing_details) {
          if (charge.billing_details.name) {
            name = charge.billing_details.name;
          }

          if (charge.billing_details.email) {
            email = charge.billing_details.email;
          }

          // If we found both name and email, return early
          if (name && email) {
            this.logger.info('extractFromEvent', {
              source: 'charges_data',
              name,
              email
            }, 'Found complete billing info from charges data');
            return { name, email };
          }
        }
      }

      // Strategy 2: Retrieve the payment method for billing details
      if (paymentIntent.payment_method) {
        try {
          const paymentMethod = await stripe.paymentMethods.retrieve(
            paymentIntent.payment_method as string
          );

          if (paymentMethod.billing_details) {
            // Get name if we don't have it yet
            if (paymentMethod.billing_details.name) {
              name = paymentMethod.billing_details.name;
            }

            // Get email if we don't have it yet
            if (paymentMethod.billing_details.email) {
              email = paymentMethod.billing_details.email;
            }
          }

          this.logger.info('extractFromEvent', {
            source: 'payment_method',
            name,
            email
          }, 'Retrieved billing info from payment method');
        } catch (error: any) {
          this.logger.warn('extractFromEvent', {
            error: error.message,
            paymentMethodId: paymentIntent.payment_method
          }, 'Error retrieving payment method');
        }
      }

      // Strategy 3: For payment_intent.succeeded, expand the last_payment_error if available
      if (paymentIntent.last_payment_error && paymentIntent.last_payment_error.payment_method) {
        const errorPaymentMethod = paymentIntent.last_payment_error.payment_method;

        if (errorPaymentMethod.billing_details) {
          if (!name && errorPaymentMethod.billing_details.name) {
            name = errorPaymentMethod.billing_details.name;
          }

          if (!email && errorPaymentMethod.billing_details.email) {
            email = errorPaymentMethod.billing_details.email;
          }
        }

        this.logger.info('extractFromEvent', {
          source: 'last_payment_error',
          name,
          email
        }, 'Retrieved billing info from last payment error');
      }

      // If we still don't have complete info and the event is for a successful payment,
      // make an additional API call to get the full PaymentIntent with expanded data
      if ((!name || !email) && event.type === 'payment_intent.succeeded') {
        try {
          const fullPaymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntent.id,
            {
              expand: ['payment_method', 'latest_charge']
            }
          );

          // Try to get info from the expanded payment method
          if (fullPaymentIntent.payment_method && 
              typeof fullPaymentIntent.payment_method !== 'string' &&
              fullPaymentIntent.payment_method.billing_details) {
            if (!name && fullPaymentIntent.payment_method.billing_details.name) {
              name = fullPaymentIntent.payment_method.billing_details.name;
            }

            if (!email && fullPaymentIntent.payment_method.billing_details.email) {
              email = fullPaymentIntent.payment_method.billing_details.email;
            }
          }

          // Try to get info from the expanded latest charge
          if (fullPaymentIntent.latest_charge && 
              typeof fullPaymentIntent.latest_charge !== 'string' &&
              fullPaymentIntent.latest_charge.billing_details) {

            if (!name && fullPaymentIntent.latest_charge.billing_details.name) {
              name = fullPaymentIntent.latest_charge.billing_details.name;
            }

            if (!email && fullPaymentIntent.latest_charge.billing_details.email) {
              email = fullPaymentIntent.latest_charge.billing_details.email;
            }
          }

          this.logger.info('extractFromEvent', {
            source: 'expanded_payment_intent',
            name,
            email
          }, 'Retrieved billing info from expanded payment intent');
        } catch (error: any) {
          this.logger.warn('extractFromEvent', {
            error: error.message,
            paymentIntentId: paymentIntent.id
          }, 'Error retrieving expanded PaymentIntent');
        }
      }

      this.logger.info('extractFromEvent', {
        finalName: name,
        finalEmail: email,
        hasCompleteInfo: !!(name && email)
      }, 'Billing info extraction completed');

      return { name, email };
    } catch (error: any) {
      this.logger.error('extractFromEvent', {
        error: error.message,
        eventType: event.type,
        eventId: event.id
      }, 'Error extracting billing info from event');
      
      return { name, email };
    }
  }
}
