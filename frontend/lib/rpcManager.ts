/**
 * Custom RPC Endpoint Management
 * Manage custom RPC endpoints for different chains
 */

export interface RPCEndpoint {
  id: string
  chainId: number
  chainName: string
  url: string
  name: string
  isCustom: boolean
  isActive: boolean
  priority: number
  timeout: number
  lastChecked?: number
  isHealthy?: boolean
}

export interface RPCHealthCheck {
  endpointId: string
  timestamp: number
  responseTime: number
  success: boolean
  error?: string
}

class RPCManager {
  private endpoints: Map<string, RPCEndpoint> = new Map()
  private healthChecks: RPCHealthCheck[] = []
  private storageKey = 'rpc_endpoints'
  private defaultEndpoints: RPCEndpoint[] = [
    {
      id: 'base_mainnet',
      chainId: 8453,
      chainName: 'Base',
      url: 'https://mainnet.base.org',
      name: 'Base Official',
      isCustom: false,
      isActive: true,
      priority: 1,
      timeout: 5000,
    },
    {
      id: 'arbitrum_mainnet',
      chainId: 42161,
      chainName: 'Arbitrum',
      url: 'https://arb1.arbitrum.io/rpc',
      name: 'Arbitrum Official',
      isCustom: false,
      isActive: true,
      priority: 1,
      timeout: 5000,
    },
  ]

  constructor() {
    this.initializeDefaults()
    this.loadEndpoints()
  }

  /**
   * Initialize default endpoints
   */
  private initializeDefaults(): void {
    this.defaultEndpoints.forEach(endpoint => {
      this.endpoints.set(endpoint.id, endpoint)
    })
  }

  /**
   * Add custom RPC endpoint
   */
  addEndpoint(endpoint: Omit<RPCEndpoint, 'id' | 'isCustom'>): string {
    const id = `rpc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullEndpoint: RPCEndpoint = {
      ...endpoint,
      id,
      isCustom: true,
    }

    this.endpoints.set(id, fullEndpoint)
    this.saveEndpoints()
    return id
  }

  /**
   * Get endpoint by ID
   */
  getEndpoint(id: string): RPCEndpoint | undefined {
    return this.endpoints.get(id)
  }

  /**
   * Get endpoints for a chain
   */
  getEndpointsForChain(chainId: number): RPCEndpoint[] {
    return Array.from(this.endpoints.values())
      .filter(e => e.chainId === chainId && e.isActive)
      .sort((a, b) => a.priority - b.priority)
  }

  /**
   * Get primary endpoint for a chain
   */
  getPrimaryEndpoint(chainId: number): RPCEndpoint | undefined {
    const endpoints = this.getEndpointsForChain(chainId)
    return endpoints[0]
  }

  /**
   * Update endpoint
   */
  updateEndpoint(id: string, updates: Partial<RPCEndpoint>): boolean {
    const endpoint = this.endpoints.get(id)
    if (!endpoint) return false

    this.endpoints.set(id, { ...endpoint, ...updates })
    this.saveEndpoints()
    return true
  }

  /**
   * Delete endpoint (only custom endpoints)
   */
  deleteEndpoint(id: string): boolean {
    const endpoint = this.endpoints.get(id)
    if (!endpoint || !endpoint.isCustom) return false

    this.endpoints.delete(id)
    this.saveEndpoints()
    return true
  }

  /**
   * Test RPC endpoint
   */
  async testEndpoint(id: string): Promise<RPCHealthCheck> {
    const endpoint = this.endpoints.get(id)
    if (!endpoint) {
      throw new Error('Endpoint not found')
    }

    const startTime = Date.now()
    const check: RPCHealthCheck = {
      endpointId: id,
      timestamp: Date.now(),
      responseTime: 0,
      success: false,
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout)

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        check.success = !!data.result
        check.responseTime = Date.now() - startTime

        // Update endpoint health
        this.updateEndpoint(id, {
          isHealthy: check.success,
          lastChecked: Date.now(),
        })
      } else {
        check.error = `HTTP ${response.status}`
      }
    } catch (error) {
      check.error = error instanceof Error ? error.message : 'Unknown error'
      check.responseTime = Date.now() - startTime
    }

    this.healthChecks.push(check)
    return check
  }

  /**
   * Check all endpoints for a chain
   */
  async checkChainEndpoints(chainId: number): Promise<RPCHealthCheck[]> {
    const endpoints = this.getEndpointsForChain(chainId)
    const checks = await Promise.all(
      endpoints.map(e => this.testEndpoint(e.id))
    )
    return checks
  }

  /**
   * Get health check history
   */
  getHealthCheckHistory(endpointId?: string): RPCHealthCheck[] {
    if (endpointId) {
      return this.healthChecks.filter(check => check.endpointId === endpointId)
    }
    return [...this.healthChecks]
  }

  /**
   * Get all endpoints
   */
  getAllEndpoints(): RPCEndpoint[] {
    return Array.from(this.endpoints.values())
  }

  /**
   * Save endpoints to localStorage
   */
  private saveEndpoints(): void {
    if (typeof window === 'undefined') return
    try {
      const customEndpoints = Array.from(this.endpoints.values()).filter(
        e => e.isCustom
      )
      localStorage.setItem(this.storageKey, JSON.stringify(customEndpoints))
    } catch (error) {
      console.error('Failed to save endpoints:', error)
    }
  }

  /**
   * Load endpoints from localStorage
   */
  private loadEndpoints(): void {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const customEndpoints: RPCEndpoint[] = JSON.parse(stored)
        customEndpoints.forEach(endpoint => {
          this.endpoints.set(endpoint.id, endpoint)
        })
      }
    } catch (error) {
      console.error('Failed to load endpoints:', error)
    }
  }
}

// Singleton instance
export const rpcManager = new RPCManager()

