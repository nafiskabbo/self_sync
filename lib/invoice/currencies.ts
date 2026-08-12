export type Currency = {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  /** Symbol string that is safe to render in jsPDF's default fonts. */
  pdf: string;
  decimals: number;
};

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US", pdf: "$", decimals: 2 },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE", pdf: "€", decimals: 2 },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB", pdf: "£", decimals: 2 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP", pdf: "¥", decimals: 0 },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", locale: "en-CA", pdf: "CA$", decimals: 2 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU", pdf: "A$", decimals: 2 },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", locale: "en-NZ", pdf: "NZ$", decimals: 2 },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG", pdf: "S$", decimals: 2 },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", locale: "en-HK", pdf: "HK$", decimals: 2 },
  { code: "CHF", symbol: "Fr.", name: "Swiss Franc", locale: "de-CH", pdf: "CHF ", decimals: 2 },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN", pdf: "¥", decimals: 2 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN", pdf: "INR ", decimals: 2 },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", locale: "sv-SE", pdf: "kr ", decimals: 2 },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", locale: "nb-NO", pdf: "kr ", decimals: 2 },
  { code: "DKK", symbol: "kr", name: "Danish Krone", locale: "da-DK", pdf: "kr ", decimals: 2 },
  { code: "PLN", symbol: "zł", name: "Polish Zloty", locale: "pl-PL", pdf: "PLN ", decimals: 2 },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna", locale: "cs-CZ", pdf: "CZK ", decimals: 2 },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint", locale: "hu-HU", pdf: "HUF ", decimals: 2 },
  { code: "RON", symbol: "lei", name: "Romanian Leu", locale: "ro-RO", pdf: "RON ", decimals: 2 },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev", locale: "bg-BG", pdf: "BGN ", decimals: 2 },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", locale: "tr-TR", pdf: "TRY ", decimals: 2 },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", locale: "ru-RU", pdf: "RUB ", decimals: 2 },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia", locale: "uk-UA", pdf: "UAH ", decimals: 2 },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel", locale: "he-IL", pdf: "ILS ", decimals: 2 },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE", pdf: "AED ", decimals: 2 },
  { code: "SAR", symbol: "ر.س", name: "Saudi Riyal", locale: "ar-SA", pdf: "SAR ", decimals: 2 },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal", locale: "ar-QA", pdf: "QAR ", decimals: 2 },
  { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA", pdf: "R ", decimals: 2 },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR", pdf: "R$ ", decimals: 2 },
  { code: "MXN", symbol: "$", name: "Mexican Peso", locale: "es-MX", pdf: "$", decimals: 2 },
  { code: "ARS", symbol: "$", name: "Argentine Peso", locale: "es-AR", pdf: "$", decimals: 2 },
  { code: "CLP", symbol: "$", name: "Chilean Peso", locale: "es-CL", pdf: "$", decimals: 0 },
  { code: "COP", symbol: "$", name: "Colombian Peso", locale: "es-CO", pdf: "$", decimals: 2 },
  { code: "PEN", symbol: "S/", name: "Peruvian Sol", locale: "es-PE", pdf: "S/ ", decimals: 2 },
  { code: "THB", symbol: "฿", name: "Thai Baht", locale: "th-TH", pdf: "THB ", decimals: 2 },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", locale: "id-ID", pdf: "Rp ", decimals: 2 },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", locale: "ms-MY", pdf: "RM ", decimals: 2 },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", locale: "fil-PH", pdf: "PHP ", decimals: 2 },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", locale: "vi-VN", pdf: "VND ", decimals: 0 },
  { code: "KRW", symbol: "₩", name: "South Korean Won", locale: "ko-KR", pdf: "KRW ", decimals: 0 },
  { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar", locale: "zh-TW", pdf: "NT$", decimals: 2 },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", locale: "en-PK", pdf: "PKR ", decimals: 2 },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", locale: "bn-BD", pdf: "BDT ", decimals: 2 },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", locale: "en-NG", pdf: "NGN ", decimals: 2 },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", locale: "en-KE", pdf: "KSh ", decimals: 2 },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi", locale: "en-GH", pdf: "GHS ", decimals: 2 },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound", locale: "ar-EG", pdf: "EGP ", decimals: 2 },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee", locale: "en-LK", pdf: "LKR ", decimals: 2 },
  { code: "MAD", symbol: "DH", name: "Moroccan Dirham", locale: "ar-MA", pdf: "MAD ", decimals: 2 },
  { code: "KWD", symbol: "KD", name: "Kuwaiti Dinar", locale: "ar-KW", pdf: "KD ", decimals: 3 },
  { code: "OMR", symbol: "ر.ع", name: "Omani Rial", locale: "ar-OM", pdf: "OMR ", decimals: 3 },
];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function formatMoney(amount: number, currency: Currency): string {
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
    }).format(amount);
  } catch {
    return `${currency.symbol}${amount.toFixed(currency.decimals)}`;
  }
}

/** Currency formatting with characters guaranteed safe for jsPDF's built-in fonts. */
export function formatPdfMoney(amount: number, currency: Currency): string {
  const n = amount.toLocaleString("en-US", {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });
  return `${currency.pdf}${n}`;
}