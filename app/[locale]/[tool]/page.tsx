import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeVoiceShell } from "@/components/devoice-shell";
import { DeVoiceStaticPage, getStaticPageConfig, staticPageConfigs } from "@/components/devoice-static-page";
import { DeVoiceToolPage, getLocalizedToolConfig, getToolConfig, toolConfigs } from "@/components/devoice-tool-page";
import { isLocale, localizedPath, locales, siteUrl, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string; tool: string }>;
};

export async function generateStaticParams() {
  return [...Object.keys(toolConfigs).filter((tool) => tool !== "home"), ...Object.keys(staticPageConfigs)]
    .flatMap((tool) => locales.map((locale) => ({ locale, tool })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, tool } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const config = getToolConfig(tool);
  const staticConfig = getStaticPageConfig(tool);
  if ((!config || config.slug === "home") && !staticConfig) {
    return {};
  }

  const locale = rawLocale as Locale;
  const canonical = `${siteUrl}${localizedPath(locale, tool)}`;
  const localizedConfig = config ? getLocalizedToolConfig(config, locale) : undefined;
  const title = localizedConfig?.slug === "home" ? staticConfig?.title : (localizedConfig?.title ?? staticConfig?.title);
  const metadataTitle = localizedConfig?.slug === "home" ? staticConfig?.seoTitle ?? staticConfig?.title : (localizedConfig?.seoTitle ?? staticConfig?.seoTitle ?? title);
  const description = localizedConfig?.slug === "home" ? staticConfig?.description : (localizedConfig?.seoDescription ?? localizedConfig?.description ?? staticConfig?.description);

  if (!metadataTitle || !description) {
    return {};
  }

  return {
    title: metadataTitle,
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries(locales.map((item) => [item, `${siteUrl}${localizedPath(item, tool)}`]))
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "DeVoice",
      title: metadataTitle,
      description,
      locale
    },
    twitter: {
      card: "summary_large_image",
      title: metadataTitle,
      description
    }
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { locale: rawLocale, tool } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const config = getToolConfig(tool);
  const locale = rawLocale as Locale;

  if (config && config.slug !== "home") {
    return (
      <DeVoiceShell locale={locale}>
        <DeVoiceToolPage config={config} locale={locale} />
      </DeVoiceShell>
    );
  }

  const staticConfig = getStaticPageConfig(tool);
  if (staticConfig) {
    return <DeVoiceStaticPage locale={locale} config={staticConfig} />;
  }

  notFound();
}
