export const currencyMap: { [key: string]: { symbol: string; position: 'before' | 'after' } } = {
  NG: { symbol: '₦', position: 'before' },
  GH: { symbol: 'GH₵', position: 'before' },
  NE: { symbol: 'CFA', position: 'after' },
  CM: { symbol: 'CFA', position: 'after' },
};

export function formatCurrency(value: number, currencyCode?: string) {
  const code = currencyCode || 'NG';
  const config = currencyMap[code] || currencyMap['NG'];
  const formattedValue = value.toLocaleString();

  if (config.position === 'after') {
    return `${formattedValue}${config.symbol}`;
  }
  return `${config.symbol}${formattedValue}`;
}

export function getCurrencySymbol(currencyCode?: string) {
    const code = currencyCode || 'NG';
    return currencyMap[code]?.symbol || '₦';
}
