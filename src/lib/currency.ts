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
        cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano'] 
    },
    { 
        code: 'GH', 
        name: 'Ghana', 
        cities: ['Accra', 'Kumasi', 'Takoradi'] 
    },
    {
        code: 'NE',
        name: 'Niger',
        cities: ['Niamey', 'Maradi', 'Zinder', 'Tahoua']
    },
    {
        code: 'CM',
        name: 'Cameroon',
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

/**
 * Converts a value from NGN (the base currency) to a target currency.
 * @param ngnValue The value in Nigerian Naira.
 * @param targetCurrencyCode The country code (e.g., 'GH', 'CM').
 * @returns The converted value in the target currency.
 */
export function convertFromNgn(ngnValue: number, targetCurrencyCode?: string): number {
    if (!targetCurrencyCode) return ngnValue;
    const targetCurrencyName = currencyMap[targetCurrencyCode]?.name;
    if (!targetCurrencyName) return ngnValue;

    const rate = exchangeRates[targetCurrencyName];
    if (rate === undefined) {
        return ngnValue;
    }
    return ngnValue * rate;
}


export function formatCurrency(value: number, currencyCode?: string) {
  const code = currencyCode || 'NG';
  const config = currencyMap[code] || currencyMap['NG'];
  const formattedValue = Math.round(value).toLocaleString();

  if (config.position === 'after') {
    return `${formattedValue} ${config.symbol}`;
  }
  return `${config.symbol}${formattedValue}`;
}

export function getCurrencySymbol(currencyCode?: string) {
    const code = currencyCode || 'NG';
    return currencyMap[code]?.symbol || '₦';
}
