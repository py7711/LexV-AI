import { notFound } from "next/navigation";
import { LocaleHtmlLang } from "@/components/locale-html-lang";
import { isLocale } from "@/lib/i18n";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <>
      <LocaleHtmlLang locale={locale} />
      {children}
    </>
  );
}
