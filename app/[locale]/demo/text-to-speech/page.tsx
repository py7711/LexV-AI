import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeVoiceShell } from "@/components/devoice-shell";
import { DeVoiceToolPage, getLocalizedToolConfig, toolConfigs } from "@/components/devoice-tool-page";
import { isLocale, localizedPath, locales, siteUrl, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const locale = rawLocale as Locale;
  const config = getLocalizedToolConfig(toolConfigs["text-to-speech"], locale);
  const canonical = `${siteUrl}${localizedPath(locale, "demo/text-to-speech")}`;

  return {
    title: `${config.title} | DeVoice`,
    description: config.description,
    alternates: {
      canonical,
      languages: Object.fromEntries(locales.map((item) => [item, `${siteUrl}${localizedPath(item, "demo/text-to-speech")}`]))
    }
  };
}

export default async function TextToSpeechDemoPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;

  return (
    <DeVoiceShell locale={locale}>
      <DeVoiceToolPage config={toolConfigs["text-to-speech"]} locale={locale} />
    </DeVoiceShell>
  );
}
