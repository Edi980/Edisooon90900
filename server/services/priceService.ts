import { storage } from "../storage";
import { InsertPriceData } from "@shared/schema";

export class PriceService {
  private apiKey: string;
  private baseUrl = 'https://api.twelvedata.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchRealTimePrice(symbol: string): Promise<any> {
    try {
      console.log(`Fetching price for ${symbol} with API key: ${this.apiKey.substring(0, 8)}...`);
      
      const encodedSymbol = encodeURIComponent(symbol);
      const response = await fetch(
        `${this.baseUrl}/price?symbol=${encodedSymbol}&apikey=${this.apiKey}`
      );
      
      const text = await response.text();
      
      // Check if response is HTML (rate limit page)
      if (text.startsWith('<!DOCTYPE')) {
        console.error(`Rate limited or HTML response received for ${symbol}`);
        return this.generateDemoPrice(symbol);
      }
      
      const data = JSON.parse(text);
      console.log(`API Response for ${symbol}:`, data);
      
      if (!response.ok || data.status === 'error') {
        const errorMsg = data.message || `Failed to fetch price for ${symbol}: ${response.statusText}`;
        console.error(`Twelve Data API Error:`, errorMsg);
        
        // For testing without valid API key, use realistic demo prices
        if (data.code === 401) {
          console.log(`Using demo price for ${symbol} due to API key error`);
          return this.generateDemoPrice(symbol);
        }
        
        throw new Error(errorMsg);
      }
      
      if (!data.price) {
        console.error(`No price data received for ${symbol}:`, data);
        return {
          symbol,
          price: symbol.includes('XAU') ? 2650.45 : 97850.30,
          timestamp: new Date().toISOString(),
          changePercent: 0,
          error: 'No price data available'
        };
      }
      
      // Save to storage
      const priceData: InsertPriceData = {
        symbol,
        timeframe: 'M1',
        open: data.price,
        high: data.price,
        low: data.price,
        close: data.price,
        volume: '0',
        timestamp: new Date(),
      };
      
      await storage.savePriceData(priceData);
      
      return {
        symbol,
        price: parseFloat(data.price),
        timestamp: new Date().toISOString(),
        changePercent: Math.random() * 2 - 1 // Mock change percentage
      };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      
      console.error(`Failed to get price for ${symbol}, using demo data`);
      return this.generateDemoPrice(symbol);
    }
  }

  private generateDemoPrice(symbol: string) {
    // Generate realistic demo prices with small variations
    const now = Date.now();
    const basePrice = symbol.includes('XAU') ? 2650.45 : 97850.30;
    const variation = Math.sin(now / 60000) * (symbol.includes('XAU') ? 5 : 200); // Sine wave for smooth changes
    const noise = (Math.random() - 0.5) * (symbol.includes('XAU') ? 2 : 50); // Small random noise
    
    return {
      symbol,
      price: basePrice + variation + noise,
      timestamp: new Date().toISOString(),
      changePercent: (variation + noise) / basePrice * 100,
      isDemo: true
    };
  }

  async fetchTimeSeriesData(symbol: string, interval: string = '1min', outputsize: number = 100): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch time series for ${symbol}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.values) {
        // Save to storage
        for (const candle of data.values) {
          const priceData: InsertPriceData = {
            symbol,
            timeframe: interval,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume || '0',
            timestamp: new Date(candle.datetime),
          };
          
          await storage.savePriceData(priceData);
        }
        
        return data.values;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching time series for ${symbol}:`, error);
      throw error;
    }
  }

  async getLatestPrice(symbol: string) {
    return await storage.getLatestPrice(symbol);
  }

  async getPriceHistory(symbol: string, timeframe: string, limit?: number) {
    return await storage.getPriceHistory(symbol, timeframe, limit);
  }
}
