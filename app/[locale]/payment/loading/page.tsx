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
  const title = locale.startsWith("zh") ? "正在确认支付" : "Confirming payment";
  const description = locale.startsWith("zh")
    ? "DeVoice 正在确认你的付款和 credits。页面会自动跳转到支付结果。"
    : "DeVoice is confirming your payment and credits. This page will continue to the payment result automatically.";

  return (
    <DeVoiceShell locale={locale}>
      <main className="dashboardShell paymentResultShell">
        <section className="resourcePage paymentResultPage">
          <div className="paymentResultHero paymentLoadingHero">
            <span className="paymentResultIcon paymentResultIconSuccess paymentLoadingIcon">
              <LoaderCircle size={34} aria-hidden="true" />
            </span>
            <div>
              <span className="sectionKicker">DeVoice Checkout</span>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </div>
          <meta httpEquiv="refresh" content={`2;url=${resultHref}`} />
          <div className="paymentResultActions">
            <a className="btn btnPrimary" href={resultHref}>
              {locale.startsWith("zh") ? "查看支付结果" : "View payment result"}
            </a>
          </div>
        </section>
      </main>
    </DeVoiceShell>
  );
}
