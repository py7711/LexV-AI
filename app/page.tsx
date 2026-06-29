import type { Metadata } from "next";
import { DeVoiceShell } from "@/components/devoice-shell";
import { DeVoiceToolPage, toolConfigs } from "@/components/devoice-tool-page";
import { buildMetadata, defaultLocale } from "@/lib/i18n";

export const metadata: Metadata = buildMetadata(defaultLocale);

export default function IndexPage() {
  return (
    <DeVoiceShell locale={defaultLocale}>
      <DeVoiceToolPage config={toolConfigs.home} locale={defaultLocale} />
    </DeVoiceShell>
  );
}
