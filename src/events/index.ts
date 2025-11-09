import { SimpleEventEmitter } from './emitter';
import { EventHandler, EventListenerOptions } from './types';

/**
 * Global event manager instance
 * This is the main entry point for event handling in the application
 */
export const eventManager = new SimpleEventEmitter();

/**
 * Event handler registration helper
 * Provides a clean API for registering event handlers
 */
export class EventHandlerRegistry {
  private static instance: EventHandlerRegistry;
  private registeredHandlers: Map<string, string[]> = new Map();

  private constructor() {}

  static getInstance(): EventHandlerRegistry {
    if (!EventHandlerRegistry.instance) {
      EventHandlerRegistry.instance = new EventHandlerRegistry();
    }
    return EventHandlerRegistry.instance;
  }

  /**
   * Register an event handler
   */
  register<T = any>(
    event: string, 
    handler: EventHandler<T>, 
    options?: EventListenerOptions
  ): string {
    const listenerId = eventManager.on(event, handler, options);
    
    // Track registered handlers for cleanup
    if (!this.registeredHandlers.has(event)) {
      this.registeredHandlers.set(event, []);
    }
    this.registeredHandlers.get(event)!.push(listenerId);
    
    return listenerId;
  }

  /**
   * Register a one-time event handler
   */
  registerOnce<T = any>(event: string, handler: EventHandler<T>): string {
    return this.register(event, handler, { once: true });
  }

  /**
   * Register a high-priority event handler
   */
  registerHighPriority<T = any>(event: string, handler: EventHandler<T>): string {
    return this.register(event, handler, { priority: 10 });
  }

  /**
   * Register a low-priority event handler
   */
  registerLowPriority<T = any>(event: string, handler: EventHandler<T>): string {
    return this.register(event, handler, { priority: -10 });
  }

  /**
   * Unregister an event handler
   */
  unregister(event: string, listenerId: string): boolean {
    const success = eventManager.off(event, listenerId);
    
    if (success) {
      const handlers = this.registeredHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(listenerId);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        
        // Clean up empty arrays
        if (handlers.length === 0) {
          this.registeredHandlers.delete(event);
        }
      }
    }
    
    return success;
  }

  /**
   * Unregister all handlers for an event
   */
  unregisterAll(event: string): void {
    eventManager.removeAllListeners(event);
    this.registeredHandlers.delete(event);
  }

  /**
   * Unregister all handlers
   */
  unregisterAllHandlers(): void {
    eventManager.removeAllListeners();
    this.registeredHandlers.clear();
  }

  /**
   * Get registered handler IDs for an event
   */
  getRegisteredHandlers(event: string): string[] {
    return this.registeredHandlers.get(event) || [];
  }

  /**
   * Get all registered events
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.registeredHandlers.keys());
  }
}

/**
 * Convenience functions for easy event handling
 */

/**
 * Register an event handler
 */
export const on = <T = any>(event: string, handler: EventHandler<T>, options?: EventListenerOptions): string => {
  return EventHandlerRegistry.getInstance().register(event, handler, options);
};

/**
 * Register a one-time event handler
 */
export const once = <T = any>(event: string, handler: EventHandler<T>): string => {
  return EventHandlerRegistry.getInstance().registerOnce(event, handler);
};

/**
 * Emit an event
 */
export const emit = <T = any>(event: string, data?: T): Promise<void> => {
  return eventManager.emit(event, data);
};

/**
 * Remove an event handler
 */
export const off = (event: string, listenerId: string): boolean => {
  return EventHandlerRegistry.getInstance().unregister(event, listenerId);
};

/**
 * Remove all listeners for an event
 */
export const removeAllListeners = (event?: string): void => {
  if (event) {
    EventHandlerRegistry.getInstance().unregisterAll(event);
  } else {
    EventHandlerRegistry.getInstance().unregisterAllHandlers();
  }
};

/**
 * Get listener count for an event
 */
export const listenerCount = (event: string): number => {
  return eventManager.listenerCount(event);
};

/**
 * Check if an event has listeners
 */
export const hasListeners = (event: string): boolean => {
  return eventManager.hasListeners(event);
};
