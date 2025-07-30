export interface PriceData {
  symbol: string;
  price: number;
  timestamp: string;
  change?: number;
  changePercent?: number;
}

export interface StrategyDetection {
  name: string;
  probability: number;
  confluences: string[];
  entry: number;
  stopLoss: number;
  takeProfit: number;
  timeframe: string;
  description: string;
  symbol?: string;
}

export interface Signal {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  probability: number;
  strategies: string[];
  confluences: string[];
  timeframe: string;
  session: string;
  sentToTelegram: boolean;
  createdAt: string;
}

export interface Settings {
  id?: string;
  userId: string;
  twelveDataApiKey?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  minProbability?: number;
  activeStrategies?: string[];
  activeSessions?: string[];
  notificationPrefs?: {
    entries: boolean;
    exits: boolean;
    alerts: boolean;
    summaries: boolean;
  };
}

export interface SessionStatus {
  current: 'LONDON' | 'NY' | 'ASIA';
  london: { active: boolean; status: string };
  ny: { active: boolean; status: string };
  asia: { active: boolean; status: string };
  nextChange?: {
    session: 'LONDON' | 'NY' | 'ASIA';
    timeUntil: number;
  };
  isHighVolatilityPeriod?: boolean;
}

export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';
