import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { PriceService } from "./services/priceService";
import { StrategyService } from "./services/strategyService";
import { TelegramService } from "./services/telegramService";
import { SessionService } from "./services/sessionService";
import { insertSettingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const sessionService = new SessionService();
  let priceService: PriceService | null = null;
  let strategyService: StrategyService | null = null;
  let telegramService: TelegramService | null = null;

  // WebSocket connections
  const connections = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    connections.add(ws);
    console.log('WebSocket client connected');

    ws.on('close', () => {
      connections.delete(ws);
      console.log('WebSocket client disconnected');
    });

    // Send initial session status
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'session_status',
        data: sessionService.getSessionStatus()
      }));
    }
  });

  // Broadcast to all connected clients
  function broadcast(message: any) {
    const data = JSON.stringify(message);
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  // Initialize services with settings
  async function initializeServices() {
    const settings = await storage.getSettings('default');
    
    if (settings?.twelveDataApiKey) {
      priceService = new PriceService(settings.twelveDataApiKey);
      strategyService = new StrategyService();
      
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken && settings.telegramChatId) {
        telegramService = new TelegramService(botToken, settings.telegramChatId);
      }
    }
  }

  // Initialize services on startup
  await initializeServices();

  // Price monitoring and strategy scanning
  async function runMarketScanner() {
    if (!priceService || !strategyService) return;

    try {
      const symbols = ['XAU/USD', 'BTC/USD'];
      const currentSession = sessionService.getCurrentSession();
      
      for (const symbol of symbols) {
        // Fetch latest price
        const priceData = await priceService.fetchRealTimePrice(symbol);
        
        // Broadcast price update with proper structure
        broadcast({
          type: 'price_update',
          data: {
            symbol,
            ...priceData
          }
        });

        // Analyze strategies
        const detections = await strategyService.analyzeMarket(symbol);
        
        // Filter high probability setups
        const highProbSetups = detections.filter(d => d.probability >= 75);
        
        for (const detection of highProbSetups) {
          // Generate signal
          await strategyService.generateSignal(detection, symbol, currentSession);
          
          // Send to Telegram if configured
          if (telegramService) {
            const signal = {
              symbol,
              direction: detection.takeProfit > detection.entry ? 'BUY' : 'SELL',
              entryPrice: detection.entry.toString(),
              stopLoss: detection.stopLoss.toString(),
              takeProfit: detection.takeProfit.toString(),
              probability: detection.probability,
              strategies: [detection.name],
              confluences: detection.confluences,
              timeframe: detection.timeframe
            };
            
            await telegramService.sendSignal(signal);
          }
          
          // Broadcast strategy detection
          broadcast({
            type: 'strategy_detection',
            data: detection
          });
        }
      }
    } catch (error) {
      console.error('Market scanner error:', error);
    }
  }

  // Start market scanner (every 60 seconds for free tier)
  setInterval(runMarketScanner, 60000);
  
  // Session status updates (every minute)
  setInterval(() => {
    broadcast({
      type: 'session_status',
      data: sessionService.getSessionStatus()
    });
  }, 60000);

  // API Routes
  
  // Test Twelve Data API
  app.post("/api/twelvedata/test", async (req, res) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }
      
      const response = await fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent('XAU/USD')}&apikey=${apiKey}`);
      const text = await response.text();
      
      // Check if response is HTML (rate limit page)
      if (text.startsWith('<!DOCTYPE')) {
        return res.status(400).json({ error: "API rate limited. Try again later." });
      }
      
      const data = JSON.parse(text);
      
      if (data.status === 'error') {
        return res.status(400).json({ error: data.message });
      }
      
      if (data.price) {
        res.json({ success: true, message: `API working! XAU/USD price: ${data.price}`, price: data.price });
      } else {
        res.status(400).json({ error: "No price data received" });
      }
    } catch (error) {
      console.error('Twelve Data test error:', error);
      res.status(500).json({ error: "Failed to test API connection" });
    }
  });
  
  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings('default');
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update settings
  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse({
        ...req.body,
        userId: 'default'
      });
      
      const settings = await storage.upsertSettings(validatedData);
      
      // Reinitialize services with new settings
      await initializeServices();
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to save settings" });
      }
    }
  });

  // Test Telegram connection
  app.post("/api/telegram/test", async (req, res) => {
    try {
      const settings = await storage.getSettings('default');
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      
      if (!botToken) {
        return res.status(400).json({ error: "Telegram Bot Token not configured in environment" });
      }
      
      if (!settings?.telegramChatId) {
        return res.status(400).json({ error: "Telegram Chat ID not configured in settings" });
      }
      
      const telegram = new TelegramService(botToken, settings.telegramChatId);
      const success = await telegram.sendTestMessage();
      
      if (success) {
        res.json({ success: true, message: "Test message sent successfully" });
      } else {
        res.status(400).json({ error: "Failed to send test message" });
      }
    } catch (error) {
      console.error('Telegram test error:', error);
      res.status(500).json({ error: "Failed to test Telegram connection" });
    }
  });

  // Get recent signals
  app.get("/api/signals", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const signals = await storage.getRecentSignals(limit);
      res.json(signals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch signals" });
    }
  });

  // Get price history
  app.get("/api/prices/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { timeframe = 'M1', limit = 100 } = req.query;
      
      const priceHistory = await storage.getPriceHistory(
        symbol.toUpperCase(),
        timeframe as string,
        parseInt(limit as string)
      );
      
      res.json(priceHistory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price history" });
    }
  });

  // Get current session info
  app.get("/api/session", (req, res) => {
    try {
      const sessionStatus = sessionService.getSessionStatus();
      const nextChange = sessionService.getNextSessionChange();
      const isHighVol = sessionService.isHighVolatilityPeriod();
      
      res.json({
        ...sessionStatus,
        nextChange,
        isHighVolatilityPeriod: isHighVol
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session info" });
    }
  });

  // Manual strategy scan
  app.post("/api/scan", async (req, res) => {
    try {
      if (!strategyService) {
        return res.status(400).json({ error: "Strategy service not initialized. Please configure API keys first." });
      }

      const { symbol = 'XAUUSD' } = req.body;
      const detections = await strategyService.analyzeMarket(symbol);
      
      res.json(detections);
    } catch (error) {
      res.status(500).json({ error: "Failed to run strategy scan" });
    }
  });

  return httpServer;
}
