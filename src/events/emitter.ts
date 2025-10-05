import { EventEmitter, EventHandler, EventListener, EventListenerOptions } from './types';

/**
 * Simple event emitter implementation
 * Lightweight and non-blocking for out-of-thread operations
 */
export class SimpleEventEmitter implements EventEmitter {
  private listeners: Map<string, EventListener[]> = new Map();
  private listenerIdCounter = 0;

  /**
   * Register an event listener
   */
  on<T = any>(event: string, handler: EventHandler<T>, options: EventListenerOptions = {}): string {
    const listenerId = `listener_${++this.listenerIdCounter}`;
    const listener: EventListener<T> = {
      handler,
      options: {
        priority: 0,
        once: false,
        ...options,
      },
      id: listenerId,
    };

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const eventListeners = this.listeners.get(event)!;
    eventListeners.push(listener);
    
    // Sort by priority (higher priority first)
    eventListeners.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));

    return listenerId;
  }

  /**
   * Register a one-time event listener
   */
  once<T = any>(event: string, handler: EventHandler<T>): string {
    return this.on(event, handler, { once: true });
  }

  /**
   * Remove an event listener
   */
  off(event: string, listenerId: string): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return false;

    const index = eventListeners.findIndex(listener => listener.id === listenerId);
    if (index === -1) return false;

    eventListeners.splice(index, 1);
    
    // Clean up empty event arrays
    if (eventListeners.length === 0) {
      this.listeners.delete(event);
    }

    return true;
  }

  /**
   * Emit an event to all registered listeners
   * Runs handlers asynchronously to avoid blocking
   */
  async emit<T = any>(event: string, data?: T): Promise<void> {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.length === 0) {
      return;
    }

    // Create a copy to avoid issues with listeners modifying the array during execution
    const listenersToExecute = [...eventListeners];
    const listenersToRemove: string[] = [];

    // Execute all handlers asynchronously
    const promises = listenersToExecute.map(async (listener) => {
      try {
        await listener.handler(data);
        
        // Mark for removal if it's a once listener
        if (listener.options.once) {
          listenersToRemove.push(listener.id);
        }
      } catch (error) {
        console.error(`Error in event handler for '${event}':`, error);
      }
    });

    // Wait for all handlers to complete
    await Promise.allSettled(promises);

    // Remove once listeners
    listenersToRemove.forEach(listenerId => {
      this.off(event, listenerId);
    });
  }

  /**
   * Remove all listeners for an event (or all events if no event specified)
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: string): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.length : 0;
  }

  /**
   * Get all registered event names
   */
  getEventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Check if an event has any listeners
   */
  hasListeners(event: string): boolean {
    return this.listenerCount(event) > 0;
  }
}
