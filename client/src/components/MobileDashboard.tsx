import { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { PriceWidget } from '@/components/PriceWidget';
import { StrategyPanel } from '@/components/StrategyPanel';
import { SettingsModal } from '@/components/SettingsModal';
import { SignalHistory } from '@/components/SignalHistory';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, TrendingUp, Clock, AlertCircle, Target, History, TrendingDown } from 'lucide-react';

export function MobileDashboard() {
  const [showSettings, setShowSettings] = useState(false);
  const { isConnected, prices, strategies, sessionStatus } = useWebSocket();

  const getSessionIndicator = (active: boolean) => {
    if (active) {
      return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
    }
    return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
  };

  return (
    <div className="min-h-screen bg-dark-700 text-dark-100">
      {/* Mobile Header */}
      <header className="bg-dark-600 border-b border-dark-400 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-bullish">
              <TrendingUp className="inline w-4 h-4 mr-1" />
              XAU/BTC Scanner
            </h1>
            
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-bullish animate-pulse' : 'bg-bearish'}`} />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="bg-dark-500 hover:bg-dark-400 border-dark-400 p-2"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Session Status Bar */}
        {sessionStatus && (
          <div className="flex items-center justify-between mt-3 py-2 px-3 bg-dark-500 rounded-lg">
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                {getSessionIndicator(sessionStatus.london.active)}
                <span className="text-dark-200">LON</span>
              </div>
              <div className="flex items-center space-x-1">
                {getSessionIndicator(sessionStatus.ny.active)}
                <span className="text-dark-200">NY</span>
              </div>
              <div className="flex items-center space-x-1">
                {getSessionIndicator(sessionStatus.asia.active)}
                <span className="text-dark-200">ASIA</span>
              </div>
            </div>
            <Badge className="text-xs text-bullish bg-bullish/10">
              {sessionStatus.current}
            </Badge>
          </div>
        )}
      </header>

      {/* Mobile Tabs */}
      <div className="flex-1">
        <Tabs defaultValue="prices" className="h-full">
          <TabsList className="grid w-full grid-cols-3 bg-dark-600 border-b border-dark-400 rounded-none">
            <TabsTrigger value="prices" className="text-xs data-[state=active]:bg-bullish data-[state=active]:text-white">
              Prices
            </TabsTrigger>
            <TabsTrigger value="strategies" className="text-xs data-[state=active]:bg-bullish data-[state=active]:text-white">
              <Target className="w-3 h-3 mr-1" />
              Setups
            </TabsTrigger>
            <TabsTrigger value="signals" className="text-xs data-[state=active]:bg-bullish data-[state=active]:text-white">
              <History className="w-3 h-3 mr-1" />
              Signals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prices" className="mobile-tab-content space-y-4 mt-0">
            {/* Live Prices */}
            <div>
              <h2 className="text-sm font-semibold text-dark-200 mb-3 uppercase tracking-wide">
                Live Prices
              </h2>
              <PriceWidget
                symbol="XAU/USD"
                priceData={prices['XAU/USD']}
                title="XAU/USD (Gold)"
              />
              <PriceWidget
                symbol="BTC/USD"
                priceData={prices['BTC/USD']}
                title="BTC/USD (Bitcoin)"
              />
            </div>

            {/* Quick Stats */}
            <Card className="bg-dark-600 border-dark-400 p-4">
              <h3 className="font-semibold text-dark-100 mb-3">
                <Clock className="inline w-4 h-4 mr-2 text-warning" />
                Market Status
              </h3>
              
              {sessionStatus && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-dark-200">Active Session</div>
                    <div className="text-bullish font-semibold">{sessionStatus.current}</div>
                  </div>
                  <div>
                    <div className="text-dark-200">Volatility</div>
                    <div className={sessionStatus.isHighVolatilityPeriod ? 'text-warning' : 'text-dark-300'}>
                      {sessionStatus.isHighVolatilityPeriod ? 'High' : 'Normal'}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="strategies" className="mobile-tab-content mt-0">
            {/* Active Strategies */}
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-dark-200 mb-3 uppercase tracking-wide">
                Strategy Detections
              </h2>
              
              {strategies.length === 0 ? (
                <Card className="bg-dark-600 border-dark-400 p-6">
                  <div className="text-center text-dark-300">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No Active Setups</p>
                    <p className="text-xs mt-1">Scanner running...</p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {strategies.slice(0, 5).map((strategy, index) => {
                    const direction = strategy.takeProfit > strategy.entry ? 'BUY' : 'SELL';
                    const isBullish = direction === 'BUY';
                    
                    return (
                      <Card key={index} className="bg-dark-600 border-dark-400 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            {isBullish ? (
                              <TrendingUp className="w-4 h-4 mr-2 text-bullish" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-2 text-bearish" />
                            )}
                            <span className="text-sm font-semibold text-dark-100">
                              {strategy.name}
                            </span>
                          </div>
                          <Badge className={`text-lg font-bold ${
                            strategy.probability >= 90 ? 'text-bullish bg-bullish/10' :
                            strategy.probability >= 80 ? 'text-warning bg-warning/10' :
                            'text-bearish bg-bearish/10'
                          }`}>
                            {strategy.probability}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                          <div>
                            <div className="text-dark-200">Entry</div>
                            <div className="font-mono text-bullish font-semibold">
                              {strategy.entry.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-dark-200">SL</div>
                            <div className="font-mono text-bearish font-semibold">
                              {strategy.stopLoss.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-dark-200">TP</div>
                            <div className="font-mono text-bullish font-semibold">
                              {strategy.takeProfit.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-dark-200">
                          <div className="font-medium mb-1">Confluences:</div>
                          <div className="flex flex-wrap gap-1">
                            {strategy.confluences.slice(0, 3).map((confluence, i) => (
                              <span key={i} className="bg-dark-500 px-2 py-1 rounded text-xs">
                                {confluence}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="signals" className="mobile-tab-content mt-0">
            <SignalHistory />
          </TabsContent>
        </Tabs>
      </div>

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}