/**
 * Price API Client
 * 
 * Fetches TCG card prices from Cardmarket and TCGPlayer APIs.
 * Supports multiple price sources for resilience.
 */

import type { CardPrice } from './types';

export interface PriceSource {
  name: string;
  fetchPrice(cardName: string, setName: string): Promise<CardPrice | null>;
}

/**
 * Cardmarket API client
 * Documentation: https://www.cardmarket.com/en/Magic/Api
 */
export class CardmarketPriceSource implements PriceSource {
  name = 'Cardmarket';
  private apiKey: string;
  private baseUrl = 'https://api.cardmarket.com/v1.0.0';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchPrice(cardName: string, setName: string): Promise<CardPrice | null> {
    try {
      // Search for the product
      const searchUrl = `${this.baseUrl}/products/find`;
      const searchParams = new URLSearchParams({
        search: cardName,
        exact: 'false',
        game: '6', // Magic: The Gathering (generic game ID)
      });

      const searchResponse = await fetch(`${searchUrl}?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!searchResponse.ok) {
        console.warn(`Cardmarket search failed for "${cardName}": ${searchResponse.status}`);
        return null;
      }

      const searchData = await searchResponse.json() as { product?: { idProduct: number } };
      if (!searchData.product) {
        console.warn(`Cardmarket product not found for "${cardName}"`);
        return null;
      }

      // Get price data
      const priceUrl = `${this.baseUrl}/products/${searchData.product.idProduct}/prices`;
      const priceResponse = await fetch(priceUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!priceResponse.ok) {
        console.warn(`Cardmarket price fetch failed: ${priceResponse.status}`);
        return null;
      }

      const priceData = await priceResponse.json() as {
        avg?: number;
        low?: number;
        high?: number;
        trend?: number;
      };

      return {
        market: priceData.avg,
        low: priceData.low,
        high: priceData.high,
        mid: priceData.trend,
      };
    } catch (error) {
      console.error(`Cardmarket API error for "${cardName}":`, error);
      return null;
    }
  }
}

/**
 * TCGPlayer API client
 * Documentation: https://docs.tcgplayer.com/docs
 * 
 * Note: TCGPlayer API requires authentication and has specific terms of service.
 * This implementation provides a template for integration.
 */
export class TCGPlayerPriceSource implements PriceSource {
  name = 'TCGPlayer';
  private publicKey: string;
  private privateKey: string;
  private baseUrl = 'https://api.tcgplayer.com/v1.32.0';

  constructor(publicKey: string, privateKey: string) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  private async getAuthToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.publicKey,
        client_secret: this.privateKey,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`TCGPlayer auth failed: ${response.statusText}`);
    }

    const data = await response.json() as { access_token: string };
    return data.access_token;
  }

  async fetchPrice(cardName: string, setName: string): Promise<CardPrice | null> {
    try {
      const token = await this.getAuthToken();

      // Search for product
      const searchUrl = `${this.baseUrl}/search/products`;
      const searchParams = new URLSearchParams({
        q: `${cardName} ${setName}`,
        limit: '1',
      });

      const searchResponse = await fetch(`${searchUrl}?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!searchResponse.ok) {
        console.warn(`TCGPlayer search failed: ${searchResponse.status}`);
        return null;
      }

      const searchData = await searchResponse.json() as {
        results?: Array<{ productId: number }>;
      };

      if (!searchData.results || searchData.results.length === 0) {
        console.warn(`TCGPlayer product not found for "${cardName}"`);
        return null;
      }

      const productId = searchData.results[0].productId;

      // Get pricing data
      const pricingUrl = `${this.baseUrl}/pricing/product/${productId}`;
      const pricingResponse = await fetch(pricingUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!pricingResponse.ok) {
        console.warn(`TCGPlayer pricing fetch failed: ${pricingResponse.status}`);
        return null;
      }

      const pricingData = await pricingResponse.json() as {
        results?: Array<{
          lowPrice?: number;
          midPrice?: number;
          highPrice?: number;
          marketPrice?: number;
        }>;
      };

      if (!pricingData.results || pricingData.results.length === 0) {
        return null;
      }

      const pricing = pricingData.results[0];
      return {
        low: pricing.lowPrice,
        mid: pricing.midPrice,
        high: pricing.highPrice,
        market: pricing.marketPrice,
      };
    } catch (error) {
      console.error(`TCGPlayer API error for "${cardName}":`, error);
      return null;
    }
  }
}

/**
 * Placeholder/Mock price source for testing
 */
export class MockPriceSource implements PriceSource {
  name = 'Mock';

  async fetchPrice(cardName: string): Promise<CardPrice | null> {
    // Generate consistent mock prices based on card name
    const hash = [...cardName].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = 0.5 + ((hash % 100) / 100) * 3;

    return {
      market: parseFloat(basePrice.toFixed(2)),
      low: parseFloat((basePrice * 0.7).toFixed(2)),
      mid: parseFloat((basePrice * 0.9).toFixed(2)),
      high: parseFloat((basePrice * 1.3).toFixed(2)),
    };
  }
}

/**
 * Price API manager - coordinates between multiple price sources
 */
export class PriceAPIManager {
  private sources: PriceSource[] = [];
  private cache: Map<string, CardPrice> = new Map();

  addSource(source: PriceSource): void {
    this.sources.push(source);
  }

  /**
   * Fetch price from the first available source
   */
  async fetchPrice(cardName: string, setName: string): Promise<CardPrice | null> {
    const cacheKey = `${cardName}|${setName}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) ?? null;
    }

    // Try each source in order
    for (const source of this.sources) {
      try {
        console.log(`Fetching price from ${source.name} for "${cardName}" from set "${setName}"...`);
        const price = await source.fetchPrice(cardName, setName);
        if (price) {
          this.cache.set(cacheKey, price);
          return price;
        }
      } catch (error) {
        console.warn(`${source.name} failed:`, error);
        continue;
      }
    }

    console.warn(`No price sources available for "${cardName}"`);
    return null;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default PriceAPIManager;
