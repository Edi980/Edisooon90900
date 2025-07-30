import { useQuery } from '@tanstack/react-query';
import { PriceData } from '@/types/trading';

export function usePriceHistory(symbol: string, timeframe: string = 'M1', limit: number = 100) {
  return useQuery<PriceData[]>({
    queryKey: ['/api/prices', symbol, { timeframe, limit }],
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

export function useLatestPrice(symbol: string) {
  return useQuery<PriceData>({
    queryKey: ['/api/prices', symbol, 'latest'],
    staleTime: 5000, // 5 seconds
    refetchInterval: 10000, // 10 seconds
  });
}
