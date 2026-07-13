"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  AudioLines,
  Captions,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Copy,
  CreditCard,
  FileAudio,
  FileVideo,
  Filter,
  Gift,
  Headphones,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  PackageOpen,
  PanelLeftClose,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  Volume2,
  X,
  Youtube
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary, localizedPath, type Locale } from "@/lib/i18n";

const checkInDismissedDateKey = "sidebar_checkin_auto_popup_dismissed_date";

type DeVoiceShellProps = {
  children: React.ReactNode;
  locale: Locale;
};

type CreditState = {
  paidCredits: number;
  freeCredits: number;
  usedCredits: number;
  totalEarnedCredits: number;
  remainingCredits: number;
  todayClaimed: boolean;
  todayReward: number;
  lastClaimedAt: string | null;
};

type AuthMode = "signin" | "signup" | "forgot";

function normalizeShellPath(pathname: string, locale: Locale) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === locale) segments.shift();
  return segments.join("/");
}

function isActiveShellPath(currentPath: string, targetPath = "") {
  return currentPath === targetPath;
}

const publicToolShellPaths = new Set([
  "audio-to-text",
  "video-to-text",
  "ai-speech-to-text",
  "remove-background-noise",
  "ai-noise-filter",
  "ai-voice-generator",
  "ai-dubbing",
  "ai-voice-actors",
  "ai-voice-enhancer-isolate",
  "ai-voice-changer",
  "ai-music-generator",
  "ai-rap-generator",
  "ai-rap-lyrics-generator",
  "audio-extract-from-video",
  "transcribe-youtube-videos",
  "youtube-transcript-generator",
  "youtube-subtitle-downloader",
  "youtube-video-summarizer",
  "demo/text-to-speech"
]);

const autoCollapsedToolShellPaths = new Set([
  "ai-dubbing",
  "ai-voice-changer",
  "ai-voice-enhancer-isolate",
  "ai-noise-filter",
  "ai-music-generator",
  "ai-rap-generator",
  "ai-rap-lyrics-generator",
  "transcribe-youtube-videos",
  "demo/text-to-speech"
]);

function usesCollapsedPublicShell(pathWithoutLocale: string) {
  return pathWithoutLocale === "blog" ||
    pathWithoutLocale.startsWith("blog/") ||
    pathWithoutLocale === "privacy-policy" ||
    pathWithoutLocale === "refund-policy" ||
    pathWithoutLocale === "terms-of-use";
}

function usesPublicContentRail(pathWithoutLocale: string) {
  return pathWithoutLocale === "blog" ||
    pathWithoutLocale.startsWith("blog/") ||
    pathWithoutLocale === "privacy-policy" ||
    pathWithoutLocale === "refund-policy" ||
    pathWithoutLocale === "terms-of-use";
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function DeVoiceLogo() {
  return (
    <span className="devoiceLogo" aria-hidden="true">
      <Image src="/devoice-assets/devoice-logo.png" alt="" width={28} height={28} priority />
    </span>
  );
}

export function DeVoiceShell({ children, locale }: DeVoiceShellProps) {
  const pathname = usePathname();
  const [creditPopover, setCreditPopover] = useState<"reward" | "details" | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [showFeedback, setShowFeedback] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const creditButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const [creditPanelStyle, setCreditPanelStyle] = useState<CSSProperties>({});
  const [accountPanelStyle, setAccountPanelStyle] = useState<CSSProperties>({});
  const [promoVisible, setPromoVisible] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInMessage, setSignInMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [creditsReady, setCreditsReady] = useState(false);
  const [credits, setCredits] = useState<CreditState>({
    paidCredits: 0,
    freeCredits: 10,
    usedCredits: 0,
    totalEarnedCredits: 10,
    remainingCredits: 10,
    todayClaimed: false,
    todayReward: 10,
    lastClaimedAt: null
  });
  const [creditMessage, setCreditMessage] = useState("");
  const { data: session, status } = useSession();
  const initials = (session?.user?.email ?? "GX").slice(0, 2).toUpperCase();
  const dict = getDictionary(locale);
  const t = dict.shell;
  const auth = dict.auth;
  const href = (path = "") => localizedPath(locale, path);
  const pathWithoutLocale = normalizeShellPath(pathname ?? "/", locale);
  const activeShellPath = pathWithoutLocale === "ai-speech-to-text" ? "" : pathWithoutLocale;
  const isAutoCollapsedToolShell = autoCollapsedToolShellPaths.has(pathWithoutLocale);
  const shellSurface = usesCollapsedPublicShell(pathWithoutLocale)
    ? "public"
    : pathWithoutLocale.startsWith("payment/")
      ? "payment"
      : "app";
  const effectiveSidebarCollapsed = sidebarCollapsed || shellSurface !== "app" || isAutoCollapsedToolShell;
  const priorityVoicePage = pathWithoutLocale === "text-to-speech" || pathWithoutLocale === "ai-voice-cloning";
  const pricingPage = pathWithoutLocale === "pricing";
  const suppressPromoBar =
    pathWithoutLocale === "blog" ||
    pathWithoutLocale.startsWith("blog/") ||
    publicToolShellPaths.has(pathWithoutLocale);
  const suppressRewardPopup = shellSurface === "public" || publicToolShellPaths.has(pathWithoutLocale) || pathWithoutLocale === "" || pathWithoutLocale === "my-resources";
  const showPromoBar = ((shellSurface === "public" && !suppressPromoBar) || priorityVoicePage || pricingPage) && promoVisible;
  const promoLines = [t.promo, t.limitedDeal];
  const priorityAnonymousSidebar = priorityVoicePage && status !== "authenticated";
  const sidebarClassName = [
    "devoiceSidebar",
    mobileSidebarOpen ? "mobileSidebarOpen" : "",
    effectiveSidebarCollapsed ? "sidebarCollapsed" : "",
    priorityAnonymousSidebar ? "priorityAnonymousSidebar" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const activeClass = (path = "") => (isActiveShellPath(activeShellPath, path) ? "sideNavActive" : undefined);
  const aiTranscriberActive = ["audio-to-text", "video-to-text", "ai-speech-to-text", "audio-extract-from-video"].some((path) =>
    isActiveShellPath(activeShellPath, path)
  );
  const aiVoicesActive = [
    "remove-background-noise",
    "ai-noise-filter",
    "text-to-speech",
    "ai-voice-cloning",
    "ai-voice-generator",
    "ai-dubbing",
    "ai-voice-actors",
    "ai-voice-enhancer-isolate",
    "ai-voice-changer",
    "ai-music-generator",
    "ai-rap-generator",
    "ai-rap-lyrics-generator",
    "demo/text-to-speech"
  ].some((path) => isActiveShellPath(activeShellPath, path));
  const aiYoutubeActive = ["transcribe-youtube-videos", "youtube-transcript-generator", "youtube-subtitle-downloader", "youtube-video-summarizer"].some((path) =>
    isActiveShellPath(activeShellPath, path)
  );
  const publicContentActive = usesPublicContentRail(pathWithoutLocale);

  function sourcePopperPosition(trigger: HTMLElement | null, estimatedHeight = 140): CSSProperties {
    if (!trigger || window.matchMedia("(max-width: 900px)").matches) return {};
    const rect = trigger.getBoundingClientRect();
    const top = Math.min(Math.max(8, rect.top), Math.max(8, window.innerHeight - estimatedHeight));
    return {
      left: rect.right + 4,
      top
    };
  }

  function toggleCreditDetails() {
    setAccountMenuOpen(false);
    setCreditPanelStyle(sourcePopperPosition(creditButtonRef.current, 96));
    setCreditPopover((current) => (current === "details" ? null : "details"));
  }

  function toggleAccountMenu() {
    setCreditPopover((current) => (current === "details" ? null : current));
    setAccountPanelStyle(sourcePopperPosition(accountButtonRef.current, 125));
    setAccountMenuOpen((current) => !current);
  }

  function closeRewardPopup() {
    window.localStorage.setItem(checkInDismissedDateKey, todayKey());
    setCreditPopover(null);
  }

  useEffect(() => {
    setMobileSidebarOpen(false);
    setAccountMenuOpen(false);
    setCreditPopover((current) => (current === "details" ? null : current));
  }, [pathname]);

  useEffect(() => {
    const today = todayKey();
    const hiddenDate = window.localStorage.getItem("lastBannerShowDate");
    if (hiddenDate !== today) {
      const timer = window.setTimeout(() => setPromoVisible(true), 300);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!promoVisible) return;
    const timer = window.setInterval(() => {
      setPromoIndex((current) => (current + 1) % promoLines.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [promoLines.length, promoVisible]);

  function closePromoBar() {
    window.localStorage.setItem("lastBannerShowDate", todayKey());
    setPromoVisible(false);
  }

  async function submitEmailSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignInMessage("");
    setAuthBusy(true);

    try {
      if (authMode === "forgot") {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, locale })
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          setSignInMessage(data?.error ?? auth.resetFailed);
          return;
        }

        const data = (await response.json().catch(() => null)) as { previewLink?: string } | null;
        setSignInMessage(data?.previewLink ? `${auth.resetSuccess} ${data.previewLink}` : auth.resetSuccess);
        return;
      }

      if (authMode === "signup") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password, locale })
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          setSignInMessage(data?.error ?? auth.incorrect);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (result?.ok) {
        setShowSignIn(false);
        setPassword("");
        setSignInMessage(authMode === "signup" ? auth.registered : "");
        return;
      }

      setSignInMessage(auth.incorrect);
    } finally {
      setAuthBusy(false);
    }
  }

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setShowSignIn(true);
    setSignInMessage("");
  }

  const refreshCredits = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const response = await fetch("/api/credits");
      if (!response.ok) return;
      const data = (await response.json()) as { credits: CreditState };
      setCredits(data.credits);
    } finally {
      setCreditsReady(true);
    }
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") setCreditsReady(true);
    if (status === "loading") setCreditsReady(false);
    void refreshCredits();
  }, [refreshCredits, status]);

  useEffect(() => {
    if (status === "authenticated" && credits.todayClaimed && creditPopover === "reward") {
      setCreditPopover("details");
    }
  }, [creditPopover, credits.todayClaimed, status]);

  useEffect(() => {
    if (suppressRewardPopup || status === "loading" || !creditsReady || creditPopover || showSignIn || showUpgrade || showFeedback) return;
    const dismissedToday = window.localStorage.getItem(checkInDismissedDateKey) === todayKey();
    if (dismissedToday) return;
    if (status === "unauthenticated" || !credits.todayClaimed) {
      const timer = window.setTimeout(() => setCreditPopover("reward"), 320);
      return () => window.clearTimeout(timer);
    }
  }, [creditPopover, credits.todayClaimed, creditsReady, showFeedback, showSignIn, showUpgrade, status, suppressRewardPopup]);

  useEffect(() => {
    function handleOpenAuth() {
      openAuth("signin");
    }

    function handleOpenUpgrade() {
      setShowUpgrade(true);
    }

    function handleCreditsChanged() {
      void refreshCredits();
    }

    window.addEventListener("devoice:open-auth", handleOpenAuth);
    window.addEventListener("devoice:open-upgrade", handleOpenUpgrade);
    window.addEventListener("devoice:credits-changed", handleCreditsChanged);
    return () => {
      window.removeEventListener("devoice:open-auth", handleOpenAuth);
      window.removeEventListener("devoice:open-upgrade", handleOpenUpgrade);
      window.removeEventListener("devoice:credits-changed", handleCreditsChanged);
    };
  }, [refreshCredits]);

  async function claimDailyCredits() {
    setCreditMessage("");
    if (status !== "authenticated") {
      openAuth("signin");
      return;
    }

    const response = await fetch("/api/check-in", { method: "POST" });
    const data = (await response.json().catch(() => null)) as { credits?: CreditState; claimed?: boolean; error?: string } | null;
    if (!response.ok || !data?.credits) {
      setCreditMessage(data?.error ?? "Unable to claim credits.");
      return;
    }

    setCredits(data.credits);
    setCreditPopover("details");
    setCreditMessage(data.claimed ? `+${data.credits.todayReward} ${t.credits}` : "Already claimed today");
  }

  const appClassName = [
    "devoiceApp",
    `devoiceSurface-${shellSurface}`,
    isAutoCollapsedToolShell ? "publicToolShell" : "",
    priorityVoicePage ? "priorityVoiceShell" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={appClassName}>
      <button
        className="mobileMenuButton"
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open navigation"
        aria-expanded={mobileSidebarOpen}
      >
        <Menu size={16} aria-hidden="true" />
      </button>
      {mobileSidebarOpen ? (
        <button className="mobileSidebarScrim" type="button" aria-label="Close navigation overlay" onClick={() => setMobileSidebarOpen(false)} />
      ) : null}
      <aside className={sidebarClassName} aria-label="Product navigation" data-collapsed={effectiveSidebarCollapsed}>
        <div className="sidebarBrandRow">
          <a className="devoiceBrand" href={href()} aria-label="DeVoice">
            <DeVoiceLogo />
            <span className="sidebarText">DeVoice</span>
          </a>
          <button
            className="sidebarCollapseButton"
            type="button"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label={effectiveSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
            aria-pressed={effectiveSidebarCollapsed}
          >
            <PanelLeftClose size={18} aria-hidden="true" />
          </button>
          <button className="sidebarCloseButton" type="button" onClick={() => setMobileSidebarOpen(false)} aria-label="Close navigation">
            <PanelLeftClose size={18} aria-hidden="true" />
          </button>
        </div>
        <nav className="sideNav">
          <a className={activeClass()} href={href()} title={t.home} data-sidebar-label={t.quickHome}>
            <Home size={18} aria-hidden="true" />
            <span className="sidebarText">{t.home}</span>
          </a>
          {publicContentActive ? (
            <a className="sideNavActive publicContentRailLink" href={href("blog")} title="Content" data-sidebar-label="Content">
              <Youtube size={18} aria-hidden="true" />
              <span className="sidebarText">Content</span>
            </a>
          ) : null}
          <div className="sideGroup">
            <button className={aiTranscriberActive ? "sideGroupActive" : undefined} type="button" title={t.aiTranscriber} data-sidebar-label={t.aiTranscriber}>
              <FileAudio size={18} aria-hidden="true" />
              <span className="sidebarText">{t.aiTranscriber}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <a className={activeClass("audio-to-text")} href={href("audio-to-text")}>
              <Headphones size={14} aria-hidden="true" />
              {t.audioToText}
            </a>
            <a className={activeClass("video-to-text")} href={href("video-to-text")}>
              <FileVideo size={14} aria-hidden="true" />
              {t.videoToText}
            </a>
          </div>
          <div className="sideGroup">
            <button className={aiVoicesActive ? "sideGroupActive" : undefined} type="button" title={t.aiVoices} data-sidebar-label={t.aiVoices}>
              <AudioLines size={18} aria-hidden="true" />
              <span className="sidebarText">{t.aiVoices}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <a className={activeClass("remove-background-noise")} href={href("remove-background-noise")}>
              <Filter size={14} aria-hidden="true" />
              {t.removeBackgroundNoise}
            </a>
            <a className={activeClass("text-to-speech")} href={href("text-to-speech")}>
              <Volume2 size={14} aria-hidden="true" />
              {t.textToSpeech}
            </a>
            <a className={activeClass("ai-voice-cloning")} href={href("ai-voice-cloning")}>
              <Copy size={14} aria-hidden="true" />
              {t.aiVoiceCloning}
            </a>
          </div>
          <div className="sideGroup">
            <button className={aiYoutubeActive ? "sideGroupActive" : undefined} type="button" title={t.aiYoutube} data-sidebar-label={t.aiYoutube}>
              <Youtube size={18} aria-hidden="true" />
              <span className="sidebarText">{t.aiYoutube}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <a className={activeClass("youtube-transcript-generator")} href={href("youtube-transcript-generator")}>
              <ScrollText size={14} aria-hidden="true" />
              {t.youtubeTranscriptGenerator}
            </a>
            <a className={activeClass("youtube-subtitle-downloader")} href={href("youtube-subtitle-downloader")}>
              <Captions size={14} aria-hidden="true" />
              {t.youtubeSubtitleDownloader}
            </a>
            <a className={activeClass("youtube-video-summarizer")} href={href("youtube-video-summarizer")}>
              <Sparkles size={14} aria-hidden="true" />
              {t.youtubeVideoSummarizer}
            </a>
          </div>
          {status === "authenticated" ? (
            <>
              <a className={activeClass("my-resources")} href={href("my-resources")} title={t.myResources} data-sidebar-label={t.quickMyResources}>
                <PackageOpen size={18} aria-hidden="true" />
                <span className="sidebarText">{t.myResources}</span>
              </a>
              <a className={activeClass("pricing")} href={href("pricing")} title={t.pricing} data-sidebar-label={t.quickPricing}>
                <Tag size={18} aria-hidden="true" />
                <span className="sidebarText">{t.pricing}</span>
              </a>
            </>
          ) : null}
        </nav>
        <div className="sideFooter">
          <button className="sideFeedbackButton" type="button" onClick={() => setShowFeedback(true)} title={t.feedback} data-sidebar-label={t.feedback}>
            <MessageSquare size={18} aria-hidden="true" />
            <span className="sidebarText">{t.feedback}</span>
          </button>
          <LanguageSwitcher locale={locale} />
          {status === "authenticated" ? (
            <>
              <div className="creditCard">
                <div className="creditMenu">
                  <button
                    ref={creditButtonRef}
                    className={`creditBadge creditBadgeButton${creditPopover === "details" ? " creditBadgeOpen" : ""}`}
                    type="button"
                    onClick={toggleCreditDetails}
                    data-sidebar-label={t.credits}
                    aria-haspopup="menu"
                    aria-expanded={creditPopover === "details"}
                  >
                    <CircleDollarSign size={17} aria-hidden="true" />
                    <span className="sidebarText">{t.credits}</span>
                    <strong>{credits.remainingCredits}</strong>
                  </button>
                  {creditPopover === "details" ? (
                    <div className="creditDropdownPanel sourcePopperPanel" role="menu" aria-label={t.creditDetails} style={creditPanelStyle}>
                      <p>{t.creditDetails}</p>
                      <span>
                        <small>{t.paidCredits}</small>
                        <strong>{credits.paidCredits}</strong>
                      </span>
                      <span>
                        <small>{t.freeCredits}</small>
                        <strong>{credits.freeCredits}</strong>
                      </span>
                      {creditMessage ? <em>{creditMessage}</em> : null}
                    </div>
                  ) : null}
                </div>
                <div className="sideActionRow">
                  <button
                    className="checkButton"
                    type="button"
                    onClick={claimDailyCredits}
                    disabled={credits.todayClaimed}
                    data-sidebar-label={credits.todayClaimed ? (locale.startsWith("zh") ? "已领取" : "Claimed") : t.checkIn}
                  >
                    <Gift size={16} aria-hidden="true" />
                    <span className="sidebarText">{credits.todayClaimed ? (locale.startsWith("zh") ? "已领取" : "Claimed") : t.checkIn}</span>
                  </button>
                  <a className="checkButton" href={href("pricing")} data-sidebar-label={t.buy}>
                    <span className="sidebarText">{t.buy}</span>
                  </a>
                </div>
              </div>
              <div className={`accountMenu${accountMenuOpen ? " accountMenuOpen" : ""}`}>
                <button
                  ref={accountButtonRef}
                  className="accountMenuTrigger"
                  type="button"
                  onClick={toggleAccountMenu}
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  data-sidebar-label={session.user?.email ?? "Account"}
                >
                  <span className="avatarCircle">{initials}</span>
                  <span className="accountIdentity">
                    <strong title={session.user?.email ?? "Account"}>{session.user?.email ?? "Account"}</strong>
                    <small>{t.freeUser}</small>
                  </span>
                  <ChevronDown className="accountChevron" size={16} aria-hidden="true" />
                </button>
                {accountMenuOpen ? (
                  <div className="accountMenuPanel sourcePopperPanel" role="menu" style={accountPanelStyle}>
                  <p>{session.user?.email ?? "Account"}</p>
                    <div className="accountSubmenu" role="presentation">
                      <button type="button" role="menuitem">
                        <span>
                          <ShieldCheck size={16} aria-hidden="true" />
                          {t.privacyPolicy}
                        </span>
                        <ChevronRight size={14} aria-hidden="true" />
                      </button>
                      <div className="accountSubmenuPanel sourcePopperPanel" role="menu" aria-label={t.privacyPolicy}>
                        <a href={href("privacy-policy")} role="menuitem">
                          <ShieldCheck size={16} aria-hidden="true" />
                          {auth.privacy}
                        </a>
                        <a href={href("refund-policy")} role="menuitem">
                          <ReceiptText size={16} aria-hidden="true" />
                          {t.refundPolicy}
                        </a>
                        <a href={href("terms-of-use")} role="menuitem">
                          <ScrollText size={16} aria-hidden="true" />
                          {t.termsOfUse}
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        void signOut();
                      }}
                    >
                      <LogOut size={16} aria-hidden="true" />
                      {t.signOut}
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <button className="checkButton anonymousCheckButton" type="button" onClick={() => setCreditPopover("reward")} data-sidebar-label={t.checkIn}>
                <Gift size={17} aria-hidden="true" />
                <span className="sidebarText">{t.checkIn}</span>
              </button>
              <button className="btn btnPrimary anonymousSignInButton" onClick={() => openAuth("signin")} type="button" data-sidebar-label={t.signIn}>
                <User size={18} aria-hidden="true" />
                <span className="sidebarText">{t.signIn}</span>
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="devoiceContent">
        {showPromoBar ? (
          <div className="promoBar">
            <span>{t.limitedDeal}</span>
            <strong key={promoIndex}>{promoLines[promoIndex]}</strong>
            <a
              href={href("pricing")}
              onClick={() => {
                window.localStorage.setItem("lastBannerShowDate", todayKey());
              }}
            >
              {t.claimNow}
            </a>
            <button type="button" onClick={closePromoBar} aria-label="Close promotion">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ) : null}
        {children}
      </div>

      {creditPopover === "reward" ? (
        <div className="rewardPopup" role="dialog" aria-label="Daily free credit">
          <button className="iconButton" type="button" onClick={closeRewardPopup} aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
          <div className="rewardHeader">
            <span className="rewardIcon">
              <Gift size={18} aria-hidden="true" />
            </span>
            <span>
              <h2>{t.rewardTitle}</h2>
              <p>{t.rewardBody}</p>
            </span>
          </div>
          <div className="rewardBox">
            <span>
              <small>{t.todayReward}</small>
              <strong>+{credits.todayReward} <em>{t.credits}</em></strong>
            </span>
            <button type="button" onClick={claimDailyCredits} disabled={status === "authenticated" && credits.todayClaimed}>
              {status === "authenticated" && credits.todayClaimed ? (locale.startsWith("zh") ? "已领取" : "Claimed") : t.claim}
            </button>
          </div>
          {creditMessage ? <p className="formMessage">{creditMessage}</p> : null}
          <small className="rewardFooter">
            <CircleDollarSign size={14} aria-hidden="true" />
            {t.creditsNeverExpire}
          </small>
        </div>
      ) : null}

      {showSignIn ? (
        <div className="modalOverlay" role="presentation">
          <div className="signInModal" role="dialog" aria-label="Sign in">
            <button className="iconButton" type="button" onClick={() => setShowSignIn(false)} aria-label="Close">
              <X size={18} aria-hidden="true" />
            </button>
            <DeVoiceLogo />
            <h2>{authMode === "forgot" ? auth.resetTitle : auth.welcome}</h2>
            <p>{authMode === "signin" ? auth.signInSubtitle : authMode === "signup" ? auth.signUpSubtitle : auth.resetSubtitle}</p>
            <form className="emailSignInForm" onSubmit={submitEmailSignIn}>
              <label className="modalField">
                <span>{auth.email}</span>
                <input
                  type="email"
                  placeholder={auth.email}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              {authMode === "forgot" ? null : (
                <label className="modalField">
                  <span>{auth.password}</span>
                  <input
                    type="password"
                    placeholder={auth.password}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={authMode === "signup" ? 8 : undefined}
                    required
                  />
                </label>
              )}
              {authMode === "signup" ? <small className="fieldHint">{auth.passwordHelp}</small> : null}
              {authMode === "signin" ? (
                <button className="forgotButton" type="button" onClick={() => openAuth("forgot")}>
                  {auth.forgot}
                </button>
              ) : null}
              {signInMessage ? <p className={authMode === "forgot" ? "formMessage" : "formError"}>{signInMessage}</p> : null}
              <button className="btn btnPrimary" type="submit" disabled={authBusy}>
                {authMode === "signin" ? auth.submitSignIn : authMode === "signup" ? auth.submitSignUp : auth.resetSubmit}
              </button>
            </form>
            <p className="modalFinePrint">
              {authMode === "signin" ? auth.noAccount : authMode === "signup" ? auth.haveAccount : auth.rememberPassword}{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "signin" ? "signup" : "signin");
                  setSignInMessage("");
                }}
              >
                {authMode === "signin" ? auth.signUp : auth.submitSignIn}
              </button>
            </p>
            <p className="termsLine">
              {auth.termsPrefix} <a href={href("terms-of-use")}>{auth.terms}</a> {auth.and}{" "}
              <a href={href("privacy-policy")}>{auth.privacy}</a>.
            </p>
          </div>
        </div>
      ) : null}

      {showUpgrade ? <UpgradeModal locale={locale} onClose={() => setShowUpgrade(false)} /> : null}

      {showFeedback ? <FeedbackModal locale={locale} onClose={() => setShowFeedback(false)} /> : null}
    </main>
  );
}

function UpgradeModal({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const href = localizedPath(locale, "pricing");
  const title = locale.startsWith("zh") ? "升级以继续处理" : "Upgrade to continue";
  const description = locale.startsWith("zh")
    ? "你的 DeVoice credits 不足。选择套餐即可继续生成转写、字幕、摘要和 AI 语音。"
    : "Your DeVoice credits are used up. Choose a plan to keep generating transcripts, subtitles, summaries and AI voices.";
  const features = locale.startsWith("zh")
    ? ["一次性 credits 或订阅套餐", "优先处理队列", "无限文件下载"]
    : ["One-time credits or subscriptions", "Priority processing queue", "Unlimited file downloads"];

  return (
    <div className="modalOverlay" role="presentation">
      <section className="upgradeModal" role="dialog" aria-label={title}>
        <button className="iconButton" type="button" onClick={onClose} aria-label="Close">
          <X size={18} aria-hidden="true" />
        </button>
        <span className="upgradeIcon">
          <CreditCard size={28} aria-hidden="true" />
        </span>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="upgradeFeatureList">
          {features.map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
        <div className="upgradeActions">
          <a className="btn btnPrimary" href={href} onClick={onClose}>
            {locale.startsWith("zh") ? "查看套餐" : "View Plans"}
          </a>
          <button type="button" onClick={onClose}>
            {locale.startsWith("zh") ? "稍后再说" : "Maybe Later"}
          </button>
        </div>
      </section>
    </div>
  );
}

function FeedbackModal({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const feedback = getDictionary(locale).feedback;
  const [problem, setProblem] = useState("");
  const [severity, setSeverity] = useState("");
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  async function submitFeedback() {
    if (feedbackBusy) return;
    setStatus(feedback.sending);
    setFeedbackBusy(true);
    let closeAfterSuccess = false;
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          problem: problem || feedback.options[0]?.[0] || "Other",
          severity: severity || feedback.severity[0]?.[0] || "Feedback",
          note,
          email
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus(data?.error ?? feedback.error);
        return;
      }

      setFeedbackSent(true);
      setStatus(feedback.success);
      closeAfterSuccess = true;
      window.setTimeout(onClose, 650);
    } finally {
      if (!closeAfterSuccess) {
        setFeedbackBusy(false);
      }
    }
  }

  return (
    <div className="feedbackOverlay" role="presentation">
      <section className="feedbackModal" role="dialog" aria-label="DeVoice Quick Feedback">
        <button className="feedbackClose" type="button" onClick={onClose} aria-label="Close" disabled={feedbackBusy}>✕</button>
        <header className="feedbackHeader">
          <h2>{feedback.title}</h2>
          <p>{feedback.subtitle}</p>
        </header>
        <div className="feedbackBody">
          <div className="feedbackChoicePanel">
            <div className="feedbackBlock">
              <h3>{feedback.problemTitle}</h3>
              <p>{feedback.problemHint}</p>
              <div className="feedbackOptions">
                {feedback.options.map(([title, detail]) => (
                  <button
                    className={problem === title ? "feedbackSelected" : ""}
                    type="button"
                    key={title}
                    onClick={() => setProblem(title)}
                    disabled={feedbackBusy}
                  >
                    <strong>{title}</strong>
                    {detail ? <span>{detail}</span> : null}
                  </button>
                ))}
              </div>
            </div>
            <div className="feedbackBlock">
              <h3>{feedback.severityTitle}</h3>
              <div className="feedbackOptions feedbackSeverity">
                {feedback.severity.map(([title, detail]) => (
                  <button
                    className={severity === title ? "feedbackSelected" : ""}
                    type="button"
                    key={title}
                    onClick={() => setSeverity(title)}
                    disabled={feedbackBusy}
                  >
                    <strong>{title}</strong>
                    {detail ? <span>{detail}</span> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="feedbackFormPanel">
            <label className="modalField feedbackField">
              <span>{feedback.noteLabel}</span>
              <textarea
                placeholder={feedback.notePlaceholder}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={feedbackBusy}
              />
            </label>
            <label className="modalField feedbackField">
              <span>{feedback.emailLabel}</span>
              <input
                type="email"
                placeholder={feedback.emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={feedbackBusy}
              />
            </label>
            {status ? <p className="formMessage feedbackMessage">{status}</p> : null}
            <button className="btn btnPrimary feedbackSubmit" type="button" onClick={submitFeedback} disabled={feedbackBusy}>
              {feedbackSent ? feedback.sent : feedbackBusy ? feedback.sending : feedback.send}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
