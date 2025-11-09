export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'transaction'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  read: boolean
  actionUrl?: string
  actionLabel?: string
}

class NotificationManager {
  private notifications: Notification[] = []
  private listeners: Array<(notifications: Notification[]) => void> = []

  /**
   * Request browser notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  /**
   * Show browser notification
   */
  async showBrowserNotification(title: string, options?: NotificationOptions) {
    if (await this.requestPermission()) {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      })
    }
  }

  /**
   * Add notification
   */
  add(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false,
    }

    this.notifications.unshift(newNotification) // Add to beginning
    this.persist()
    this.notifyListeners()

    // Show browser notification for important types
    if (notification.type === 'transaction' || notification.type === 'error') {
      this.showBrowserNotification(notification.title, {
        body: notification.message,
      })
    }

    return id
  }

  /**
   * Mark as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
      this.persist()
      this.notifyListeners()
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true))
    this.persist()
    this.notifyListeners()
  }

  /**
   * Remove notification
   */
  remove(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id)
    this.persist()
    this.notifyListeners()
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notifications = []
    this.persist()
    this.notifyListeners()
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return [...this.notifications]
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  /**
   * Get unread notifications
   */
  getUnread(): Notification[] {
    return this.notifications.filter((n) => !n.read)
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback([...this.notifications]))
  }

  /**
   * Persist to localStorage
   */
  private persist(): void {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications))
    } catch (error) {
      console.error('Failed to persist notifications:', error)
    }
  }

  /**
   * Load from localStorage
   */
  load(): void {
    try {
      const stored = localStorage.getItem('notifications')
      if (stored) {
        this.notifications = JSON.parse(stored)
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }
}

// Singleton instance
export const notificationManager = new NotificationManager()

// Load on initialization
if (typeof window !== 'undefined') {
  notificationManager.load()
}

