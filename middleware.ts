import { NextResponse, type NextRequest } from "next/server";
import { matchLocale, normalizeLocale, type Locale } from "@/lib/i18n";

const publicRoutes = new Set([
  "/",
  "/audio-to-text",
  "/video-to-text",
  "/ai-speech-to-text",
  "/ai-noise-filter",
  "/remove-background-noise",
  "/text-to-speech",
  "/ai-voice-generator",
  "/ai-dubbing",
  "/ai-voice-actors",
  "/ai-voice-cloning",
  "/ai-voice-enhancer-isolate",
  "/ai-voice-changer",
  "/ai-music-generator",
  "/ai-rap-generator",
  "/ai-rap-lyrics-generator",
  "/audio-extract-from-video",
  "/transcribe-youtube-videos",
  "/youtube-transcript-generator",
  "/youtube-subtitle-downloader",
  "/youtube-video-summarizer",
  "/pricing",
  "/demo/text-to-speech",
  "/payment/loading",
  "/payment/result",
  "/reset-password",
  "/blog",
  "/privacy-policy",
  "/refund-policy",
  "/terms-of-use"
]);

const englishProtectedRoutes = [/^\/dashboard$/, /^\/my-resources$/, /^\/jobs\/[^/]+$/];
const englishPublicRoutePatterns = [/^\/blog\/[^/]+$/];

function hasLocale(pathname: string) {
  const firstSegment = pathname.split("/").filter(Boolean)[0] ?? "";
  return Boolean(normalizeLocale(firstSegment));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.startsWith("/source-clone") || pathname.includes(".")) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (publicRoutes.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (englishPublicRoutePatterns.some((route) => route.test(pathname))) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (englishProtectedRoutes.some((route) => route.test(pathname))) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (hasLocale(pathname)) {
    const segments = pathname.split("/").filter(Boolean);
    const normalizedLocale = normalizeLocale(segments[0] ?? "");
    if (normalizedLocale && segments[0] !== normalizedLocale) {
      const url = request.nextUrl.clone();
      url.pathname = `/${normalizedLocale}${segments.length > 1 ? `/${segments.slice(1).join("/")}` : ""}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const matchedLocale = matchLocale(acceptLanguage);

  const url = request.nextUrl.clone();
  url.pathname = `/${matchedLocale as Locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"]
};
