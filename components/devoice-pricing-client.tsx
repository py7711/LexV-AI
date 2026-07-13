"use client";

import { Fragment, type ReactNode } from "react";
import { useState } from "react";
import { CheckCircle2, CreditCard } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";

type BillingPlan = "entry" | "standard" | "comprehensive" | "elite" | "basic" | "pro" | "subscription_elite" | "credit_package";

type OneTimePlan = {
  plan: "entry" | "standard" | "comprehensive" | "elite";
  credits: string;
  bonus: string;
  oldPrice: string;
  price: string;
  save: string;
  transcriber: string;
  music: string;
  voice: string;
  noise: string;
  value: string;
  featured?: boolean;
};

type SubscriptionPlan = {
  plan: "basic" | "pro" | "subscription_elite";
  price: string;
  oldPrice: string;
  yearlyPrice: string;
  credits: string;
  transcriber: string;
  music: string;
  voice: string;
  noise: string;
  value: string;
  features: string[];
  badge?: string;
  featured?: boolean;
};

const oneTimePlans: OneTimePlan[] = [
  {
    plan: "entry",
    credits: "1,200 credits",
    bonus: "+200 bonus",
    oldPrice: "$9.99",
    price: "$7.99",
    save: "Save 20%",
    transcriber: "600 minutes",
    music: "up to 100 uses",
    voice: "up to 600 uses",
    noise: "6,000 seconds",
    value: "$6.66 per 1,000 credits",
  },
  {
    plan: "standard",
    credits: "2,600 credits",
    bonus: "+600 bonus",
    oldPrice: "$19.99",
    price: "$14.99",
    save: "Save 25%",
    transcriber: "1,300 minutes",
    music: "up to 217 uses",
    voice: "up to 1,300 uses",
    noise: "13,000 seconds",
    value: "$5.77 per 1,000 credits",
    featured: true
  },
  {
    plan: "comprehensive",
    credits: "7,000 credits",
    bonus: "+2,000 bonus",
    oldPrice: "$49.99",
    price: "$34.99",
    save: "Save 30%",
    transcriber: "3,500 minutes",
    music: "up to 583 uses",
    voice: "up to 3,500 uses",
    noise: "35,000 seconds",
    value: "$5.00 per 1,000 credits",
  },
  {
    plan: "elite",
    credits: "15,000 credits",
    bonus: "+5,000 bonus",
    oldPrice: "$99.99",
    price: "$69.99",
    save: "Save 30%",
    transcriber: "7,500 minutes",
    music: "up to 1,250 uses",
    voice: "up to 7,500 uses",
    noise: "75,000 seconds",
    value: "$4.67 per 1,000 credits",
  }
];

const subscriptionPlans: SubscriptionPlan[] = [
  {
    plan: "basic",
    price: "$6.67",
    oldPrice: "$119.88",
    yearlyPrice: "$89.99 / year",
    credits: "1,000 credits / month",
    transcriber: "up to 500 minutes / month",
    music: "up to 83 uses / month",
    voice: "up to 500 uses / month",
    noise: "up to 5,000 seconds (≈ 83 minutes)",
    value: "Equivalent to $7.49 / month",
    features: ["Standard processing queue", "Unlimited file downloads", "Email support"],
    featured: true
  },
  {
    plan: "pro",
    price: "$25.00",
    oldPrice: "$479.88",
    yearlyPrice: "$299.99 / year",
    credits: "4,800 credits / month",
    transcriber: "up to 2,400 minutes / month",
    music: "up to 400 uses / month",
    voice: "up to 2,400 uses / month",
    noise: "up to 24,000 seconds (≈ 400 minutes)",
    value: "Equivalent to $24.99 / month",
    features: ["Priority processing queue", "Unlimited file downloads", "Priority email support"],
    badge: "popular"
  },
  {
    plan: "subscription_elite",
    price: "$66.67",
    oldPrice: "$1,199.88",
    yearlyPrice: "$799.99 / year",
    credits: "12,000 credits / month",
    transcriber: "up to 6,000 minutes / month",
    music: "up to 1,000 uses / month",
    voice: "up to 6,000 uses / month",
    noise: "up to 60,000 seconds (≈ 1,000 minutes)",
    value: "Equivalent to $66.67 / month",
    features: ["Highest priority processing", "Unlimited file downloads", "VIP dedicated support"]
  }
];

export function DeVoicePricingClient({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).pricing;
  const [mode, setMode] = useState<"one-time" | "subscription">("one-time");
  const [selectedOneTimePlan, setSelectedOneTimePlan] = useState<OneTimePlan["plan"]>("standard");
  const isOneTime = mode === "one-time";
  const selectedPlan = oneTimePlans.find((plan) => plan.plan === selectedOneTimePlan) ?? oneTimePlans[1] ?? oneTimePlans[0];
  const localizedSubscriptionPlans = subscriptionPlans.map((plan) => ({
    ...plan,
    name:
      plan.plan === "basic"
        ? t.basicPlan
        : plan.plan === "pro"
          ? t.proPlan
          : t.elitePlan,
    tagline:
      plan.plan === "basic"
        ? t.perfectLightUsers
        : plan.plan === "pro"
          ? t.bestValueCreators
          : t.powerUsersTeams,
    bestFor:
      plan.plan === "basic"
        ? t.perfectLightUsers
        : plan.plan === "pro"
          ? t.bestValueCreators
          : t.powerUsersTeams,
    badge: plan.badge ? t.mostPopularChoice : undefined,
    credits: withMonthlyUnit(plan.credits, t),
    transcriber: withMonthlyUnit(plan.transcriber, t),
    music: withMonthlyUnit(plan.music, t),
    voice: withMonthlyUnit(plan.voice, t),
    noise: withMonthlyUnit(plan.noise, t),
    features:
      plan.plan === "basic"
        ? [t.standardQueue, t.unlimitedDownloads, t.emailSupport]
        : plan.plan === "pro"
          ? [t.priorityQueue, t.unlimitedDownloads, t.priorityEmailSupport]
          : [t.highestPriority, t.unlimitedDownloads, t.vipSupport]
  }));

  return (
    <>
      <div className="pricingHeader">
        <h1>{t.title}</h1>
        <div className={`pricingTabs ${isOneTime ? "pricingTabsOneTime" : "pricingTabsSubscription"}`} aria-label="Pricing mode">
          <button className={isOneTime ? "modeActive" : ""} type="button" onClick={() => setMode("one-time")}>
            {t.oneTime}
          </button>
          <button className={!isOneTime ? "modeActive" : ""} type="button" onClick={() => setMode("subscription")}>
            {t.subscription}
          </button>
        </div>
        {isOneTime ? <p>{t.oneTimeDescription}</p> : null}
      </div>

      {isOneTime ? (
        <>
          <div className="pricingPackageGrid">
            {oneTimePlans.map((plan) => {
              const isSelected = selectedOneTimePlan === plan.plan;
              return (
                <Fragment key={plan.plan}>
                  <SelectablePlanCard
                    isSelected={isSelected}
                    onSelect={() => setSelectedOneTimePlan(plan.plan)}
                    plan={plan}
                    t={t}
                  />
                  {isSelected ? <SelectedPlanDetails plan={plan} t={t} /> : null}
                </Fragment>
              );
            })}
          </div>
          {selectedPlan ? <SelectedPlanCheckout locale={locale} plan={selectedPlan} t={t} /> : null}
        </>
      ) : (
        <div className="pricingSubscriptionPanel">
          <p className="pricingNotice">{t.subscriptionNotice}</p>
          <div className="subscriptionSkeletonGrid" aria-hidden="true">
            {localizedSubscriptionPlans.map((plan) => (
              <article className="subscriptionSkeletonCard" key={plan.plan}>
                <span className="subscriptionSkeletonLine subscriptionSkeletonShort" />
                <span className="subscriptionSkeletonLine subscriptionSkeletonMedium" />
                <span className="subscriptionSkeletonLine subscriptionSkeletonWide" />
                <span className="subscriptionSkeletonRule" />
                <span className="subscriptionSkeletonLine subscriptionSkeletonWide" />
                <span className="subscriptionSkeletonLine subscriptionSkeletonMedium" />
                <span className="subscriptionSkeletonButton" />
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function noiseMinutes(plan: OneTimePlan["plan"]) {
  if (plan === "entry") return "100";
  if (plan === "standard") return "217";
  if (plan === "comprehensive") return "583";
  return "1,250";
}

function oneTimePlanName(plan: OneTimePlan["plan"], t: ReturnType<typeof getDictionary>["pricing"]) {
  if (plan === "entry") return t.entryPackage;
  if (plan === "standard") return t.standardPackage;
  if (plan === "comprehensive") return t.comprehensivePackage;
  return t.elitePackage;
}

function oneTimeBestFor(plan: OneTimePlan["plan"], t: ReturnType<typeof getDictionary>["pricing"]) {
  if (plan === "entry") return t.lightUsersAndBeginners;
  if (plan === "standard") return t.regularUsers;
  if (plan === "comprehensive") return t.contentCreatorsAndSmallTeams;
  return t.heavyCreatorsAgencies;
}

function formatNoiseEstimate(plan: OneTimePlan, t: ReturnType<typeof getDictionary>["pricing"]) {
  const seconds = plan.noise.replace(" seconds", "");
  return `${seconds} ${t.secondsApproxMinutes.replace("{minutes}", noiseMinutes(plan.plan))}`;
}

function withMonthlyUnit(value: string, t: ReturnType<typeof getDictionary>["pricing"]) {
  return value
    .replace("credits / month", t.creditsPerMonth)
    .replace("minutes / month", t.minutesPerMonth)
    .replace("uses / month", t.usesPerMonth)
    .replace(/seconds \(≈ ([^)]+) minutes\)/, (_, minutes: string) => t.secondsApproxMinutes.replace("{minutes}", minutes));
}

function SelectablePlanCard({
  isSelected,
  onSelect,
  plan,
  t
}: {
  isSelected: boolean;
  onSelect: () => void;
  plan: OneTimePlan;
  t: ReturnType<typeof getDictionary>["pricing"];
}) {
  return (
    <article
      aria-pressed={isSelected}
      className={`pricingPackage pricingPackageInteractive${isSelected ? " pricingPackageFeatured" : ""}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <h2 data-save={plan.save}>{oneTimePlanName(plan.plan, t)}</h2>
      <p className="pricingCreditsLine">
        <strong>{plan.credits}</strong>
        <span>({plan.bonus})</span>
      </p>
      <div className="packagePrice">
        <del>{plan.oldPrice}</del>
        <span aria-hidden="true">→</span>
        <b>{plan.price}</b>
        <em data-save={plan.save}>({plan.save})</em>
      </div>
      <span className="pricingPackageMode">{t.oneTime.replace(" credits", "")}</span>
      <p className="pricingUsageLabel">{t.usageEstimate}</p>
      <ul className="pricingUsageList">
        <li>{t.aiTranscriber}: {plan.transcriber}</li>
        <li>{t.aiMusic}: {plan.music}</li>
        <li>{t.aiVoice}: {plan.voice}</li>
        <li>{t.aiSeparation}: {t.upTo} {formatNoiseEstimate(plan, t)}</li>
      </ul>
      <p className="pricingValueLine">{t.value} {t.equivalentTo} {plan.value}</p>
      <p className="pricingBestLine">{t.bestFor} {oneTimeBestFor(plan.plan, t)}</p>
      <FeatureChecks features={[t.priorityQueue, t.unlimitedDownloads, t.emailSupport]} />
    </article>
  );
}

function SelectedPlanDetails({ plan, t }: { plan: OneTimePlan; t: ReturnType<typeof getDictionary>["pricing"] }) {
  return (
    <section className="pricingMobilePlanDetails" aria-label={t.usageEstimate}>
      <p>{t.usageEstimate}</p>
      <ul>
        <li>{t.aiTranscriber}: <span>{plan.transcriber}</span></li>
        <li>{t.aiMusic}: <span>{plan.music}</span></li>
        <li>{t.aiVoice}: <span>{plan.voice}</span></li>
        <li>{t.aiSeparation}: <span>{t.upTo} {formatNoiseEstimate(plan, t)}</span></li>
      </ul>
      <div className="pricingMobilePlanMeta">
        <p><strong>{t.value}</strong> {t.equivalentTo} {plan.value}</p>
        <p><strong>{t.bestFor}</strong> {oneTimeBestFor(plan.plan, t)}</p>
        <p><strong>Features:</strong></p>
        <FeatureChecks features={[t.priorityQueue, t.unlimitedDownloads, t.emailSupport]} />
      </div>
    </section>
  );
}

function SelectedPlanCheckout({ locale, plan, t }: { locale: Locale; plan: OneTimePlan; t: ReturnType<typeof getDictionary>["pricing"] }) {
  return (
    <CheckoutPlanCard className="pricingCheckoutSummary" locale={locale} plan={plan.plan} errorLabel={t.unableBilling}>
      <div className="pricingPayCardSummary">
        <div>
          <span>{t.selectedPlan}</span>
          <strong>{plan.credits}</strong>
        </div>
        <div>
          <span>{t.totalPrice}</span>
          <strong>{plan.price}</strong>
        </div>
      </div>
      <span className="pricingPayCardHeading">{t.buyCreditsNow}</span>
      <div className="pricingPaymentMethods" aria-hidden="true">
        <div className="pricingPaymentMethod">
          <CreditCard size={20} aria-hidden="true" />
          <span>Card</span>
          <i />
          <i />
          <i />
        </div>
        <div className="pricingPaymentMethod">
          <span className="pricingPaypalDot" />
          <span>PayPal</span>
        </div>
      </div>
      <span className="pricingPaySubmit">{t.buyCreditsNow}</span>
      <small>{t.oneTimePurchase}</small>
    </CheckoutPlanCard>
  );
}

function CheckoutPlanCard({
  children,
  className,
  locale,
  plan,
  errorLabel
}: {
  children: ReactNode;
  className: string;
  locale: Locale;
  plan: BillingPlan;
  errorLabel: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function startBilling() {
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ locale, plan })
      });
      const data = (await response.json()) as { checkout?: { url?: string }; error?: string };
      const url = data.checkout?.url;

      if (!response.ok || !url) {
        setMessage(data.error ?? errorLabel);
        if (response.status === 401) {
          window.dispatchEvent(new Event("devoice:open-auth"));
        }
        return;
      }

      window.location.href = url;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      aria-busy={busy}
      className={className}
      onClick={startBilling}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          void startBilling();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {children}
      {message ? <small className="pricingCardError">{message}</small> : null}
    </div>
  );
}

function FeatureChecks({ features }: { features: string[] }) {
  return (
    <div className="featureChecks">
      {features.map((feature) => (
        <span key={feature}>
          <CheckCircle2 size={16} aria-hidden="true" />
          {feature}
        </span>
      ))}
    </div>
  );
}
