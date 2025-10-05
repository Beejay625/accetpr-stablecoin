/**
 * Event handler function type
 */
export type EventHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * Event listener options
 */
export interface EventListenerOptions {
  once?: boolean; // Remove listener after first execution
  priority?: number; // Higher priority handlers execute first (default: 0)
}

/**
 * Event listener entry
 */
export interface EventListener<T = any> {
  handler: EventHandler<T>;
  options: EventListenerOptions;
  id: string;
}

/**
 * Event emitter interface
 */
export interface EventEmitter {
  on<T = any>(event: string, handler: EventHandler<T>, options?: EventListenerOptions): string;
  off(event: string, listenerId: string): boolean;
  emit<T = any>(event: string, data?: T): Promise<void>;
  once<T = any>(event: string, handler: EventHandler<T>): string;
  removeAllListeners(event?: string): void;
  listenerCount(event: string): number;
}
