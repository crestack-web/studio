// ═══════════════════════════════════════════
//  BUSMO — Currency Data
//
//  Contains: all African currencies + major
//  global currencies used by African diaspora
//  and international Busmo users.
//
//  Each entry includes:
//   - ISO 4217 code (NGN, KES, USD …)
//   - Symbol (₦, KSh, $)
//   - Native symbol where different (e.g. دج)
//   - Decimal places (0, 2, 3)
//   - Symbol position (before/after the amount)
//   - Thousands separator (, . ' space)
//   - Decimal separator (. ,)
//   - Country codes it maps to (ISO 3166-1 alpha-2)
// ═══════════════════════════════════════════

export interface Currency {
  code: string;            // ISO 4217  e.g. 'NGN'
  symbol: string;          // Display symbol  e.g. '₦'
  nativeSymbol?: string;   // Alternate native symbol
  name: string;            // Full name  e.g. 'Nigerian Naira'
  namePlural: string;      // e.g. 'Nigerian nairas'
  flag: string;            // Flag emoji of primary country
  decimals: number;        // 0 | 2 | 3
  symbolBefore: boolean;   // true = ₦100 | false = 100₦
  thousandsSep: string;    // ',' | '.' | ' ' | "'"
  decimalSep: string;      // '.' | ','
  countries: string[];     // ISO 3166-1 alpha-2 country codes
  region: string;          // Continent / region label
  example: string;         // Pre-formatted example e.g. '₦1,250.00'
}

// ════════════════════════════════════════════════════════════════════
//  AFRICAN CURRENCIES
// ════════════════════════════════════════════════════════════════════
export const CURRENCIES: Currency[] = [

  // ── West Africa ────────────────────────────────────────────────────
  {
    code: 'NGN', symbol: '₦', name: 'Nigerian Naira', namePlural: 'Nigerian nairas',
    flag: '🇳🇬', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['NG'], region: 'West Africa', example: '₦1,250.00',
  },
  {
    code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', namePlural: 'Ghanaian cedis',
    flag: '🇬🇭', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['GH'], region: 'West Africa', example: 'GH₵1,250.00',
  },
  {
    code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', namePlural: 'CFA francs',
    flag: '🇸🇳', decimals: 0, symbolBefore: false, thousandsSep: ' ', decimalSep: ',',
    countries: ['SN','CI','ML','BF','BJ','TG','NE','GW'],
    region: 'West Africa (UEMOA)', example: '1 250 CFA',
  },
  {
    code: 'SLL', symbol: 'Le', name: 'Sierra Leonean Leone', namePlural: 'Sierra Leonean leones',
    flag: '🇸🇱', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['SL'], region: 'West Africa', example: 'Le1,250.00',
  },
  {
    code: 'GMD', symbol: 'D', name: 'Gambian Dalasi', namePlural: 'Gambian dalasis',
    flag: '🇬🇲', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['GM'], region: 'West Africa', example: 'D1,250.00',
  },
  {
    code: 'LRD', symbol: 'L$', name: 'Liberian Dollar', namePlural: 'Liberian dollars',
    flag: '🇱🇷', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['LR'], region: 'West Africa', example: 'L$1,250.00',
  },
  {
    code: 'CVE', symbol: '$', name: 'Cape Verdean Escudo', namePlural: 'Cape Verdean escudos',
    flag: '🇨🇻', decimals: 2, symbolBefore: false, thousandsSep: '.', decimalSep: ',',
    countries: ['CV'], region: 'West Africa', example: '1.250,00$',
  },
  {
    code: 'MRU', symbol: 'UM', name: 'Mauritanian Ouguiya', namePlural: 'Mauritanian ouguiyas',
    flag: '🇲🇷', decimals: 2, symbolBefore: false, thousandsSep: ',', decimalSep: '.',
    countries: ['MR'], region: 'West Africa', example: '1,250.00 UM',
  },
  {
    code: 'GNF', symbol: 'FG', name: 'Guinean Franc', namePlural: 'Guinean francs',
    flag: '🇬🇳', decimals: 0, symbolBefore: false, thousandsSep: ' ', decimalSep: ',',
    countries: ['GN'], region: 'West Africa', example: '1 250 FG',
  },

  // ── East Africa ────────────────────────────────────────────────────
  {
    code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', namePlural: 'Kenyan shillings',
    flag: '🇰🇪', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['KE'], region: 'East Africa', example: 'KSh1,250.00',
  },
  {
    code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', namePlural: 'Tanzanian shillings',
    flag: '🇹🇿', decimals: 0, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['TZ'], region: 'East Africa', example: 'TSh1,250',
  },
  {
    code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', namePlural: 'Ugandan shillings',
    flag: '🇺🇬', decimals: 0, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['UG'], region: 'East Africa', example: 'USh1,250',
  },
  {
    code: 'RWF', symbol: 'RF', name: 'Rwandan Franc', namePlural: 'Rwandan francs',
    flag: '🇷🇼', decimals: 0, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['RW'], region: 'East Africa', example: 'RF1,250',
  },
  {
    code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', namePlural: 'Ethiopian birrs',
    flag: '🇪🇹', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['ET'], region: 'East Africa', example: 'Br1,250.00',
  },
  {
    code: 'BIF', symbol: 'Fr', name: 'Burundian Franc', namePlural: 'Burundian francs',
    flag: '🇧🇮', decimals: 0, symbolBefore: false, thousandsSep: ',', decimalSep: '.',
    countries: ['BI'], region: 'East Africa', example: '1,250 Fr',
  },
  {
    code: 'DJF', symbol: 'Fr', name: 'Djiboutian Franc', namePlural: 'Djiboutian francs',
    flag: '🇩🇯', decimals: 0, symbolBefore: false, thousandsSep: ',', decimalSep: '.',
    countries: ['DJ'], region: 'East Africa', example: '1,250 Fr',
  },
  {
    code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa', namePlural: 'Eritrean nakfas',
    flag: '🇪🇷', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['ER'], region: 'East Africa', example: 'Nfk1,250.00',
  },
  {
    code: 'KMF', symbol: 'CF', name: 'Comorian Franc', namePlural: 'Comorian francs',
    flag: '🇰🇲', decimals: 0, symbolBefore: false, thousandsSep: ',', decimalSep: '.',
    countries: ['KM'], region: 'East Africa', example: '1,250 CF',
  },
  {
    code: 'SOS', symbol: 'Sh', name: 'Somali Shilling', namePlural: 'Somali shillings',
    flag: '🇸🇴', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['SO'], region: 'East Africa', example: 'Sh1,250.00',
  },

  // ── Southern Africa ────────────────────────────────────────────────
  {
    code: 'ZAR', symbol: 'R', name: 'South African Rand', namePlural: 'South African rands',
    flag: '🇿🇦', decimals: 2, symbolBefore: true, thousandsSep: ' ', decimalSep: ',',
    countries: ['ZA','LS','SZ','NA'], region: 'Southern Africa', example: 'R 1 250,00',
  },
  {
    code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', namePlural: 'Zambian kwachas',
    flag: '🇿🇲', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['ZM'], region: 'Southern Africa', example: 'ZK1,250.00',
  },
  {
    code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha', namePlural: 'Malawian kwachas',
    flag: '🇲🇼', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['MW'], region: 'Southern Africa', example: 'MK1,250.00',
  },
  {
    code: 'BWP', symbol: 'P', name: 'Botswanan Pula', namePlural: 'Botswanan pulas',
    flag: '🇧🇼', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['BW'], region: 'Southern Africa', example: 'P1,250.00',
  },
  {
    code: 'MZN', symbol: 'MT', name: 'Mozambican Metical', namePlural: 'Mozambican meticals',
    flag: '🇲🇿', decimals: 2, symbolBefore: false, thousandsSep: '.', decimalSep: ',',
    countries: ['MZ'], region: 'Southern Africa', example: '1.250,00 MT',
  },
  {
    code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza', namePlural: 'Angolan kwanzas',
    flag: '🇦🇴', decimals: 2, symbolBefore: false, thousandsSep: '.', decimalSep: ',',
    countries: ['AO'], region: 'Southern Africa', example: '1.250,00 Kz',
  },
  {
    code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary', namePlural: 'Malagasy ariary',
    flag: '🇲🇬', decimals: 0, symbolBefore: false, thousandsSep: ',', decimalSep: '.',
    countries: ['MG'], region: 'Southern Africa', example: '1,250 Ar',
  },
  {
    code: 'ZWL', symbol: 'Z$', name: 'Zimbabwean Dollar', namePlural: 'Zimbabwean dollars',
    flag: '🇿🇼', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['ZW'], region: 'Southern Africa', example: 'Z$1,250.00',
  },

  // ── Central Africa ─────────────────────────────────────────────────
  {
    code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', namePlural: 'CFA francs',
    flag: '🇨🇲', decimals: 0, symbolBefore: false, thousandsSep: ' ', decimalSep: ',',
    countries: ['CM','TD','CF','CG','GQ','GA'],
    region: 'Central Africa (CEMAC)', example: '1 250 FCFA',
  },
  {
    code: 'CDF', symbol: 'FC', name: 'Congolese Franc', namePlural: 'Congolese francs',
    flag: '🇨🇩', decimals: 2, symbolBefore: true, thousandsSep: '.', decimalSep: ',',
    countries: ['CD'], region: 'Central Africa', example: 'FC1.250,00',
  },
  {
    code: 'STN', symbol: 'Db', name: 'São Tomé & Príncipe Dobra', namePlural: 'Dobras',
    flag: '🇸🇹', decimals: 2, symbolBefore: false, thousandsSep: '.', decimalSep: ',',
    countries: ['ST'], region: 'Central Africa', example: '1.250,00 Db',
  },

  // ── North Africa ───────────────────────────────────────────────────
  {
    code: 'EGP', symbol: 'E£', nativeSymbol: 'ج.م', name: 'Egyptian Pound', namePlural: 'Egyptian pounds',
    flag: '🇪🇬', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['EG'], region: 'North Africa', example: 'E£1,250.00',
  },
  {
    code: 'MAD', symbol: 'MAD', nativeSymbol: 'د.م.', name: 'Moroccan Dirham', namePlural: 'Moroccan dirhams',
    flag: '🇲🇦', decimals: 2, symbolBefore: false, thousandsSep: '.', decimalSep: ',',
    countries: ['MA'], region: 'North Africa', example: '1.250,00 MAD',
  },
  {
    code: 'TND', symbol: 'DT', nativeSymbol: 'د.ت', name: 'Tunisian Dinar', namePlural: 'Tunisian dinars',
    flag: '🇹🇳', decimals: 3, symbolBefore: false, thousandsSep: '.', decimalSep: ',',
    countries: ['TN'], region: 'North Africa', example: '1.250,000 DT',
  },
  {
    code: 'DZD', symbol: 'DA', nativeSymbol: 'دج', name: 'Algerian Dinar', namePlural: 'Algerian dinars',
    flag: '🇩🇿', decimals: 2, symbolBefore: false, thousandsSep: '.', decimalSep: ',',
    countries: ['DZ'], region: 'North Africa', example: '1.250,00 DA',
  },
  {
    code: 'LYD', symbol: 'LD', nativeSymbol: 'ل.د', name: 'Libyan Dinar', namePlural: 'Libyan dinars',
    flag: '🇱🇾', decimals: 3, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['LY'], region: 'North Africa', example: 'LD1,250.000',
  },
  {
    code: 'SDG', symbol: 'SDG', nativeSymbol: 'ج.س.', name: 'Sudanese Pound', namePlural: 'Sudanese pounds',
    flag: '🇸🇩', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['SD'], region: 'North Africa', example: 'SDG1,250.00',
  },

  // ── Indian Ocean ───────────────────────────────────────────────────
  {
    code: 'MUR', symbol: 'Rs', name: 'Mauritian Rupee', namePlural: 'Mauritian rupees',
    flag: '🇲🇺', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['MU'], region: 'Indian Ocean', example: 'Rs1,250.00',
  },
  {
    code: 'SCR', symbol: 'SR', name: 'Seychellois Rupee', namePlural: 'Seychellois rupees',
    flag: '🇸🇨', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['SC'], region: 'Indian Ocean', example: 'SR1,250.00',
  },

  // ════════════════════════════════════════════════════════════════════
  //  GLOBAL (widely used by African diaspora / cross-border trade)
  // ════════════════════════════════════════════════════════════════════
  {
    code: 'USD', symbol: '$', name: 'US Dollar', namePlural: 'US dollars',
    flag: '🇺🇸', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['US','ZW','LR','EC','SV','PA','PR'],
    region: 'Global', example: '$1,250.00',
  },
  {
    code: 'EUR', symbol: '€', name: 'Euro', namePlural: 'Euros',
    flag: '🇪🇺', decimals: 2, symbolBefore: false, thousandsSep: '.', decimalSep: ',',
    countries: ['DE','FR','IT','ES','PT','NL','BE','AT','FI','GR','IE','LU','MT','CY','EE','LV','LT','SK','SI'],
    region: 'Global / Europe', example: '1.250,00 €',
  },
  {
    code: 'GBP', symbol: '£', name: 'British Pound', namePlural: 'British pounds',
    flag: '🇬🇧', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['GB'], region: 'Global / UK', example: '£1,250.00',
  },
  {
    code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', namePlural: 'Canadian dollars',
    flag: '🇨🇦', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['CA'], region: 'Global', example: 'CA$1,250.00',
  },
  {
    code: 'AUD', symbol: 'A$', name: 'Australian Dollar', namePlural: 'Australian dollars',
    flag: '🇦🇺', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['AU'], region: 'Global', example: 'A$1,250.00',
  },
  {
    code: 'AED', symbol: 'AED', nativeSymbol: 'د.إ', name: 'UAE Dirham', namePlural: 'UAE dirhams',
    flag: '🇦🇪', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['AE'], region: 'Middle East', example: 'AED1,250.00',
  },
  {
    code: 'SAR', symbol: 'SR', nativeSymbol: 'ر.س', name: 'Saudi Riyal', namePlural: 'Saudi riyals',
    flag: '🇸🇦', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['SA'], region: 'Middle East', example: 'SR1,250.00',
  },
  {
    code: 'CNY', symbol: '¥', name: 'Chinese Yuan', namePlural: 'Chinese yuan',
    flag: '🇨🇳', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['CN'], region: 'Asia', example: '¥1,250.00',
  },
  {
    code: 'INR', symbol: '₹', name: 'Indian Rupee', namePlural: 'Indian rupees',
    flag: '🇮🇳', decimals: 2, symbolBefore: true, thousandsSep: ',', decimalSep: '.',
    countries: ['IN'], region: 'Asia', example: '₹1,250.00',
  },
];

// ════════════════════════════════════════════════════════════════════
//  COUNTRY → CURRENCY mapping
//  (ISO 3166-1 alpha-2 → ISO 4217)
// ════════════════════════════════════════════════════════════════════
export const COUNTRY_CURRENCY_MAP: Record<string, string> = Object.fromEntries(
  CURRENCIES.flatMap(c => c.countries.map(cc => [cc, c.code]))
);

// Country display names (subset — African countries + major global)
export const COUNTRY_NAMES: Record<string, string> = {
  NG: 'Nigeria', GH: 'Ghana', KE: 'Kenya', ZA: 'South Africa', ET: 'Ethiopia',
  TZ: 'Tanzania', UG: 'Uganda', SN: 'Senegal', CI: "Côte d'Ivoire", CM: 'Cameroon',
  ML: 'Mali', BF: 'Burkina Faso', BJ: 'Benin', TG: 'Togo', NE: 'Niger',
  GW: 'Guinea-Bissau', SL: 'Sierra Leone', LR: 'Liberia', GM: 'Gambia',
  GN: 'Guinea', CV: 'Cape Verde', MR: 'Mauritania', SL2: 'Sierra Leone',
  RW: 'Rwanda', BI: 'Burundi', DJ: 'Djibouti', ER: 'Eritrea', KM: 'Comoros',
  SO: 'Somalia', ZM: 'Zambia', MW: 'Malawi', BW: 'Botswana', MZ: 'Mozambique',
  AO: 'Angola', MG: 'Madagascar', ZW: 'Zimbabwe', LS: 'Lesotho', SZ: 'Eswatini',
  NA: 'Namibia', CD: 'DR Congo', CG: 'Congo', CM2: 'Cameroon', TD: 'Chad',
  CF: 'Central African Republic', GQ: 'Equatorial Guinea', GA: 'Gabon',
  ST: 'São Tomé & Príncipe', EG: 'Egypt', MA: 'Morocco', TN: 'Tunisia',
  DZ: 'Algeria', LY: 'Libya', SD: 'Sudan', MU: 'Mauritius', SC: 'Seychelles',
  US: 'United States', GB: 'United Kingdom', EU: 'European Union',
  CA: 'Canada', AU: 'Australia', AE: 'UAE', SA: 'Saudi Arabia',
  CN: 'China', IN: 'India',
};

// Sorted list for a <select> dropdown
export const COUNTRY_LIST = Object.entries(COUNTRY_NAMES)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ════════════════════════════════════════════════════════════════════
//  CURRENCY FORMATTER
//  formatMoney(1234.5, 'NGN') → '₦1,234.50'
//  formatMoney(1234, 'XOF')   → '1 234 CFA'
// ════════════════════════════════════════════════════════════════════
export function getCurrency(code: string): Currency {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0]; // fallback to NGN
}

export function formatMoney(
  amount: number,
  currencyCode: string,
  options?: { compact?: boolean }
): string {
  const c = getCurrency(currencyCode);

  let num = amount;

  // Compact mode: 1250000 → 1.25M
  if (options?.compact) {
    if (Math.abs(num) >= 1_000_000) {
      const val = (num / 1_000_000).toFixed(1).replace(/\.0$/, '');
      const formatted = `${c.symbolBefore ? c.symbol : ''}${val}M${!c.symbolBefore ? c.symbol : ''}`;
      return c.symbolBefore ? formatted : formatted;
    }
    if (Math.abs(num) >= 1_000) {
      const val = (num / 1_000).toFixed(1).replace(/\.0$/, '');
      return c.symbolBefore ? `${c.symbol}${val}K` : `${val}K${c.symbol}`;
    }
  }

  // Format the integer part with thousands separator
  const fixed = Math.abs(num).toFixed(c.decimals);
  const [intPart, decPart] = fixed.split('.');

  // Add thousands separators
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, c.thousandsSep);

  // Assemble number string
  let numStr: string;
  if (c.decimals === 0) {
    numStr = intFormatted;
  } else {
    numStr = `${intFormatted}${c.decimalSep}${decPart}`;
  }

  // Apply negative sign
  const sign = num < 0 ? '-' : '';

  // Apply symbol position
  const space = (c.symbol.length > 1 && !['GH₵','KSh','TSh','USh','CA$','A$','Z$','L$'].includes(c.symbol)) ? ' ' : '';
  if (c.symbolBefore) {
    return `${sign}${c.symbol}${space}${numStr}`;
  } else {
    return `${sign}${numStr}${space}${c.symbol}`;
  }
}

// Quick currency lookup by country
export function currencyFromCountry(countryCode: string): Currency {
  const code = COUNTRY_CURRENCY_MAP[countryCode];
  return code ? getCurrency(code) : getCurrency('NGN');
}

// Sorted currencies for display (Africa first, then Global)
export const CURRENCIES_SORTED: Currency[] = [
  ...CURRENCIES.filter(c => c.region !== 'Global' && !['Middle East','Asia','Global / UK','Global / Europe'].includes(c.region)),
  ...CURRENCIES.filter(c => ['Global','Middle East','Asia','Global / UK','Global / Europe'].includes(c.region)),
];
