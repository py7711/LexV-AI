import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeVoiceShell } from "@/components/devoice-shell";
import { DeVoiceToolPage, toolConfigs } from "@/components/devoice-tool-page";
import { buildMetadata, isLocale, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return buildMetadata(locale);
}

export default async function HomePage({ params }: PageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;

  return (
    <DeVoiceShell locale={locale}>
      <DeVoiceToolPage config={toolConfigs.home} locale={locale} />
    </DeVoiceShell>
  );
}
