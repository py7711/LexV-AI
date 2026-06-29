"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { defaultLocale, isLocale, localeNames, locales, localizedPath, type Locale } from "@/lib/i18n";

function pathSuffix(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const currentHasPrefix = isLocale(segments[0] ?? "");
  return currentHasPrefix ? segments.slice(1).join("/") : segments.join("/");
}

function targetPath(locale: Locale, suffix: string) {
  if (locale === defaultLocale) return `/${suffix}`.replace(/\/$/, "") || "/";
  return localizedPath(locale, suffix);
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const suffix = pathSuffix(pathname);
  const currentLabel = localeNames[locale];

  useEffect(() => {
    if (!open) return;

    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="languageSwitcher" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Language"
        className="languageSwitcherTrigger"
        data-sidebar-label={currentLabel}
        onClick={() => setOpen((current) => !current)}
        title={currentLabel}
        type="button"
      >
        <Languages size={16} aria-hidden="true" />
        <span className="sidebarText">{currentLabel}</span>
        <ChevronDown className="languageSwitcherChevron" size={13} aria-hidden="true" />
      </button>
      {open ? (
        <div className="languageSwitcherPanel" role="menu">
          {locales
            .filter((item) => item !== locale)
            .map((item) => {
              const href = targetPath(item, suffix);
              return (
                <button
                  className="languageSwitcherItem"
                  key={item}
                  onClick={() => {
                    setOpen(false);
                    router.push(href);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{localeNames[item]}</span>
                </button>
              );
            })}
        </div>
      ) : null}
    </div>
  );
}
