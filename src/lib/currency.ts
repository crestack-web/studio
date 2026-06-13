
export const currencyMap: { [key: string]: { symbol: string; position: 'before' | 'after', name: string } } = {
  NG: { symbol: '₦', position: 'before', name: 'NGN' },
  GH: { symbol: 'GH₵', position: 'before', name: 'GHS' },
  NE: { symbol: 'CFA', position: 'after', name: 'XOF' },
  CM: { symbol: 'CFA', position: 'after', name: 'XAF' },
  US: { symbol: '$', position: 'before', name: 'USD' },
};

export const markets = [
    {
        code: 'NG',
        name: 'Nigeria',
        currency: 'NGN',
        cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano']
    },
    {
        code: 'GH',
        name: 'Ghana',
        currency: 'GHS',
        cities: ['Accra', 'Kumasi', 'Takoradi']
    },
    {
        code: 'NE',
        name: 'Niger',
        currency: 'XOF',
        cities: ['Niamey', 'Maradi', 'Zinder', 'Tahoua']
    },
    {
        code: 'CM',
        name: 'Cameroon',
        currency: 'XAF',
        cities: ['Douala', 'Yaoundé']
    },
    {
        code: 'US',
        name: 'United States',
        currency: 'USD',
        cities: ['New York', 'Los Angeles', 'Chicago']
    }
];

// Base currency is now USD
const exchangeRates: { [key: string]: number } = {
    USD: 1,
    NGN: 1550,   // 1 USD = 1,550 NGN
    GHS: 12,     // 1 USD = 12 GHS
    XOF: 610,    // 1 USD = 610 XOF
    XAF: 610,    // 1 USD = 610 XAF
};

export function getCurrencyName(currencyOrCountryCode?: string): string {
    if (!currencyOrCountryCode) return 'USD';
     // Check if it's a currency name (e.g., 'NGN', 'GHS')
    const marketByCurrency = markets.find(m => m.currency === currencyOrCountryCode);
    if(marketByCurrency) return marketByCurrency.currency;

    // Check if it's a country code (e.g., 'NG', 'GH')
    const marketByCountry = markets.find(m => m.code === currencyOrCountryCode);
    if (marketByCountry) {
        return marketByCountry.currency;
    }

    return 'USD'; // Default to USD
}

/**
 * Converts a value from USD (the base currency) to a target currency.
 * @param usdValue The value in US Dollars.
 * @param targetCurrencyOrCountryCode The currency code ('GHS') or country code ('GH').
 * @returns The converted value in the target currency.
 */
export function convertFromUsd(usdValue: number, targetCurrencyOrCountryCode?: string): number {
    const targetCurrencyName = getCurrencyName(targetCurrencyOrCountryCode);
    const rate = exchangeRates[targetCurrencyName];
    if (rate === undefined) {
        return usdValue;
    }
    return usdValue * rate;
}

/**
 * Converts a value from a source currency to USD.
 * @param value The amount to convert.
 * @param fromCurrencyOrCountryCode The source currency code or country code.
 * @returns The value in USD.
 */
export function convertToUsd(value: number, fromCurrencyOrCountryCode?: string): number {
    const fromCurrencyName = getCurrencyName(fromCurrencyOrCountryCode);
    const rate = exchangeRates[fromCurrencyName];
    if (rate === undefined) {
        return value;
    }
    return value / rate;
}

/**
 * Converts a value from NGN to a target currency.
 * @param ngnValue The value in Nigerian Naira.
 * @param targetCurrencyOrCountryCode The target currency code or country code.
 * @returns The converted value in the target currency.
 * @deprecated Use convertFromUsd instead as USD is now the base currency
 */
export function convertFromNgn(ngnValue: number, targetCurrencyOrCountryCode?: string): number {
    // First convert NGN to USD, then USD to target currency
    const usdValue = convertToUsd(ngnValue, 'NG');
    return convertFromUsd(usdValue, targetCurrencyOrCountryCode);
}


export function getCountryCode(currencyOrCountryCode?: string): string {
    if (!currencyOrCountryCode) return 'US';

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

    return 'US'; // Default to US
}

/**
 * Detects the user's country code based on browser locale or timezone.
 * Falls back to 'US' if detection fails.
 */
export function getUserCountryCode(): string {
    if (typeof window === 'undefined') return 'US';
    
    try {
        // Try to get country from browser locale
        const locale = navigator.language || (navigator as any).userLanguage;
        if (locale) {
            const countryCode = locale.split('-')[1];
            if (countryCode && markets.find(m => m.code === countryCode)) {
                return countryCode;
            }
        }
        
        // Try to get country from timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone) {
            // Map common timezones to countries
            const timezoneToCountry: { [key: string]: string } = {
                'Africa/Lagos': 'NG',
                'Africa/Accra': 'GH',
                'Africa/Niamey': 'NE',
                'Africa/Douala': 'CM',
                'Africa/Porto-Novo': 'NG',
                'Africa/Abuja': 'NG',
                'America/New_York': 'US',
                'America/Chicago': 'US',
                'America/Los_Angeles': 'US',
                'America/Denver': 'US',
            };
            const country = timezoneToCountry[timezone];
            if (country) return country;
        }
    } catch (e) {
        // Fallback to US if detection fails
    }
    
    return 'US'; // Default to US
}


export function formatCurrency(value: number, currencyOrCountryCode?: string) {
  if (value === null || value === undefined) {
      value = 0;
  }

  const formattedValue = Math.round(value).toLocaleString();

  // If it's a currency symbol (like '₦', '$', 'GH₵'), use it directly
  if (currencyOrCountryCode && currencyOrCountryCode.length <= 3 && !currencyOrCountryCode.match(/^[A-Z]{2,3}$/)) {
    return `${currencyOrCountryCode}${formattedValue}`;
  }

  // Otherwise, use the country code mapping
  const countryCode = getCountryCode(currencyOrCountryCode);
  const config = currencyMap[countryCode] || currencyMap['US'];

  if (config.position === 'after') {
    return `${formattedValue} ${config.symbol}`;
  }
  return `${config.symbol}${formattedValue}`;
}

export function getCurrencySymbol(currencyOrCountryCode?: string) {
    const countryCode = getCountryCode(currencyOrCountryCode);
    return currencyMap[countryCode]?.symbol || '$';
}
