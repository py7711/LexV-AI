import type { Metadata } from "next";
import Image from "next/image";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { isLocale, localizedPath, siteUrl, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; token?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    title: "Reset password | DeVoice",
    description: "Reset your DeVoice password.",
    alternates: {
      canonical: `${siteUrl}${localizedPath(locale, "reset-password")}`
    }
  };
}

export default async function ResetPasswordPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  const query = await searchParams;

  return (
    <main className="resetPasswordPage">
      <a className="devoiceBrand" href={localizedPath(locale)}>
        <span className="devoiceLogo" aria-hidden="true">
          <Image src="/devoice-assets/devoice-logo.png" alt="" width={28} height={28} priority />
        </span>
        <span>DeVoice</span>
      </a>
      <ResetPasswordForm email={query.email ?? ""} token={query.token ?? ""} locale={locale} />
    </main>
  );
}
