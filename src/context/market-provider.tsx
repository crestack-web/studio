
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { markets } from '@/lib/currency';

export interface Market {
  country: string; // e.g., 'NG'
  city: string;    // e.g., 'Lagos'
}

interface MarketContextType {
  market: Market;
  setMarket: (market: Market) => void;
  availableMarkets: typeof markets;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

const defaultMarket: Market = { country: 'NG', city: 'Lagos' };

export const MarketProvider = ({ children }: { children: ReactNode }) => {
  const [market, setMarket] = useState<Market>(defaultMarket);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      const storedMarket = localStorage.getItem('busmo-market');
      if (storedMarket) {
        const parsedMarket = JSON.parse(storedMarket);
        // Basic validation
        if (parsedMarket.country && parsedMarket.city) {
          setMarket(parsedMarket);
        }
      }
    } catch (error) {
      console.error("Failed to parse market from localStorage", error);
      localStorage.removeItem('busmo-market');
    }
  }, []);

  const handleSetMarket = (newMarket: Market) => {
    setMarket(newMarket);
    setSearchQuery(''); // Reset search query on market change
    localStorage.setItem('busmo-market', JSON.stringify(newMarket));
  };

  return (
    <MarketContext.Provider value={{ market, setMarket: handleSetMarket, availableMarkets: markets, searchQuery, setSearchQuery }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
};

    
