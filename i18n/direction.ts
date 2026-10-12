const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur']);
export const getDirection = (locale: string) =>
  // RTL_LOCALES.has(locale.split('-')[0]) ? 'rtl' : 'ltr';
  RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';