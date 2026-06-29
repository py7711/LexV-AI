"use client";

import { Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { localizedPath, type Locale } from "@/lib/i18n";

export function NoiseHistoryButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  const { status } = useSession();

  function openHistory() {
    if (status !== "authenticated") {
      window.dispatchEvent(new Event("devoice:open-auth"));
      return;
    }

    router.push(localizedPath(locale, "my-resources"));
  }

  return (
    <button className="noiseHistoryButton" type="button" onClick={openHistory}>
      <Clock3 size={16} aria-hidden="true" />
      History
    </button>
  );
}
