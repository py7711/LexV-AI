import type { Metadata } from "next";
import { DeVoicePricingClient } from "@/components/devoice-pricing-client";
import { DeVoiceShell } from "@/components/devoice-shell";
import { getDictionary, isLocale, localizedPath, siteUrl, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const t = getDictionary(locale).pricing;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: `${siteUrl}${localizedPath(locale, "pricing")}`
    }
  };
}

export default async function PricingPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";

  return (
    <DeVoiceShell locale={locale}>
      <section className="pricingPage pricingShellPage">
        <DeVoicePricingClient locale={locale} />
      </section>
    </DeVoiceShell>
  );
}
