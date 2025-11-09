/**
 * Network Health Monitoring
 * Monitors network status, latency, and availability
 */

import { type Address } from 'viem'

export interface NetworkStatus {
  chainId: number
  name: string
  healthy: boolean
  latency: number // milliseconds
  lastChecked: number
  blockHeight?: number
  gasPrice?: bigint
  errors: string[]
}

export interface NetworkHealthCheck {
  chainId: number
  timestamp: number
  success: boolean
  latency: number
  error?: string
}

class NetworkHealthMonitor {
  private statuses: Map<number, NetworkStatus> = new Map()
  private healthChecks: NetworkHealthCheck[] = []
  private checkInterval: number = 30000 // 30 seconds

  /**
   * Update network status
   */
  updateStatus(
    chainId: number,
    name: string,
    healthy: boolean,
    latency: number,
    blockHeight?: number,
    gasPrice?: bigint,
    errors: string[] = []
  ): void {
    this.statuses.set(chainId, {
      chainId,
      name,
      healthy,
      latency,
      lastChecked: Date.now(),
      blockHeight,
      gasPrice,
      errors,
    })

    // Record health check
    this.healthChecks.push({
      chainId,
      timestamp: Date.now(),
      success: healthy,
      latency,
      error: errors.length > 0 ? errors.join(', ') : undefined,
    })

    // Keep only last 1000 health checks
    if (this.healthChecks.length > 1000) {
      this.healthChecks = this.healthChecks.slice(-1000)
    }
  }

  /**
   * Get network status
   */
  getStatus(chainId: number): NetworkStatus | undefined {
    return this.statuses.get(chainId)
  }

  /**
   * Get all network statuses
   */
  getAllStatuses(): NetworkStatus[] {
    return Array.from(this.statuses.values())
  }

  /**
   * Check if network is healthy
   */
  isHealthy(chainId: number): boolean {
    const status = this.statuses.get(chainId)
    if (!status) return false

    // Consider unhealthy if not checked in last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    if (status.lastChecked < fiveMinutesAgo) {
      return false
    }

    return status.healthy
  }

  /**
   * Get average latency for a network
   */
  getAverageLatency(chainId: number, minutes: number = 5): number {
    const cutoff = Date.now() - minutes * 60 * 1000
    const recentChecks = this.healthChecks.filter(
      check => check.chainId === chainId && check.timestamp > cutoff
    )

    if (recentChecks.length === 0) return 0

    const sum = recentChecks.reduce((acc, check) => acc + check.latency, 0)
    return sum / recentChecks.length
  }

  /**
   * Get uptime percentage for a network
   */
  getUptimePercentage(chainId: number, minutes: number = 60): number {
    const cutoff = Date.now() - minutes * 60 * 1000
    const recentChecks = this.healthChecks.filter(
      check => check.chainId === chainId && check.timestamp > cutoff
    )

    if (recentChecks.length === 0) return 0

    const successful = recentChecks.filter(check => check.success).length
    return (successful / recentChecks.length) * 100
  }

  /**
   * Get recent errors for a network
   */
  getRecentErrors(chainId: number, minutes: number = 60): string[] {
    const cutoff = Date.now() - minutes * 60 * 1000
    const recentChecks = this.healthChecks.filter(
      check =>
        check.chainId === chainId &&
        check.timestamp > cutoff &&
        check.error
    )

    return recentChecks.map(check => check.error!).filter(Boolean)
  }

  /**
   * Get network recommendations
   */
  getRecommendations(chainId: number): string[] {
    const status = this.statuses.get(chainId)
    if (!status) return ['Network status unknown']

    const recommendations: string[] = []

    if (!status.healthy) {
      recommendations.push('Network is currently experiencing issues')
    }

    if (status.latency > 5000) {
      recommendations.push('Network latency is high - transactions may be slow')
    }

    if (status.errors.length > 0) {
      recommendations.push(`Recent errors: ${status.errors.join(', ')}`)
    }

    const uptime = this.getUptimePercentage(chainId)
    if (uptime < 95) {
      recommendations.push('Network uptime is below 95%')
    }

    return recommendations.length > 0
      ? recommendations
      : ['Network is operating normally']
  }
}

// Singleton instance
export const networkHealthMonitor = new NetworkHealthMonitor()

