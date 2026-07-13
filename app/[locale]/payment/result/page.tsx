import { LoaderCircle } from "lucide-react";
import { DeVoiceShell } from "@/components/devoice-shell";
import { isLocale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    credits?: string;
    plan?: string;
    kind?: string;
  }>;
};

export default async function PaymentResultPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  await searchParams;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const title = locale.startsWith("zh") ? "支付成功" : "Payment Successful";
  const description = locale.startsWith("zh") ? "正在返回..." : "Returning...";

  return (
    <DeVoiceShell locale={locale}>
      <main className="paymentRedirectShell paymentResultDark">
        <section className="paymentRedirectPanel paymentResultMinimal">
          <LoaderCircle className="paymentRedirectSpinner" size={44} aria-hidden="true" />
          <h1>{title}</h1>
          <p>{description}</p>
        </section>
      </main>
    </DeVoiceShell>
  );
}
