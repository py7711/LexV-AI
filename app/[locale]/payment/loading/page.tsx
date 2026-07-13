import { LoaderCircle } from "lucide-react";
import { DeVoiceShell } from "@/components/devoice-shell";
import { isLocale, localizedPath } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    credits?: string;
    plan?: string;
    kind?: string;
  }>;
};

export default async function PaymentLoadingPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const query = await searchParams;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const resultQuery = new URLSearchParams();
  resultQuery.set("billing", "success");
  if (query.credits) resultQuery.set("credits", query.credits);
  if (query.plan) resultQuery.set("plan", query.plan);
  if (query.kind) resultQuery.set("kind", query.kind);
  const resultHref = `${localizedPath(locale, "payment/result")}?${resultQuery.toString()}`;
  const title = locale.startsWith("zh") ? "正在跳转到安全支付页面" : "Redirecting to Secure Payment Page";
  const description = locale.startsWith("zh")
    ? "请不要刷新或关闭此窗口..."
    : "Please do not refresh or close this window...";

  return (
    <DeVoiceShell locale={locale}>
      <main className="paymentRedirectShell">
        <section className="paymentRedirectPanel">
          <LoaderCircle className="paymentRedirectSpinner" size={44} aria-hidden="true" />
          <h1>{title}</h1>
          <p>{description}</p>
          <meta httpEquiv="refresh" content={`2;url=${resultHref}`} />
        </section>
      </main>
    </DeVoiceShell>
  );
}
