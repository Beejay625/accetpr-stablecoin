import { env } from '../../config/env';

/**
 * Base BlockRadar HTTP client
 * Minimal HTTP request making to BlockRadar API
 */
export class BlockRadarBase {
  static readonly API_URL = 'https://api.blockradar.co/v1';

  /**
   * Validate API key
   */
  static validateApiKey(): void {
    if (!env.BLOCKRADAR_API_KEY) {
      throw new Error('BLOCKRADAR_API_KEY is required');
    }
  }

  /**
   * Make HTTP request to BlockRadar API (with wallet ID)
   * @param walletId - The wallet ID to use for the request
   * @param endpoint - The API endpoint
   * @param method - HTTP method
   * @param body - Request body
   */
  static async request(walletId: string, endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    this.validateApiKey();
    
    // Remove leading slash if present and prepend wallet ID
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const fullEndpoint = `/wallets/${walletId}/${cleanEndpoint}`;
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.BLOCKRADAR_API_KEY as string,
      },
    };

    if (body !== undefined) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.API_URL}${fullEndpoint}`, requestOptions);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(`BlockRadar API error ${response.status}: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Make HTTP request to BlockRadar API (without wallet ID - for public endpoints like /assets)
   * @param endpoint - The API endpoint
   * @param method - HTTP method
   * @param body - Request body
   */
  static async requestPublic(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    this.validateApiKey();
    
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const fullEndpoint = `/${cleanEndpoint}`;
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.BLOCKRADAR_API_KEY as string,
      },
    };

    if (body !== undefined) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.API_URL}${fullEndpoint}`, requestOptions);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(`BlockRadar API error ${response.status}: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  }
}