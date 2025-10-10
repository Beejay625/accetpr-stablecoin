import { env } from '../../src/config/env';

/**
 * Admin Configuration
 * 
 * Parses and manages admin-specific environment variables.
 * Admin access is controlled via a comma-separated list of emails in ADMIN_EMAILS env var.
 */
export const adminConfig = {
  /**
   * List of admin email addresses (lowercase, trimmed)
   */
  adminEmails: env.ADMIN_EMAILS.split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0),
  
  /**
   * Whether admin functionality is enabled (i.e., at least one admin email is configured)
   */
  isAdminEnabled: env.ADMIN_EMAILS.length > 0,
};

