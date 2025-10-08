/**
 * Stripe Supported Currencies
 * 
 * Based on Stripe's official supported currencies documentation
 * Includes validation rules and special conditions
 */

export enum StripeCurrency {
  // Major currencies
  USD = 'usd', // $0.50 minimum
  EUR = 'eur', // €0.50 minimum
  GBP = 'gbp', // £0.30 minimum
  JPY = 'jpy', // ¥50 minimum, zero-decimal
  CAD = 'cad', // $0.50 minimum
  AUD = 'aud', // $0.50 minimum
  CHF = 'chf', // 0.50 Fr minimum
  
  // Asian currencies
  CNY = 'cny',
  HKD = 'hkd', // $4.00 minimum
  SGD = 'sgd', // $0.50 minimum
  KRW = 'krw', // zero-decimal
  INR = 'inr', // ₹0.50 minimum
  THB = 'thb', // ฿10 minimum
  MYR = 'myr', // RM 2 minimum
  IDR = 'idr',
  PHP = 'php',
  VND = 'vnd', // zero-decimal
  TWD = 'twd', // special case - zero-decimal for payouts
  
  // European currencies
  NOK = 'nok', // 3.00-kr. minimum
  SEK = 'sek', // 3.00-kr. minimum
  DKK = 'dkk', // 2.50-kr. minimum
  PLN = 'pln', // 2.00 zł minimum
  CZK = 'czk', // 15.00Kč minimum
  HUF = 'huf', // 175.00 Ft minimum, special case
  RON = 'ron', // lei2.00 minimum
  BGN = 'bgn', // лв1.00 minimum
  
  // Middle East & Africa
  AED = 'aed', // 2.00 د.إ minimum
  SAR = 'sar',
  QAR = 'qar',
  EGP = 'egp',
  ZAR = 'zar',
  NGN = 'ngn',
  KES = 'kes',
  GHS = 'ghs',
  
  // Latin America
  BRL = 'brl', // R$0.50 minimum
  MXN = 'mxn', // $10 minimum
  ARS = 'ars',
  CLP = 'clp', // zero-decimal
  COP = 'cop',
  PEN = 'pen',
  UYU = 'uyu',
  
  // Other currencies
  NZD = 'nzd', // $0.50 minimum
  ISK = 'isk', // special case - zero-decimal but backwards compatible
  TRY = 'try',
  RUB = 'rub',
  UAH = 'uah',
  ILS = 'ils',
  
  // Zero-decimal currencies
  BIF = 'bif', // zero-decimal
  DJF = 'djf', // zero-decimal
  GNF = 'gnf', // zero-decimal
  KMF = 'kmf', // zero-decimal
  MGA = 'mga', // zero-decimal
  PYG = 'pyg', // zero-decimal
  RWF = 'rwf', // zero-decimal
  UGX = 'ugx', // zero-decimal, special case
  VUV = 'vuv', // zero-decimal
  XAF = 'xaf', // zero-decimal
  XOF = 'xof', // zero-decimal
  XPF = 'xpf', // zero-decimal
}

/**
 * Currency validation rules and conditions
 */
export interface CurrencyInfo {
  code: StripeCurrency;
  name: string;
  minimumAmount: number; // in minor units
  isZeroDecimal: boolean;
  supportsAmericanExpress: boolean;
  specialConditions?: string[];
  maxDigits?: number;
}

/**
 * Currency validation data
 */
export const CURRENCY_INFO: Record<StripeCurrency, CurrencyInfo> = {
  // Major currencies
  [StripeCurrency.USD]: {
    code: StripeCurrency.USD,
    name: 'US Dollar',
    minimumAmount: 50, // $0.50
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.EUR]: {
    code: StripeCurrency.EUR,
    name: 'Euro',
    minimumAmount: 50, // €0.50
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.GBP]: {
    code: StripeCurrency.GBP,
    name: 'British Pound',
    minimumAmount: 30, // £0.30
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.JPY]: {
    code: StripeCurrency.JPY,
    name: 'Japanese Yen',
    minimumAmount: 50, // ¥50
    isZeroDecimal: true,
    supportsAmericanExpress: true,
    maxDigits: 10
  },
  [StripeCurrency.CAD]: {
    code: StripeCurrency.CAD,
    name: 'Canadian Dollar',
    minimumAmount: 50, // $0.50
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.AUD]: {
    code: StripeCurrency.AUD,
    name: 'Australian Dollar',
    minimumAmount: 50, // $0.50
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.CHF]: {
    code: StripeCurrency.CHF,
    name: 'Swiss Franc',
    minimumAmount: 50, // 0.50 Fr
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  
  // Asian currencies
  [StripeCurrency.CNY]: {
    code: StripeCurrency.CNY,
    name: 'Chinese Yuan',
    minimumAmount: 50, // ¥0.50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.HKD]: {
    code: StripeCurrency.HKD,
    name: 'Hong Kong Dollar',
    minimumAmount: 400, // $4.00
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.SGD]: {
    code: StripeCurrency.SGD,
    name: 'Singapore Dollar',
    minimumAmount: 50, // $0.50
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.KRW]: {
    code: StripeCurrency.KRW,
    name: 'South Korean Won',
    minimumAmount: 500, // ₩500 equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true
  },
  [StripeCurrency.INR]: {
    code: StripeCurrency.INR,
    name: 'Indian Rupee',
    minimumAmount: 50, // ₹0.50
    isZeroDecimal: false,
    supportsAmericanExpress: true,
    maxDigits: 9
  },
  [StripeCurrency.THB]: {
    code: StripeCurrency.THB,
    name: 'Thai Baht',
    minimumAmount: 1000, // ฿10
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.MYR]: {
    code: StripeCurrency.MYR,
    name: 'Malaysian Ringgit',
    minimumAmount: 200, // RM 2
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.IDR]: {
    code: StripeCurrency.IDR,
    name: 'Indonesian Rupiah',
    minimumAmount: 5000, // Rp 50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: false, // Not supported by American Express
    maxDigits: 12
  },
  [StripeCurrency.PHP]: {
    code: StripeCurrency.PHP,
    name: 'Philippine Peso',
    minimumAmount: 50, // ₱0.50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.VND]: {
    code: StripeCurrency.VND,
    name: 'Vietnamese Dong',
    minimumAmount: 10000, // ₫100 equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true
  },
  [StripeCurrency.TWD]: {
    code: StripeCurrency.TWD,
    name: 'New Taiwan Dollar',
    minimumAmount: 15, // NT$15 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true,
    specialConditions: ['Zero-decimal for payouts, must be divisible by 100']
  },
  
  // European currencies
  [StripeCurrency.NOK]: {
    code: StripeCurrency.NOK,
    name: 'Norwegian Krone',
    minimumAmount: 300, // 3.00-kr.
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.SEK]: {
    code: StripeCurrency.SEK,
    name: 'Swedish Krona',
    minimumAmount: 300, // 3.00-kr.
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.DKK]: {
    code: StripeCurrency.DKK,
    name: 'Danish Krone',
    minimumAmount: 250, // 2.50-kr.
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.PLN]: {
    code: StripeCurrency.PLN,
    name: 'Polish Zloty',
    minimumAmount: 200, // 2.00 zł
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.CZK]: {
    code: StripeCurrency.CZK,
    name: 'Czech Koruna',
    minimumAmount: 1500, // 15.00Kč
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.HUF]: {
    code: StripeCurrency.HUF,
    name: 'Hungarian Forint',
    minimumAmount: 17500, // 175.00 Ft
    isZeroDecimal: false,
    supportsAmericanExpress: true,
    specialConditions: ['Zero-decimal for payouts, must be divisible by 100'],
    maxDigits: 10
  },
  [StripeCurrency.RON]: {
    code: StripeCurrency.RON,
    name: 'Romanian Leu',
    minimumAmount: 200, // lei2.00
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.BGN]: {
    code: StripeCurrency.BGN,
    name: 'Bulgarian Lev',
    minimumAmount: 100, // лв1.00
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  
  // Middle East & Africa
  [StripeCurrency.AED]: {
    code: StripeCurrency.AED,
    name: 'UAE Dirham',
    minimumAmount: 200, // 2.00 د.إ
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.SAR]: {
    code: StripeCurrency.SAR,
    name: 'Saudi Riyal',
    minimumAmount: 200, // 2.00 ر.س equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.QAR]: {
    code: StripeCurrency.QAR,
    name: 'Qatari Riyal',
    minimumAmount: 200, // 2.00 ر.ق equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.EGP]: {
    code: StripeCurrency.EGP,
    name: 'Egyptian Pound',
    minimumAmount: 50, // £0.50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.ZAR]: {
    code: StripeCurrency.ZAR,
    name: 'South African Rand',
    minimumAmount: 50, // R0.50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.NGN]: {
    code: StripeCurrency.NGN,
    name: 'Nigerian Naira',
    minimumAmount: 50, // ₦0.50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.KES]: {
    code: StripeCurrency.KES,
    name: 'Kenyan Shilling',
    minimumAmount: 50, // KSh0.50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.GHS]: {
    code: StripeCurrency.GHS,
    name: 'Ghanaian Cedi',
    minimumAmount: 50, // ₵0.50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  
  // Latin America
  [StripeCurrency.BRL]: {
    code: StripeCurrency.BRL,
    name: 'Brazilian Real',
    minimumAmount: 50, // R$0.50
    isZeroDecimal: false,
    supportsAmericanExpress: false // Not supported by American Express
  },
  [StripeCurrency.MXN]: {
    code: StripeCurrency.MXN,
    name: 'Mexican Peso',
    minimumAmount: 1000, // $10
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.ARS]: {
    code: StripeCurrency.ARS,
    name: 'Argentine Peso',
    minimumAmount: 50, // $0.50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: false // Not supported by American Express
  },
  [StripeCurrency.CLP]: {
    code: StripeCurrency.CLP,
    name: 'Chilean Peso',
    minimumAmount: 500, // $500 equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: false // Not supported by American Express
  },
  [StripeCurrency.COP]: {
    code: StripeCurrency.COP,
    name: 'Colombian Peso',
    minimumAmount: 2000, // $2,000 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: false, // Not supported by American Express
    maxDigits: 10
  },
  [StripeCurrency.PEN]: {
    code: StripeCurrency.PEN,
    name: 'Peruvian Sol',
    minimumAmount: 200, // S/2.00 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: false // Not supported by American Express
  },
  [StripeCurrency.UYU]: {
    code: StripeCurrency.UYU,
    name: 'Uruguayan Peso',
    minimumAmount: 20, // $U20 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: false // Not supported by American Express
  },
  
  // Other currencies
  [StripeCurrency.NZD]: {
    code: StripeCurrency.NZD,
    name: 'New Zealand Dollar',
    minimumAmount: 50, // $0.50
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.ISK]: {
    code: StripeCurrency.ISK,
    name: 'Icelandic Krona',
    minimumAmount: 50, // 50 kr equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true,
    specialConditions: ['Zero-decimal currency but backwards compatible as two-decimal']
  },
  [StripeCurrency.TRY]: {
    code: StripeCurrency.TRY,
    name: 'Turkish Lira',
    minimumAmount: 50, // ₺0.50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.RUB]: {
    code: StripeCurrency.RUB,
    name: 'Russian Ruble',
    minimumAmount: 50, // ₽0.50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.UAH]: {
    code: StripeCurrency.UAH,
    name: 'Ukrainian Hryvnia',
    minimumAmount: 50, // ₴0.50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  [StripeCurrency.ILS]: {
    code: StripeCurrency.ILS,
    name: 'Israeli Shekel',
    minimumAmount: 50, // ₪0.50 equivalent
    isZeroDecimal: false,
    supportsAmericanExpress: true
  },
  
  // Zero-decimal currencies
  [StripeCurrency.BIF]: {
    code: StripeCurrency.BIF,
    name: 'Burundian Franc',
    minimumAmount: 100, // 100 FBu equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true
  },
  [StripeCurrency.DJF]: {
    code: StripeCurrency.DJF,
    name: 'Djiboutian Franc',
    minimumAmount: 100, // 100 Fdj equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true
  },
  [StripeCurrency.GNF]: {
    code: StripeCurrency.GNF,
    name: 'Guinean Franc',
    minimumAmount: 5000, // 5,000 FG equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true
  },
  [StripeCurrency.KMF]: {
    code: StripeCurrency.KMF,
    name: 'Comorian Franc',
    minimumAmount: 100, // 100 KMF equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true
  },
  [StripeCurrency.MGA]: {
    code: StripeCurrency.MGA,
    name: 'Malagasy Ariary',
    minimumAmount: 200, // 200 Ar equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true
  },
  [StripeCurrency.PYG]: {
    code: StripeCurrency.PYG,
    name: 'Paraguayan Guaraní',
    minimumAmount: 2000, // ₲2,000 equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: false // Not supported by American Express
  },
  [StripeCurrency.RWF]: {
    code: StripeCurrency.RWF,
    name: 'Rwandan Franc',
    minimumAmount: 100, // 100 RF equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true
  },
  [StripeCurrency.UGX]: {
    code: StripeCurrency.UGX,
    name: 'Ugandan Shilling',
    minimumAmount: 2000, // USh2,000 equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true,
    specialConditions: ['Zero-decimal currency but backwards compatible as two-decimal']
  },
  [StripeCurrency.VUV]: {
    code: StripeCurrency.VUV,
    name: 'Vanuatu Vatu',
    minimumAmount: 50, // 50 Vt equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true
  },
  [StripeCurrency.XAF]: {
    code: StripeCurrency.XAF,
    name: 'Central African CFA Franc',
    minimumAmount: 100, // 100 FCFA equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true
  },
  [StripeCurrency.XOF]: {
    code: StripeCurrency.XOF,
    name: 'West African CFA Franc',
    minimumAmount: 100, // 100 FCFA equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true
  },
  [StripeCurrency.XPF]: {
    code: StripeCurrency.XPF,
    name: 'CFP Franc',
    minimumAmount: 50, // 50 F equivalent
    isZeroDecimal: true,
    supportsAmericanExpress: true
  }
};

/**
 * Get currency information by code
 */
export function getCurrencyInfo(currency: StripeCurrency): CurrencyInfo {
  return CURRENCY_INFO[currency];
}

/**
 * Validate amount for a given currency
 */
export function validateAmount(amount: number, currency: StripeCurrency): {
  isValid: boolean;
  error?: string;
  info: CurrencyInfo;
} {
  const info = getCurrencyInfo(currency);
  
  // Check minimum amount
  if (amount < info.minimumAmount) {
    return {
      isValid: false,
      error: `Amount must be at least ${info.minimumAmount} ${info.code.toUpperCase()} (${formatAmount(amount, currency)} is too low)`,
      info
    };
  }
  
  // Check maximum digits
  if (info.maxDigits && amount.toString().length > info.maxDigits) {
    return {
      isValid: false,
      error: `Amount exceeds maximum digits (${info.maxDigits}) for ${info.code.toUpperCase()}`,
      info
    };
  }
  
  // Check special conditions for certain currencies
  if (info.specialConditions) {
    if (currency === StripeCurrency.HUF || currency === StripeCurrency.TWD) {
      // Must be divisible by 100 for payouts
      if (amount % 100 !== 0) {
        return {
          isValid: false,
          error: `Amount must be divisible by 100 for ${info.code.toUpperCase()} payouts`,
          info
        };
      }
    }
  }
  
  return {
    isValid: true,
    info
  };
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: StripeCurrency): string {
  const info = getCurrencyInfo(currency);
  
  if (info.isZeroDecimal) {
    return `${amount} ${info.code.toUpperCase()}`;
  } else {
    const major = amount / 100;
    return `${major.toFixed(2)} ${info.code.toUpperCase()}`;
  }
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): CurrencyInfo[] {
  return Object.values(CURRENCY_INFO);
}

/**
 * Get currencies that support American Express
 */
export function getAmericanExpressSupportedCurrencies(): CurrencyInfo[] {
  return getSupportedCurrencies().filter(currency => currency.supportsAmericanExpress);
}

/**
 * Get zero-decimal currencies
 */
export function getZeroDecimalCurrencies(): CurrencyInfo[] {
  return getSupportedCurrencies().filter(currency => currency.isZeroDecimal);
}

/**
 * Convert dollars to cents for Stripe
 */
export function convertToCents(amountInDollars: number): number {
  return Math.round(amountInDollars * 100);
}
