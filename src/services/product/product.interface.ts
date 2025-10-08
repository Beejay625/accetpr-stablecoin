/**
 * Product Service Interfaces
 * 
 * Defines types for product creation and management
 */

export enum LinkExpiration {
  NEVER = 'never',
  CUSTOM_DAYS = 'custom_days'
}

export interface ProductRequest {
  image?: string;
  productName: string;
  description: string;
  amount: string;
  payoutChain: string; // Required - chain for payout (e.g., 'base', 'solana', 'tron')
  payoutToken: string; // Required - token for payout (e.g., 'USDC', 'USDT')
  slug: string; // Required - must be provided by user
  linkExpiration: LinkExpiration;
  customDays?: number; // Required when linkExpiration is CUSTOM_DAYS
}

export interface Product {
  id: string;
  image?: string;
  productName: string;
  description: string;
  amount: string;
  payoutChain: string; // Chain for payout (e.g., 'base', 'solana', 'tron')
  payoutToken: string; // Token for payout (e.g., 'USDC', 'USDT')
  slug: string;
  paymentLink: string; // Generated dynamically: baseUrl/{userUniqueName}/{slug}
  linkExpiration: LinkExpiration;
  customDays?: number;
  expiresAt?: string; // ISO date string, null if never expires
  
  // Payment intent statistics
  paymentIntentsCreated?: number;      // Total number of payment intents created
  paymentIntentsSucceeded?: number;    // Number of successful payments
  paymentIntentsFailed?: number;       // Number of failed payments
  paymentIntentsCancelled?: number;    // Number of cancelled payments
  paymentIntentsProcessing?: number;   // Number of processing payments
  paymentIntentsRequiresAction?: number; // Number of payments requiring action
  
  // Amount statistics (in dollars)
  amountCreated?: number;              // Total amount of all payment intents
  amountSucceeded?: number;            // Total amount of successful payments
  amountFailed?: number;               // Total amount of failed payments
  amountCancelled?: number;            // Total amount of cancelled payments
  amountProcessing?: number;           // Total amount of processing payments
  amountRequiresAction?: number;       // Total amount of payments requiring action
  
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'expired' | 'cancelled';
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

export interface ProductError {
  message: string;
  statusCode: number;
  error?: string;
}
