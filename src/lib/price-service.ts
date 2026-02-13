"use client";

// Price service for fetching live cryptocurrency prices
// Uses CoinGecko free API (updates every 60 seconds)

export interface PriceData {
  btc: number;
  btcChange24h: number;
  lastUpdated: Date;
  source: string;
}

// Cache for price data (to avoid excessive API calls)
let priceCache: PriceData | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60000; // 60 seconds (CoinGecko free API update frequency)

// Fallback price in case API fails
const FALLBACK_BTC_PRICE = 104000;

/**
 * Fetch live BTC price from CoinGecko
 * Free API, no key required, updates every 60 seconds
 */
export async function fetchBTCPrice(): Promise<PriceData> {
  const now = Date.now();
  
  // Return cached price if still valid
  if (priceCache && (now - lastFetchTime) < CACHE_DURATION) {
    return priceCache;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true',
      {
        headers: {
          'Accept': 'application/json',
        },
        // Next.js cache settings
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    const priceData: PriceData = {
      btc: data.bitcoin?.usd || FALLBACK_BTC_PRICE,
      btcChange24h: data.bitcoin?.usd_24h_change || 0,
      lastUpdated: data.bitcoin?.last_updated_at 
        ? new Date(data.bitcoin.last_updated_at * 1000) 
        : new Date(),
      source: 'CoinGecko',
    };

    // Update cache
    priceCache = priceData;
    lastFetchTime = now;

    return priceData;
  } catch (error) {
    console.error('Failed to fetch BTC price:', error);
    
    // Return cached data if available, otherwise fallback
    if (priceCache) {
      return priceCache;
    }

    return {
      btc: FALLBACK_BTC_PRICE,
      btcChange24h: 0,
      lastUpdated: new Date(),
      source: 'Fallback',
    };
  }
}

/**
 * React hook for BTC price with auto-refresh
 */
import { useState, useEffect, useCallback } from 'react';

export function useBTCPrice(refreshInterval: number = 60000) {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const data = await fetchBTCPrice();
      setPrice(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();

    // Set up auto-refresh
    const interval = setInterval(fetchPrice, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchPrice, refreshInterval]);

  return { price, isLoading, error, refetch: fetchPrice };
}

/**
 * Format price for display
 */
export function formatPrice(price: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price);
}

/**
 * Calculate USD value from BTC amount
 */
export function btcToUsd(btcAmount: number, btcPrice: number): number {
  return btcAmount * btcPrice;
}

/**
 * Calculate BTC value from USD amount
 */
export function usdToBtc(usdAmount: number, btcPrice: number): number {
  return btcPrice > 0 ? usdAmount / btcPrice : 0;
}
