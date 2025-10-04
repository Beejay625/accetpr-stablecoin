/**
 * Base BlockRadar HTTP client
 * Minimal HTTP request making to BlockRadar API
 */
export abstract class BlockRadarBase {
  protected static readonly API_URL = 'https://api.blockradar.co/v1';
  protected static readonly API_KEY = process.env.BLOCKRADAR_API_KEY;

  /**
   * Make HTTP request to BlockRadar API
   */
  static async request<T = any>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    
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
    
    const response = await fetch(`${this.API_URL}${endpoint}`, requestOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`BlockRadar API error ${response.status}: ${(errorData as any).message || response.statusText}`);
    }

    return await response.json() as T;
  }

  /**
   * Validate API key exists
   */
  static validateConfiguration(): void {
    if (!this.API_KEY) {
      throw new Error('BlockRadar API key not configured');
    }
  }
}