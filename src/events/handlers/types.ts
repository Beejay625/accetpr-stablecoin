/**
 * Base event handler interface
 * All event handlers should implement this interface
 */
export interface BaseEventHandler {
  eventName: string;
  priority?: number;
  description: string;
  handler: (data: any) => Promise<void> | void;
}

/**
 * Event handler registration helper
 * Use this to register handlers with the event system
 */
export class EventHandlerRegistry {
  private static registeredHandlers: Map<string, BaseEventHandler[]> = new Map();

  /**
   * Register a handler
   */
  static register(handler: BaseEventHandler): void {
    if (!this.registeredHandlers.has(handler.eventName)) {
      this.registeredHandlers.set(handler.eventName, []);
    }
    
    const handlers = this.registeredHandlers.get(handler.eventName)!;
    handlers.push(handler);
    
    // Sort by priority (higher priority first)
    handlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Register multiple handlers
   */
  static registerMultiple(handlers: BaseEventHandler[]): void {
    handlers.forEach(handler => this.register(handler));
  }

  /**
   * Get all registered handlers for an event
   */
  static getHandlers(eventName: string): BaseEventHandler[] {
    return this.registeredHandlers.get(eventName) || [];
  }

  /**
   * Get all registered handlers
   */
  static getAllHandlers(): Map<string, BaseEventHandler[]> {
    return new Map(this.registeredHandlers);
  }

  /**
   * Clear all handlers
   */
  static clearAll(): void {
    this.registeredHandlers.clear();
  }
}