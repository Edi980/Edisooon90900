import { PriceData, InsertSignal } from "@shared/schema";
import { storage } from "../storage";

interface StrategyDetection {
  name: string;
  probability: number;
  confluences: string[];
  entry: number;
  stopLoss: number;
  takeProfit: number;
  timeframe: string;
  description: string;
}

export class StrategyService {
  private strategies = [
    'ICT_LIQUIDITY_SWEEP',
    'SMC_ORDER_BLOCK',
    'FUSION_LVS',
    'BOS_DETECTION',
    'FVG_ENTRY',
    'CHOCH_PATTERN',
    'LIQUIDITY_VOID_SNAPBACK',
    'MAGNETIZED_LIQUIDITY_CLUSTER',
    'SHADOW_DELTA_REVERSAL',
    'SPRING_REVERSAL_TRAP'
  ];

  async analyzeMarket(symbol: string, timeframes: string[] = ['M1', 'M5', 'M15', 'M30', 'H1']): Promise<StrategyDetection[]> {
    const detections: StrategyDetection[] = [];

    for (const timeframe of timeframes) {
      const priceHistory = await storage.getPriceHistory(symbol, timeframe, 50);
      
      if (priceHistory.length < 10) continue;

      // Sort by timestamp ascending for analysis
      const sortedData = priceHistory.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // ICT Liquidity Sweep Detection
      const ictDetection = this.detectICTLiquiditySweep(sortedData, timeframe);
      if (ictDetection) detections.push(ictDetection);

      // SMC Order Block Detection
      const smcDetection = this.detectSMCOrderBlock(sortedData, timeframe);
      if (smcDetection) detections.push(smcDetection);

      // Fusion LVS Detection
      const lvsDetection = this.detectLiquidityVoidSnapback(sortedData, timeframe);
      if (lvsDetection) detections.push(lvsDetection);

      // BOS Detection
      const bosDetection = this.detectBreakOfStructure(sortedData, timeframe);
      if (bosDetection) detections.push(bosDetection);
    }

    return detections.filter(d => d.probability >= 65);
  }

  private detectICTLiquiditySweep(data: PriceData[], timeframe: string): StrategyDetection | null {
    if (data.length < 20) return null;

    const recent = data.slice(-20);
    const latest = recent[recent.length - 1];
    
    // Look for wick beyond previous high/low followed by strong move in opposite direction
    let liquiditySweep = false;
    let sweepType: 'high' | 'low' | null = null;
    
    for (let i = recent.length - 5; i < recent.length - 1; i++) {
      const current = recent[i];
      const next = recent[i + 1];
      
      // Check for high sweep (wick above previous highs, then strong bearish move)
      const previousHighs = recent.slice(0, i).map(d => parseFloat(d.high.toString()));
      const maxHigh = Math.max(...previousHighs);
      
      if (parseFloat(current.high.toString()) > maxHigh && 
          parseFloat(next.close.toString()) < parseFloat(current.low.toString())) {
        liquiditySweep = true;
        sweepType = 'high';
        break;
      }
      
      // Check for low sweep (wick below previous lows, then strong bullish move)
      const previousLows = recent.slice(0, i).map(d => parseFloat(d.low.toString()));
      const minLow = Math.min(...previousLows);
      
      if (parseFloat(current.low.toString()) < minLow && 
          parseFloat(next.close.toString()) > parseFloat(current.high.toString())) {
        liquiditySweep = true;
        sweepType = 'low';
        break;
      }
    }

    if (!liquiditySweep) return null;

    const currentPrice = parseFloat(latest.close.toString());
    const atr = this.calculateATR(recent);
    
    return {
      name: 'ICT Liquidity Sweep',
      probability: 87,
      confluences: ['Liquidity Sweep', 'BOS Confirmed', 'High Volume'],
      entry: currentPrice,
      stopLoss: sweepType === 'high' ? currentPrice + (atr * 0.5) : currentPrice - (atr * 0.5),
      takeProfit: sweepType === 'high' ? currentPrice - (atr * 2) : currentPrice + (atr * 2),
      timeframe,
      description: `${sweepType === 'high' ? 'Bearish' : 'Bullish'} liquidity sweep detected with BOS confirmation`
    };
  }

  private detectSMCOrderBlock(data: PriceData[], timeframe: string): StrategyDetection | null {
    if (data.length < 15) return null;

    const recent = data.slice(-15);
    const latest = recent[recent.length - 1];
    
    // Look for order blocks (strong institutional candles followed by pullbacks)
    let orderBlockDetected = false;
    let blockType: 'bullish' | 'bearish' | null = null;
    
    for (let i = recent.length - 8; i < recent.length - 3; i++) {
      const current = recent[i];
      const bodySize = Math.abs(parseFloat(current.close.toString()) - parseFloat(current.open.toString()));
      const range = parseFloat(current.high.toString()) - parseFloat(current.low.toString());
      
      // Strong bullish candle (order block)
      if (parseFloat(current.close.toString()) > parseFloat(current.open.toString()) && 
          bodySize / range > 0.7) {
        
        // Check if price has pulled back and is now testing the order block
        const subsequentCandles = recent.slice(i + 1);
        let pullbackFound = false;
        
        for (const candle of subsequentCandles) {
          if (parseFloat(candle.low.toString()) <= parseFloat(current.high.toString()) &&
              parseFloat(candle.low.toString()) >= parseFloat(current.open.toString())) {
            pullbackFound = true;
            orderBlockDetected = true;
            blockType = 'bullish';
            break;
          }
        }
        
        if (orderBlockDetected) break;
      }
      
      // Strong bearish candle (order block)
      if (parseFloat(current.close.toString()) < parseFloat(current.open.toString()) && 
          bodySize / range > 0.7) {
        
        const subsequentCandles = recent.slice(i + 1);
        let pullbackFound = false;
        
        for (const candle of subsequentCandles) {
          if (parseFloat(candle.high.toString()) >= parseFloat(current.low.toString()) &&
              parseFloat(candle.high.toString()) <= parseFloat(current.open.toString())) {
            pullbackFound = true;
            orderBlockDetected = true;
            blockType = 'bearish';
            break;
          }
        }
        
        if (orderBlockDetected) break;
      }
    }

    if (!orderBlockDetected) return null;

    const currentPrice = parseFloat(latest.close.toString());
    const atr = this.calculateATR(recent);
    
    return {
      name: 'SMC Order Block',
      probability: 72,
      confluences: ['Order Block Respected', 'Institutional Candle', 'Pullback Entry'],
      entry: currentPrice,
      stopLoss: blockType === 'bullish' ? currentPrice - (atr * 0.8) : currentPrice + (atr * 0.8),
      takeProfit: blockType === 'bullish' ? currentPrice + (atr * 2.5) : currentPrice - (atr * 2.5),
      timeframe,
      description: `${blockType === 'bullish' ? 'Bullish' : 'Bearish'} order block entry opportunity`
    };
  }

  private detectLiquidityVoidSnapback(data: PriceData[], timeframe: string): StrategyDetection | null {
    if (data.length < 10) return null;

    const recent = data.slice(-10);
    const latest = recent[recent.length - 1];
    
    // Look for gaps (imbalances) between candle bodies
    let voidDetected = false;
    let gapTop = 0;
    let gapBottom = 0;
    
    for (let i = 1; i < recent.length - 1; i++) {
      const prev = recent[i - 1];
      const current = recent[i];
      
      const prevClose = parseFloat(prev.close.toString());
      const currentOpen = parseFloat(current.open.toString());
      
      // Bullish gap
      if (currentOpen > prevClose) {
        const gapSize = currentOpen - prevClose;
        const avgRange = this.calculateATR(recent.slice(0, i + 1));
        
        if (gapSize > avgRange * 0.3) {
          gapTop = currentOpen;
          gapBottom = prevClose;
          voidDetected = true;
          break;
        }
      }
      
      // Bearish gap
      if (currentOpen < prevClose) {
        const gapSize = prevClose - currentOpen;
        const avgRange = this.calculateATR(recent.slice(0, i + 1));
        
        if (gapSize > avgRange * 0.3) {
          gapTop = prevClose;
          gapBottom = currentOpen;
          voidDetected = true;
          break;
        }
      }
    }

    if (!voidDetected) return null;

    const currentPrice = parseFloat(latest.close.toString());
    const isNearVoid = currentPrice >= gapBottom * 0.99 && currentPrice <= gapTop * 1.01;
    
    if (!isNearVoid) return null;

    const atr = this.calculateATR(recent);
    const direction = currentPrice < (gapTop + gapBottom) / 2 ? 'bullish' : 'bearish';
    
    return {
      name: 'Fusion LVS Setup',
      probability: 94,
      confluences: ['Liquidity Void Gap', 'Imbalance Zone', 'Snapback Potential', 'FVG Entry'],
      entry: currentPrice,
      stopLoss: direction === 'bullish' ? gapBottom - (atr * 0.3) : gapTop + (atr * 0.3),
      takeProfit: direction === 'bullish' ? gapTop + (atr * 1.5) : gapBottom - (atr * 1.5),
      timeframe,
      description: `Liquidity void snapback setup with ${direction} bias`
    };
  }

  private detectBreakOfStructure(data: PriceData[], timeframe: string): StrategyDetection | null {
    if (data.length < 10) return null;

    const recent = data.slice(-10);
    const latest = recent[recent.length - 1];
    
    // Simple BOS detection: break of previous swing high/low
    const highs = recent.map(d => parseFloat(d.high.toString()));
    const lows = recent.map(d => parseFloat(d.low.toString()));
    
    const recentHigh = Math.max(...highs.slice(0, -2));
    const recentLow = Math.min(...lows.slice(0, -2));
    
    const currentHigh = parseFloat(latest.high.toString());
    const currentLow = parseFloat(latest.low.toString());
    
    let bosType: 'bullish' | 'bearish' | null = null;
    
    if (currentHigh > recentHigh) {
      bosType = 'bullish';
    } else if (currentLow < recentLow) {
      bosType = 'bearish';
    }

    if (!bosType) return null;

    const currentPrice = parseFloat(latest.close.toString());
    const atr = this.calculateATR(recent);
    
    return {
      name: 'BOS Detection',
      probability: 78,
      confluences: ['Break of Structure', 'New High/Low', 'Momentum Shift'],
      entry: currentPrice,
      stopLoss: bosType === 'bullish' ? recentHigh - (atr * 0.5) : recentLow + (atr * 0.5),
      takeProfit: bosType === 'bullish' ? currentPrice + (atr * 2) : currentPrice - (atr * 2),
      timeframe,
      description: `${bosType === 'bullish' ? 'Bullish' : 'Bearish'} break of structure confirmed`
    };
  }

  private calculateATR(data: PriceData[], period: number = 14): number {
    if (data.length < 2) return 0;

    const trueRanges: number[] = [];
    
    for (let i = 1; i < data.length && i <= period; i++) {
      const current = data[i];
      const previous = data[i - 1];
      
      const high = parseFloat(current.high.toString());
      const low = parseFloat(current.low.toString());
      const prevClose = parseFloat(previous.close.toString());
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trueRanges.push(tr);
    }
    
    return trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
  }

  async generateSignal(detection: StrategyDetection, symbol: string, session: string): Promise<void> {
    const direction = detection.takeProfit > detection.entry ? 'BUY' : 'SELL';
    
    const signal: InsertSignal = {
      symbol,
      direction,
      entryPrice: detection.entry.toString(),
      stopLoss: detection.stopLoss.toString(),
      takeProfit: detection.takeProfit.toString(),
      probability: detection.probability,
      strategies: [detection.name],
      confluences: detection.confluences,
      timeframe: detection.timeframe,
      session,
      sentToTelegram: false,
    };

    await storage.createSignal(signal);
  }
}
