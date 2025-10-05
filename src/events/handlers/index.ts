/**
 * Main handlers index file
 * Import and register all event handlers here
 */

import { eventManager } from '../index';
import { WalletEventHandler } from './walletEventHandler';

/**
 * Register all event handlers with the event system
 */
export function registerAllEventHandlers(): void {
  // Register wallet event handlers
  eventManager.on('user:wallet:generate', WalletEventHandler.handleGenerateWalletAfterLogin);
  
  console.log('Event handlers registered');
}

