import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Timeframe, StrategyDetection } from '@/types/trading';
import { Play, TrendingUp, Crosshair } from 'lucide-react';

interface ChartViewProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  strategies: StrategyDetection[];
  lastUpdate?: string;
}

export function ChartView({ selectedSymbol, onSymbolChange, strategies, lastUpdate }: ChartViewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('M5');
  const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

  // Mock candlestick data for visualization
  const mockCandles = Array.from({ length: 50 }, (_, i) => ({
    x: i,
    height: Math.random() * 40 + 20,
    type: Math.random() > 0.5 ? 'bullish' : 'bearish'
  }));

  return (
    <div className="space-y-4">
      {/* Timeframe and Symbol Selector */}
      <Card className="bg-dark-600 border-b border-dark-400 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {timeframes.map(tf => (
              <Button
                key={tf}
                variant={selectedTimeframe === tf ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe(tf)}
                className={
                  selectedTimeframe === tf 
                    ? "bg-bullish text-white hover:bg-green-600" 
                    : "bg-dark-500 text-dark-200 hover:bg-bullish hover:text-white border-dark-400"
                }
              >
                {tf}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-dark-200">Symbol:</span>
              <Select value={selectedSymbol} onValueChange={onSymbolChange}>
                <SelectTrigger className="w-24 bg-dark-500 border-dark-400 text-dark-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XAUUSD">XAU/USD</SelectItem>
                  <SelectItem value="BTCUSD">BTC/USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              size="sm"
              className="bg-bullish hover:bg-green-600 text-white"
            >
              <Play className="w-3 h-3 mr-1" />
              Auto Scan
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Chart Area */}
      <Card className="bg-dark-600 border-dark-400">
        <div className="p-4 border-b border-dark-400">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-dark-100">
              {selectedSymbol} - {selectedTimeframe} Chart
            </h3>
            <div className="flex items-center space-x-2 text-xs text-dark-200">
              <span>Last Update: <span className="text-bullish">{lastUpdate || '--:--:--'}</span></span>
            </div>
          </div>
        </div>
        
        {/* Chart Canvas */}
        <div className="h-96 bg-dark-700 m-4 rounded-lg border border-dark-400 relative overflow-hidden">
          {/* Mock Chart Visualization */}
          <div className="absolute inset-4 flex items-end space-x-1">
            {mockCandles.map((candle, i) => (
              <div
                key={i}
                className={`w-2 rounded-sm ${
                  candle.type === 'bullish' ? 'bg-bullish' : 'bg-bearish'
                }`}
                style={{ height: `${candle.height}px` }}
              />
            ))}
          </div>
          
          {/* Strategy Overlay Indicators */}
          <div className="absolute top-4 left-4 space-y-2">
            {strategies.slice(0, 2).map((strategy, i) => (
              <Badge
                key={i}
                className={`${
                  strategy.probability >= 90
                    ? 'bg-bullish/20 border-bullish text-bullish'
                    : strategy.probability >= 80
                    ? 'bg-warning/20 border-warning text-warning'
                    : 'bg-bearish/20 border-bearish text-bearish'
                }`}
              >
                {strategy.probability >= 90 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <Crosshair className="w-3 h-3 mr-1" />
                )}
                {strategy.name} - {strategy.probability}%
              </Badge>
            ))}
          </div>
          
          {/* Price Levels */}
          <div className="absolute right-4 top-1/4 text-xs font-mono space-y-1">
            <div className="bg-bearish/20 text-bearish px-2 py-1 rounded">
              {selectedSymbol.includes('XAU') ? '2052.30' : '44250.50'}
            </div>
            <div className="bg-dark-500 text-dark-200 px-2 py-1 rounded">
              {selectedSymbol.includes('XAU') ? '2048.75' : '43789.50'}
            </div>
            <div className="bg-bullish/20 text-bullish px-2 py-1 rounded">
              {selectedSymbol.includes('XAU') ? '2045.20' : '43320.00'}
            </div>
          </div>

          {/* Chart unavailable message */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-dark-300">
              <div className="text-sm font-medium mb-1">Chart Integration Ready</div>
              <div className="text-xs">Configure API key to enable real-time charts</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
