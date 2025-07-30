import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Signal } from '@/types/trading';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SignalHistory() {
  const { data: signals, isLoading } = useQuery<Signal[]>({
    queryKey: ['/api/signals'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="bg-dark-600 border-dark-400 p-4">
        <h2 className="text-sm font-semibold text-dark-200 mb-3 uppercase tracking-wide">
          Recent Signals
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-dark-500 rounded-lg p-3 border border-dark-400 animate-pulse">
              <div className="h-4 bg-dark-400 rounded mb-2"></div>
              <div className="h-3 bg-dark-400 rounded mb-1"></div>
              <div className="h-3 bg-dark-400 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-600 border-dark-400 p-4">
      <h2 className="text-sm font-semibold text-dark-200 mb-3 uppercase tracking-wide">
        Recent Signals
      </h2>
      
      <div className="space-y-3">
        {!signals || signals.length === 0 ? (
          <div className="text-center py-8 text-dark-300">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No signals generated yet</p>
            <p className="text-xs">Waiting for high-probability setups...</p>
          </div>
        ) : (
          signals.slice(0, 5).map((signal) => {
            const isBuy = signal.direction === 'BUY';
            const timeAgo = formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true });
            
            return (
              <div key={signal.id} className="bg-dark-500 rounded-lg p-3 border border-dark-400">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {isBuy ? (
                      <TrendingUp className="w-4 h-4 mr-2 text-bullish" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-2 text-bearish" />
                    )}
                    <span className={`text-sm font-bold ${isBuy ? 'text-bullish' : 'text-bearish'}`}>
                      {signal.symbol} {signal.direction}
                    </span>
                  </div>
                  <span className="text-xs text-dark-200">{timeAgo}</span>
                </div>
                
                <div className="text-xs text-dark-200 space-y-1">
                  <div className="flex justify-between">
                    <span>Entry:</span>
                    <span className="font-mono">{parseFloat(signal.entryPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SL:</span>
                    <span className="font-mono">{parseFloat(signal.stopLoss).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TP:</span>
                    <span className="font-mono">{parseFloat(signal.takeProfit).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Probability:</span>
                    <Badge className={`text-xs ${
                      signal.probability >= 90 ? 'text-bullish bg-bullish/10' :
                      signal.probability >= 80 ? 'text-warning bg-warning/10' :
                      'text-bearish bg-bearish/10'
                    }`}>
                      {signal.probability}%
                    </Badge>
                  </div>
                  <div className="pt-1 border-t border-dark-400 mt-2">
                    <div className="text-xs">
                      <span className="text-dark-300">Strategies: </span>
                      <span>{signal.strategies.join(', ')}</span>
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
