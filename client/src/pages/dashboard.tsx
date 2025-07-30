import { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { PriceWidget } from '@/components/PriceWidget';
import { StrategyPanel } from '@/components/StrategyPanel';
import { ChartView } from '@/components/ChartView';
import { SettingsModal } from '@/components/SettingsModal';
import { SignalHistory } from '@/components/SignalHistory';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Settings, TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD');
  const [showSettings, setShowSettings] = useState(false);
  const { isConnected, prices, strategies, sessionStatus } = useWebSocket();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getSessionIndicator = (session: string, active: boolean) => {
    if (active) {
      return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
    }
    return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
  };

  return (
    <div className="min-h-screen bg-dark-700 text-dark-100">
      {/* Header */}
      <header className="bg-dark-600 border-b border-dark-400 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-bullish">
              <TrendingUp className="inline w-5 h-5 mr-2" />
              XAU/BTC Scanner
            </h1>
            
            {sessionStatus && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {getSessionIndicator('london', sessionStatus.london.active)}
                    <span className="text-xs text-dark-200">LONDON</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getSessionIndicator('ny', sessionStatus.ny.active)}
                    <span className="text-xs text-dark-200">NY</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getSessionIndicator('asia', sessionStatus.asia.active)}
                    <span className="text-xs text-dark-200">ASIA</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-bullish animate-pulse' : 'bg-bearish'}`} />
              <span className="text-xs text-dark-200">
                {isConnected ? 'Live Scanner Active' : 'Connecting...'}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="bg-dark-500 hover:bg-dark-400 border-dark-400"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="w-80 bg-dark-600 border-r border-dark-400 p-4 overflow-y-auto">
          {/* Live Prices */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-dark-200 mb-3 uppercase tracking-wide">
              Live Prices
            </h2>
            <PriceWidget
              symbol="XAU/USD"
              priceData={prices['XAU/USD']}
              title="XAU/USD"
            />
            <PriceWidget
              symbol="BTC/USD"
              priceData={prices['BTC/USD']}
              title="BTC/USD"
            />
          </div>

          {/* Active Strategies */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-dark-200 mb-3 uppercase tracking-wide">
              Active Strategies
            </h2>
            <div className="space-y-2">
              {strategies.length === 0 ? (
                <Card className="bg-dark-500 border-dark-400 p-3">
                  <div className="text-center text-dark-300">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active strategies</p>
                    <p className="text-xs">Scanning for setups...</p>
                  </div>
                </Card>
              ) : (
                strategies.slice(0, 3).map((strategy, index) => (
                  <Card key={index} className="bg-dark-500 border-dark-400 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        strategy.probability >= 90 ? 'text-bullish' :
                        strategy.probability >= 80 ? 'text-warning' : 'text-bearish'
                      }`}>
                        {strategy.name}
                      </span>
                      <Badge className={`text-xs ${
                        strategy.probability >= 90 ? 'text-bullish bg-bullish/10' :
                        strategy.probability >= 80 ? 'text-warning bg-warning/10' : 'text-bearish bg-bearish/10'
                      }`}>
                        {strategy.probability}%
                      </Badge>
                    </div>
                    <div className="text-xs text-dark-200">
                      {selectedSymbol} • {strategy.timeframe} • {strategy.description}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Recent Signals */}
          <SignalHistory />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <ChartView
            selectedSymbol={selectedSymbol}
            onSymbolChange={setSelectedSymbol}
            strategies={strategies}
            lastUpdate={formatTime(new Date())}
          />

          {/* Analysis Panel Grid */}
          <div className="flex-1 grid grid-cols-12 gap-4 p-6">
            <div className="col-span-8">
              {/* Additional chart or analysis content can go here */}
            </div>
            
            <div className="col-span-4 space-y-4">
              <StrategyPanel strategies={strategies} />
              
              {/* Session Analysis */}
              <Card className="bg-dark-600 border-dark-400 p-4">
                <h3 className="font-semibold text-dark-100 mb-3">
                  <Clock className="inline w-4 h-4 mr-2 text-warning" />
                  Session Analysis
                </h3>
                
                {sessionStatus && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-200">Current Session</span>
                      <Badge className="text-bullish bg-bullish/10">
                        {sessionStatus.current}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-200">London</span>
                        <span className={`text-sm ${
                          sessionStatus.london.active ? 'text-bullish' : 'text-dark-300'
                        }`}>
                          {sessionStatus.london.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-200">New York</span>
                        <span className={`text-sm ${
                          sessionStatus.ny.active ? 'text-bullish' : 'text-dark-300'
                        }`}>
                          {sessionStatus.ny.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-200">Asia</span>
                        <span className={`text-sm ${
                          sessionStatus.asia.active ? 'text-bullish' : 'text-dark-300'
                        }`}>
                          {sessionStatus.asia.status}
                        </span>
                      </div>
                    </div>
                    
                    {sessionStatus.isHighVolatilityPeriod && (
                      <div className="mt-4 pt-4 border-t border-dark-400">
                        <Badge className="text-warning bg-warning/10">
                          High Volatility Period
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
