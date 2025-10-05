/**
 * Base BlockRadar HTTP client
 * Minimal HTTP request making to BlockRadar API
 */
export class BlockRadarBase {
  static readonly API_URL = 'https://api.blockradar.co/v1';
  static readonly API_KEY = process.env['BLOCKRADAR_API_KEY'];
  static readonly WALLET_ID = process.env['BLOCKRADAR_WALLET_ID'];

  /**
   * Validate configuration
   */
  static validateConfiguration(): void {
    if (!this.API_KEY) {
      throw new Error('BLOCKRADAR_API_KEY is required');
    }
    if (!this.WALLET_ID) {
      throw new Error('BLOCKRADAR_WALLET_ID is required');
    }
  }

  /**
   * Make HTTP request to BlockRadar API
   * Automatically prepends wallet ID to all requests
   */
  static async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    this.validateConfiguration();
    
    // Remove leading slash if present and prepend wallet ID
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const fullEndpoint = `/wallets/${this.WALLET_ID}/${cleanEndpoint}`;
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.API_KEY!,
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