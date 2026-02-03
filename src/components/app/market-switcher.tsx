'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useMarket } from '@/context/market-provider';

export function MarketSwitcher() {
  const { market, setMarket, availableMarkets } = useMarket();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(market.country);
  const [selectedCity, setSelectedCity] = useState(market.city);

  // State to check if component has mounted on the client
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const selectedCountryData = availableMarkets.find(c => c.code === selectedCountry);
  const currentMarketData = availableMarkets.find(c => c.code === market.country);

  useEffect(() => {
    // When the dialog opens, sync its state with the global context
    if (isOpen) {
      setSelectedCountry(market.country);
      setSelectedCity(market.city);
    }
  }, [isOpen, market]);

  useEffect(() => {
    // If the country changes, reset the city if it's not valid for the new country
    if (selectedCountryData) {
        const cityExists = selectedCountryData.cities.includes(selectedCity);
        if (!cityExists) {
            setSelectedCity(selectedCountryData.cities[0]);
        }
    }
  }, [selectedCountry, selectedCity, selectedCountryData]);

  const handleUpdateMarket = () => {
    setMarket({ country: selectedCountry, city: selectedCity });
    setIsOpen(false);
  };

  if (!hasMounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
        {currentMarketData && (
            <Image
                src={`https://flagcdn.com/w40/${market.country.toLowerCase()}.png`}
                alt={`${market.country} flag`}
                width={24}
                height={18}
                className="rounded-sm object-contain"
            />
        )}
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
            {currentMarketData && (
                <Image
                    src={`https://flagcdn.com/w40/${market.country.toLowerCase()}.png`}
                    alt={`${market.country} flag`}
                    width={24}
                    height={18}
                    className="rounded-sm object-contain"
                />
            )}
          <span className="sr-only">Change market location</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Your Market</DialogTitle>
          <DialogDescription>
            Select your location to see products available for delivery in your area.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country-select">Country</Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger id="country-select">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {availableMarkets.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                     <div className="flex items-center gap-2">
                        <Image
                            src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                            alt={`${country.name} flag`}
                            width={20}
                            height={15}
                            className="rounded-sm object-contain"
                        />
                        <span>{country.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city-select">City</Label>
            <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedCountryData}>
              <SelectTrigger id="city-select">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {selectedCountryData?.cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="button" onClick={handleUpdateMarket}>Update Market</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
