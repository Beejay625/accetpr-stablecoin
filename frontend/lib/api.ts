const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  timestamp?: string
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  }

  async post<T>(endpoint: string, data: any, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  }

  async put<T>(endpoint: string, data: any, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  }

  async delete<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  }
}

// Wallet API methods
export const walletApi = {
  getBalance: async (chain: string, token: string) => {
    const client = new ApiClient()
    return client.get<{
      balance: string
      chain: string
      asset: string
      userId: string
      timestamp: string
    }>(`/protected/wallet/balance?chain=${chain}`, token)
  },

  getTransactions: async (chain: string, token: string) => {
    const client = new ApiClient()
    return client.get<{
      transactions: Array<{
        transactionId: string
        hash: string
        asset: string
        chain: string
        reference: string | null
        amountPaid: string
        status: string
        transactionTime: string
      }>
      count: number
      chain: string
    }>(`/protected/wallet/transactions/${chain}`, token)
  },

  withdrawSingle: async (
    chain: string,
    asset: string,
    amount: string,
    address: string,
    token: string,
    metadata?: Record<string, any>,
    reference?: string
  ) => {
    const client = new ApiClient()
    return client.post<{
      transactionId: string
      hash: string
      status: string
      amount: string
      recipientAddress: string
      asset: string
      chain: string
    }>(
      '/protected/wallet/withdraw/single',
      {
        chain,
        asset,
        amount,
        address,
        metadata,
        reference,
      },
      token
    )
  },

  withdrawBatch: async (assets: Array<{
    chain: string
    asset: string
    amount: string
    address: string
    metadata?: Record<string, any>
    reference?: string
  }>, token: string) => {
    const client = new ApiClient()
    return client.post<{
      transactionId: string
      hash: string
      status: string
      totalAmount: string
      assetCount: number
      chains: string[]
    }>(
      '/protected/wallet/withdraw/batch',
      { assets },
      token
    )
  },
}

export default new ApiClient()

