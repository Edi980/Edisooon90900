import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StrategyDetection } from '@/types/trading';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';

interface StrategyPanelProps {
  strategies: StrategyDetection[];
}

export function StrategyPanel({ strategies }: StrategyPanelProps) {
  const getProbabilityColor = (probability: number) => {
    if (probability >= 90) return 'text-bullish';
    if (probability >= 80) return 'text-warning';
    return 'text-bearish';
  };

  const getProbabilityBg = (probability: number) => {
    if (probability >= 90) return 'bg-bullish/10 border-bullish';
    if (probability >= 80) return 'bg-warning/10 border-warning';
    return 'bg-bearish/10 border-bearish';
  };

  return (
    <Card className="bg-dark-600 border-dark-400 p-4">
      <h3 className="font-semibold text-dark-100 mb-3">
        <Target className="inline w-4 h-4 mr-2 text-bullish" />
        Setup Detection
      </h3>
      
      <div className="space-y-3">
        {strategies.length === 0 ? (
          <div className="text-center py-8 text-dark-300">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active setups detected</p>
            <p className="text-xs">Scanner running...</p>
          </div>
        ) : (
          strategies.slice(0, 3).map((strategy, index) => {
            const direction = strategy.takeProfit > strategy.entry ? 'BUY' : 'SELL';
            const isBullish = direction === 'BUY';
            
            return (
              <div key={index} className={`rounded-lg p-3 border ${getProbabilityBg(strategy.probability)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {isBullish ? (
                      <TrendingUp className="w-4 h-4 mr-2 text-bullish" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-2 text-bearish" />
                    )}
                    <span className={`text-sm font-medium ${getProbabilityColor(strategy.probability)}`}>
                      {strategy.name}
                    </span>
                  </div>
                  <Badge className={`text-lg font-bold ${getProbabilityColor(strategy.probability)}`}>
                    {strategy.probability}%
                  </Badge>
                </div>
                
                <div className="text-xs text-dark-200 space-y-1 mb-2">
                  {strategy.confluences.slice(0, 3).map((confluence, i) => (
                    <div key={i}>• {confluence}</div>
                  ))}
                </div>
                
                <div className="pt-2 border-t border-opacity-20 border-current">
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-dark-200">Entry:</span>
                      <span className={`font-mono ${getProbabilityColor(strategy.probability)}`}>
                        {strategy.entry.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-200">SL:</span>
                      <span className="font-mono text-bearish">
                        {strategy.stopLoss.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-200">TP:</span>
                      <span className="font-mono text-bullish">
                        {strategy.takeProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
