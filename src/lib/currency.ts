
export const currencyMap: { [key: string]: { symbol: string; position: 'before' | 'after', name: string } } = {
  NG: { symbol: '₦', position: 'before', name: 'NGN' },
  GH: { symbol: 'GH₵', position: 'before', name: 'GHS' },
  NE: { symbol: 'CFA', position: 'after', name: 'XOF' },
  CM: { symbol: 'CFA', position: 'after', name: 'XAF' },
};

export const markets = [
    { 
        code: 'NG', 
        name: 'Nigeria', 
        currency: 'NGN',
        flag: '🇳🇬',
        cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano'] 
    },
    { 
        code: 'GH', 
        name: 'Ghana', 
        currency: 'GHS',
        flag: '🇬🇭',
        cities: ['Accra', 'Kumasi', 'Takoradi'] 
    },
    {
        code: 'NE',
        name: 'Niger',
        currency: 'XOF',
        flag: '🇳🇪',
        cities: ['Niamey', 'Maradi', 'Zinder', 'Tahoua']
    },
    {
        code: 'CM',
        name: 'Cameroon',
        currency: 'XAF',
        flag: '🇨🇲',
        cities: ['Douala', 'Yaoundé']
    }
];

// Rates are how many units of the target currency you get for 1 NGN.
const exchangeRates: { [key: string]: number } = {
    NGN: 1,
    GHS: 1 / 100, // Example: 1 GHS = 100 NGN
    XOF: 1 / 2.5, // Example: 1 CFA = 2.5 NGN
    XAF: 1 / 2.5, // Example: 1 CFA = 2.5 NGN
};

function getCountryCode(currencyOrCountryCode?: string): string {
    if (!currencyOrCountryCode) return 'NG';

    // Check if it's a country code (e.g., 'NG', 'GH')
    const marketByCountry = markets.find(m => m.code === currencyOrCountryCode);
    if (marketByCountry) {
        return marketByCountry.code;
    }
    
    // Check if it's a currency name (e.g., 'NGN', 'GHS')
    const marketByCurrency = markets.find(m => m.currency === currencyOrCountryCode);
    if (marketByCurrency) {
      return marketByCurrency.code;
    }
    
    return 'NG'; // Default to Nigeria
}

function getCurrencyName(currencyOrCountryCode?: string): string {
    if (!currencyOrCountryCode) return 'NGN';
     // Check if it's a currency name (e.g., 'NGN', 'GHS')
    const marketByCurrency = markets.find(m => m.currency === currencyOrCountryCode);
    if(marketByCurrency) return marketByCurrency.currency;

    // Check if it's a country code (e.g., 'NG', 'GH')
    const marketByCountry = markets.find(m => m.code === currencyOrCountryCode);
    if (marketByCountry) {
        return marketByCountry.currency;
    }
    
    return 'NGN'; // Default to Nigeria
}


/**
 * Converts a value from NGN (the base currency) to a target currency.
 * @param ngnValue The value in Nigerian Naira.
 * @param targetCurrencyOrCountryCode The currency code ('GHS') or country code ('GH').
 * @returns The converted value in the target currency.
 */
export function convertFromNgn(ngnValue: number, targetCurrencyOrCountryCode?: string): number {
    const targetCurrencyName = getCurrencyName(targetCurrencyOrCountryCode);
    const rate = exchangeRates[targetCurrencyName];
    if (rate === undefined) {
        return ngnValue;
    }
    return ngnValue * rate;
}


export function formatCurrency(value: number, currencyOrCountryCode?: string) {
  const countryCode = getCountryCode(currencyOrCountryCode);
  const config = currencyMap[countryCode] || currencyMap['NG'];
  
  if (value === null || value === undefined) {
      value = 0;
  }
  
  const formattedValue = Math.round(value).toLocaleString();

  if (config.position === 'after') {
    return `${formattedValue} ${config.symbol}`;
  }
  return `${config.symbol}${formattedValue}`;
}

export function getCurrencySymbol(currencyOrCountryCode?: string) {
    const countryCode = getCountryCode(currencyOrCountryCode);
    return currencyMap[countryCode]?.symbol || '₦';
}
