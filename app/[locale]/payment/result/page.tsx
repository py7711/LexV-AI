import { CheckCircle2, CircleDollarSign, ReceiptText, XCircle } from "lucide-react";
import { DeVoiceShell } from "@/components/devoice-shell";
import { getDictionary, isLocale, localizedPath } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    billing?: string;
    status?: string;
    credits?: string;
    plan?: string;
    kind?: string;
  }>;
};

function isSuccessfulPayment(value?: string) {
  return !value || ["success", "succeeded", "completed", "paid"].includes(value.toLowerCase());
}

export default async function PaymentResultPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const query = await searchParams;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  const pricing = dict.pricing;
  const dashboard = dict.dashboard;
  const shell = dict.shell;
  const status = query.billing ?? query.status;
  const success = isSuccessfulPayment(status);
  const credits = Number(query.credits ?? 0);
  const creditLabel = Number.isFinite(credits) && credits > 0 ? credits.toLocaleString() : null;
  const planLabel = query.plan ? query.plan.replace(/_/g, " ") : pricing.selectedPlan.replace(/:$/, "");
  const href = (path = "") => localizedPath(locale, path);
  const title = success
    ? locale.startsWith("zh") ? "支付成功" : "Payment successful"
    : locale.startsWith("zh") ? "支付未完成" : "Payment not completed";
  const description = success
    ? locale.startsWith("zh")
      ? "你的 DeVoice credits 已添加到账户，可继续处理转写、字幕、摘要和 AI 语音任务。"
      : "Your DeVoice credits have been added to your account. You can continue processing transcripts, subtitles, summaries and AI voice jobs."
    : locale.startsWith("zh")
      ? "支付会话已取消或未完成。你可以返回价格页重新选择套餐。"
      : "The payment session was cancelled or did not finish. You can return to Pricing and choose a plan again.";

  return (
    <DeVoiceShell locale={locale}>
      <main className="dashboardShell paymentResultShell">
        <section className="resourcePage paymentResultPage">
          <div className="paymentResultHero">
            <span className={success ? "paymentResultIcon paymentResultIconSuccess" : "paymentResultIcon paymentResultIconError"}>
              {success ? <CheckCircle2 size={34} aria-hidden="true" /> : <XCircle size={34} aria-hidden="true" />}
            </span>
            <div>
              <span className="sectionKicker">{success ? pricing.creditsNeverExpire : pricing.unableBilling}</span>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </div>

          <div className="paymentResultGrid">
            <article className="paymentResultCard">
              <CircleDollarSign size={22} aria-hidden="true" />
              <span>{dashboard.creditsAvailable}</span>
              <strong>{creditLabel ? `+${creditLabel}` : success ? pricing.oneTimePurchase : "--"}</strong>
            </article>
            <article className="paymentResultCard">
              <ReceiptText size={22} aria-hidden="true" />
              <span>{pricing.selectedPlan}</span>
              <strong>{planLabel}</strong>
            </article>
          </div>

          <div className="paymentResultActions">
            <a className="btn btnPrimary" href={href("dashboard")}>
              {dashboard.title}
            </a>
            <a className="btn" href={href("my-resources")}>
              {shell.myResources}
            </a>
            <a className="btn" href={href("pricing")}>
              {shell.pricing}
            </a>
          </div>
        </section>
      </main>
    </DeVoiceShell>
  );
}
