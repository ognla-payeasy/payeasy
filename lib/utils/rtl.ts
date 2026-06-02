const RTL_LOCALES = new Set([
  "ar", "arc", "dv", "fa", "ha", "he", "khw", "ks", "ku", "ps", "ur", "yi",
]);

export function isRTLLocale(locale: string): boolean {
  const lang = locale.split("-")[0].toLowerCase();
  return RTL_LOCALES.has(lang);
}

export function getDocumentDirection(locale: string): "ltr" | "rtl" {
  return isRTLLocale(locale) ? "rtl" : "ltr";
}
