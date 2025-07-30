import { useEffect, useRef, useState } from 'react';
import { PriceData, StrategyDetection, SessionStatus } from '@/types/trading';

interface WebSocketMessage {
  type: 'price_update' | 'strategy_detection' | 'session_status';
  data: any;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [strategies, setStrategies] = useState<StrategyDetection[]>([]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            switch (message.type) {
              case 'price_update':
                setPrices(prev => ({
                  ...prev,
                  [message.data.symbol]: message.data
                }));
                break;
                
              case 'strategy_detection':
                setStrategies(prev => {
                  const newStrategies = [message.data, ...prev.slice(0, 9)];
                  return newStrategies;
                });
                break;
                
              case 'session_status':
                setSessionStatus(message.data);
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          
          // Reconnect after 3 seconds
          setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    prices,
    strategies,
    sessionStatus
  };
}
