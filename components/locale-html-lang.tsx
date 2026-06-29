"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";

const htmlLangByLocale: Record<Locale, string> = {
  en: "en",
  it: "it",
  es: "es",
  de: "de",
  fr: "fr",
  pt: "pt",
  br: "pt-BR",
  vi: "vi",
  ru: "ru",
  id: "id",
  ja: "ja",
  hi: "hi",
  ar: "ar",
  bn: "bn",
  ur: "ur",
  "zh-cn": "zh-CN",
  "zh-tw": "zh-TW"
};

export function LocaleHtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = htmlLangByLocale[locale];
    document.documentElement.dir = locale === "ar" || locale === "ur" ? "rtl" : "ltr";
  }, [locale]);

  return null;
}
