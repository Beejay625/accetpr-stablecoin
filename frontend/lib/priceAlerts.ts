/**
 * Price Alerts and Notifications
 * Set up alerts for token price movements
 */

import { type Address } from 'viem'

export type AlertCondition = 'above' | 'below' | 'change_up' | 'change_down'

export interface PriceAlert {
  id: string
  tokenAddress: Address
  tokenSymbol: string
  chainId: number
  condition: AlertCondition
  targetPrice: number
  currentPrice?: number
  isActive: boolean
  triggered: boolean
  triggeredAt?: number
  createdAt: number
  notificationEnabled: boolean
}

export interface AlertTrigger {
  alertId: string
  triggeredAt: number
  currentPrice: number
  targetPrice: number
  condition: AlertCondition
}

class PriceAlertManager {
  private alerts: Map<string, PriceAlert> = new Map()
  private triggers: AlertTrigger[] = []
  private storageKey = 'price_alerts'
  private checkInterval: NodeJS.Timeout | null = null

  constructor() {
    this.loadFromStorage()
    this.startPriceChecker()
  }

  /**
   * Create a price alert
   */
  createAlert(
    tokenAddress: Address,
    tokenSymbol: string,
    chainId: number,
    condition: AlertCondition,
    targetPrice: number,
    notificationEnabled: boolean = true
  ): string {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const alert: PriceAlert = {
      id,
      tokenAddress,
      tokenSymbol,
      chainId,
      condition,
      targetPrice,
      isActive: true,
      triggered: false,
      createdAt: Date.now(),
      notificationEnabled,
    }

    this.alerts.set(id, alert)
    this.saveToStorage()
    return id
  }

  /**
   * Update alert
   */
  updateAlert(id: string, updates: Partial<PriceAlert>): boolean {
    const alert = this.alerts.get(id)
    if (!alert) return false

    this.alerts.set(id, { ...alert, ...updates })
    this.saveToStorage()
    return true
  }

  /**
   * Delete alert
   */
  deleteAlert(id: string): boolean {
    const deleted = this.alerts.delete(id)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  /**
   * Get alert
   */
  getAlert(id: string): PriceAlert | undefined {
    return this.alerts.get(id)
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): PriceAlert[] {
    return Array.from(this.alerts.values())
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PriceAlert[] {
    return Array.from(this.alerts.values()).filter(
      alert => alert.isActive && !alert.triggered
    )
  }

  /**
   * Check price against alerts
   */
  checkPrice(tokenAddress: Address, currentPrice: number): void {
    const relevantAlerts = Array.from(this.alerts.values()).filter(
      alert =>
        alert.tokenAddress === tokenAddress &&
        alert.isActive &&
        !alert.triggered
    )

    relevantAlerts.forEach(alert => {
      const shouldTrigger = this.shouldTriggerAlert(alert, currentPrice)
      
      if (shouldTrigger) {
        this.triggerAlert(alert, currentPrice)
      } else {
        // Update current price
        alert.currentPrice = currentPrice
        this.alerts.set(alert.id, alert)
      }
    })

    this.saveToStorage()
  }

  /**
   * Check if alert should trigger
   */
  private shouldTriggerAlert(alert: PriceAlert, currentPrice: number): boolean {
    switch (alert.condition) {
      case 'above':
        return currentPrice >= alert.targetPrice
      case 'below':
        return currentPrice <= alert.targetPrice
      case 'change_up':
        if (!alert.currentPrice) return false
        const changeUp = ((currentPrice - alert.currentPrice) / alert.currentPrice) * 100
        return changeUp >= alert.targetPrice
      case 'change_down':
        if (!alert.currentPrice) return false
        const changeDown = ((alert.currentPrice - currentPrice) / alert.currentPrice) * 100
        return changeDown >= alert.targetPrice
      default:
        return false
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alert: PriceAlert, currentPrice: number): void {
    alert.triggered = true
    alert.triggeredAt = Date.now()
    alert.currentPrice = currentPrice

    const trigger: AlertTrigger = {
      alertId: alert.id,
      triggeredAt: Date.now(),
      currentPrice,
      targetPrice: alert.targetPrice,
      condition: alert.condition,
    }

    this.triggers.push(trigger)
    this.alerts.set(alert.id, alert)

    // Send notification if enabled
    if (alert.notificationEnabled) {
      this.sendNotification(alert, currentPrice)
    }
  }

  /**
   * Send notification
   */
  private sendNotification(alert: PriceAlert, currentPrice: number): void {
    const message = `Price alert: ${alert.tokenSymbol} is now $${currentPrice.toFixed(2)}`
    
    // In production, this would integrate with a notification service
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Price Alert', {
        body: message,
        icon: '/icon.png',
      })
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  /**
   * Reset alert (untrigger)
   */
  resetAlert(id: string): boolean {
    const alert = this.alerts.get(id)
    if (!alert) return false

    alert.triggered = false
    alert.triggeredAt = undefined
    this.alerts.set(id, alert)
    this.saveToStorage()
    return true
  }

  /**
   * Get trigger history
   */
  getTriggerHistory(alertId?: string): AlertTrigger[] {
    if (alertId) {
      return this.triggers.filter(trigger => trigger.alertId === alertId)
    }
    return [...this.triggers]
  }

  /**
   * Start price checker
   */
  private startPriceChecker(): void {
    if (this.checkInterval) return

    // Check prices every 30 seconds
    this.checkInterval = setInterval(() => {
      // In production, this would fetch prices from an API
      // For now, this is a placeholder
    }, 30 * 1000)
  }

  /**
   * Stop price checker
   */
  stopPriceChecker(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = Array.from(this.alerts.entries())
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save price alerts:', error)
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return

      const data: [string, PriceAlert][] = JSON.parse(stored)
      this.alerts = new Map(data)
    } catch (error) {
      console.error('Failed to load price alerts:', error)
    }
  }
}

// Singleton instance
export const priceAlertManager = new PriceAlertManager()

