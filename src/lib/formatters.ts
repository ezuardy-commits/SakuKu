export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  digits: number;
}

export const WORLD_CURRENCIES: CurrencyInfo[] = [
  { code: 'IDR', symbol: 'Rp', name: 'Rupiah (IDR)', locale: 'id-ID', digits: 0 },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', locale: 'en-US', digits: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', locale: 'de-DE', digits: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', locale: 'en-GB', digits: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)', locale: 'ja-JP', digits: 0 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD)', locale: 'en-SG', digits: 2 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit (MYR)', locale: 'ms-MY', digits: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD)', locale: 'en-AU', digits: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (CAD)', locale: 'en-CA', digits: 2 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan (CNY)', locale: 'zh-CN', digits: 2 },
  { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal (SAR)', locale: 'ar-SA', digits: 2 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)', locale: 'ar-AE', digits: 2 },
];

export function formatCurrency(amount: number, currencyCode?: string): string {
  const activeCurrency =
    currencyCode || (typeof localStorage !== 'undefined' ? localStorage.getItem('sakuku_currency') || 'IDR' : 'IDR');
  if (isNaN(amount) || amount === null || amount === undefined) {
    const curr = WORLD_CURRENCIES.find((c) => c.code === activeCurrency) || WORLD_CURRENCIES[0];
    return `${curr.symbol}0`;
  }
  const curr = WORLD_CURRENCIES.find((c) => c.code === activeCurrency) || WORLD_CURRENCIES[0];
  try {
    const formatted = new Intl.NumberFormat(curr.locale, {
      style: 'currency',
      currency: curr.code,
      maximumFractionDigits: curr.digits,
      minimumFractionDigits: curr.digits,
    }).format(amount);
    return formatted.replace(/\s+/g, ' ');
  } catch (e) {
    return `${curr.symbol} ${amount.toLocaleString()}`;
  }
}

export function formatRupiah(amount: number, currencyCode?: string): string {
  return formatCurrency(amount, currencyCode);
}

export function parseTxDate(dateString: string): Date {
  if (!dateString) return new Date();
  if (dateString.length >= 10 && dateString.includes('-')) {
    const dateOnly = dateString.split('T')[0];
    const parts = dateOnly.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
  }
  return new Date(dateString);
}

export function formatDate(dateString: string, lang: 'id' | 'en' = 'id'): string {
  if (!dateString) return '';
  const date = parseTxDate(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = date.getDate();
  const shortMonths = lang === 'id'
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${shortMonths[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateIndonesian(dateString: string, lang: 'id' | 'en' = 'id'): string {
  return formatDate(dateString, lang);
}

export function formatExactDateIndonesian(dateString: string): string {
  if (!dateString) return '';
  const date = parseTxDate(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatExactShortDateIndonesian(dateString: string): string {
  if (!dateString) return '';
  const date = parseTxDate(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = String(date.getDate()).padStart(2, '0');
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${day} ${shortMonths[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTime(dateString: string, lang: 'id' | 'en' = 'id'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatAmountInput(val: string | number): string {
  if (val === undefined || val === null || val === '') return '';
  const cleanDigits = String(val).replace(/\D/g, '');
  if (!cleanDigits) return '';
  return parseInt(cleanDigits, 10).toLocaleString('id-ID');
}

export function parseAmountNumber(val: string | number): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleanDigits = String(val).replace(/\D/g, '');
  return parseFloat(cleanDigits) || 0;
}

