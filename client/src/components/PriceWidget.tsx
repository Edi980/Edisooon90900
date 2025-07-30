import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { PriceData } from '@/types/trading';

interface PriceWidgetProps {
  symbol: string;
  priceData?: PriceData;
  title: string;
}

export function PriceWidget({ symbol, priceData, title }: PriceWidgetProps) {
  const formatPrice = (price: number) => {
    return symbol.includes('XAU') ? price.toFixed(2) : price.toFixed(2);
  };

  const isPositive = (priceData?.changePercent || 0) >= 0;

  return (
    <Card className="bg-dark-500 border-dark-400 p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-dark-200">{title}</span>
        {priceData?.changePercent !== undefined && priceData.changePercent !== null && (
          <Badge 
            className={`text-xs ${
              isPositive 
                ? 'text-bullish bg-bullish/10' 
                : 'text-bearish bg-bearish/10'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {isPositive ? '+' : ''}{priceData.changePercent.toFixed(2)}%
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-2xl font-mono font-bold ${
          isPositive ? 'text-bullish' : 'text-bearish'
        }`}>
          {priceData && priceData.price !== null && priceData.price !== undefined ? formatPrice(priceData.price) : '---.--'}
        </span>
        <div className="text-right">
          <div className="text-xs text-dark-200">Spread: {symbol.includes('XAU') ? '0.3' : '2.5'}</div>
          <div className="text-xs text-dark-200">Vol: {symbol.includes('XAU') ? '125K' : '8.2K'}</div>
        </div>
      </div>
    </Card>
  );
}
