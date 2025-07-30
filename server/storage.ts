import { type User, type InsertUser, type Settings, type InsertSettings, type Signal, type InsertSignal, type PriceData, type InsertPriceData } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Settings methods
  getSettings(userId: string): Promise<Settings | undefined>;
  upsertSettings(settings: InsertSettings): Promise<Settings>;
  
  // Signal methods
  createSignal(signal: InsertSignal): Promise<Signal>;
  getRecentSignals(limit?: number): Promise<Signal[]>;
  
  // Price data methods
  savePriceData(data: InsertPriceData): Promise<PriceData>;
  getLatestPrice(symbol: string): Promise<PriceData | undefined>;
  getPriceHistory(symbol: string, timeframe: string, limit?: number): Promise<PriceData[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private settings: Map<string, Settings>;
  private signals: Map<string, Signal>;
  private priceData: Map<string, PriceData[]>;

  constructor() {
    this.users = new Map();
    this.settings = new Map();
    this.signals = new Map();
    this.priceData = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSettings(userId: string): Promise<Settings | undefined> {
    return Array.from(this.settings.values()).find(s => s.userId === userId);
  }

  async upsertSettings(insertSettings: InsertSettings): Promise<Settings> {
    const existing = await this.getSettings(insertSettings.userId);
    const id = existing?.id || randomUUID();
    const now = new Date();
    
    const settings: Settings = {
      ...insertSettings,
      id,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      twelveDataApiKey: insertSettings.twelveDataApiKey || null,
      telegramBotToken: insertSettings.telegramBotToken || null,
      telegramChatId: insertSettings.telegramChatId || null,
    };
    
    this.settings.set(id, settings);
    return settings;
  }

  async createSignal(insertSignal: InsertSignal): Promise<Signal> {
    const id = randomUUID();
    const signal: Signal = {
      ...insertSignal,
      id,
      createdAt: new Date(),
      sentToTelegram: insertSignal.sentToTelegram || false,
    };
    
    this.signals.set(id, signal);
    return signal;
  }

  async getRecentSignals(limit: number = 10): Promise<Signal[]> {
    const allSignals = Array.from(this.signals.values());
    return allSignals
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async savePriceData(insertData: InsertPriceData): Promise<PriceData> {
    const id = randomUUID();
    const data: PriceData = { 
      ...insertData, 
      id,
      volume: insertData.volume || null
    };
    
    const key = `${insertData.symbol}_${insertData.timeframe}`;
    if (!this.priceData.has(key)) {
      this.priceData.set(key, []);
    }
    
    const dataArray = this.priceData.get(key)!;
    dataArray.push(data);
    
    // Keep only last 1000 records per symbol/timeframe
    if (dataArray.length > 1000) {
      dataArray.splice(0, dataArray.length - 1000);
    }
    
    return data;
  }

  async getLatestPrice(symbol: string): Promise<PriceData | undefined> {
    const key = `${symbol}_M1`;
    const dataArray = this.priceData.get(key);
    if (!dataArray || dataArray.length === 0) return undefined;
    
    return dataArray[dataArray.length - 1];
  }

  async getPriceHistory(symbol: string, timeframe: string, limit: number = 100): Promise<PriceData[]> {
    const key = `${symbol}_${timeframe}`;
    const dataArray = this.priceData.get(key) || [];
    
    return dataArray
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
