
'use client';

import { useState, useEffect } from 'react';
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
import { MapPin } from 'lucide-react';
import { useMarket } from '@/context/market-provider';

export function MarketSwitcher() {
  const { market, setMarket, availableMarkets } = useMarket();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(market.country);
  const [selectedCity, setSelectedCity] = useState(market.city);

  const selectedCountryData = availableMarkets.find(c => c.code === selectedCountry);

  useEffect(() => {
    // When the dialog opens, sync its state with the global context
    if (isOpen) {
      setSelectedCountry(market.country);
      setSelectedCity(market.city);
    }
  }, [isOpen, market]);

  useEffect(() => {
    // If the country changes, reset the city to the first available one
    const firstCity = availableMarkets.find(c => c.code === selectedCountry)?.cities[0];
    if (firstCity) {
      setSelectedCity(firstCity);
    }
  }, [selectedCountry, availableMarkets]);

  const handleUpdateMarket = () => {
    setMarket({ country: selectedCountry, city: selectedCity });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="hidden md:flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{market.city}, {market.country}</span>
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
                  <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>
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

    