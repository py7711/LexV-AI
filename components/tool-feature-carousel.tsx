"use client";

import { ChevronLeft, ChevronRight, FileAudio, Headphones, Music2, Video, Youtube } from "lucide-react";
import { useRef } from "react";

type ToolFeature = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: "youtube" | "audio" | "video" | "noise" | "voice";
};

const icons = {
  youtube: Youtube,
  audio: FileAudio,
  video: Video,
  noise: Headphones,
  voice: Music2
};

export function ToolFeatureCarousel({ items }: { items: ToolFeature[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;

    const cardWidth = rail.querySelector("article")?.getBoundingClientRect().width ?? 280;
    rail.scrollBy({ left: direction * (cardWidth + 18), behavior: "smooth" });
  }

  return (
    <div className="toolCarouselShell">
      <button
        className="toolCarouselArrow toolCarouselArrowLeft"
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollByCard(-1)}
      >
        <ChevronLeft size={24} aria-hidden="true" />
      </button>
      <div className="toolCarousel" ref={railRef}>
        {items.map(({ title, description, href, cta, icon }) => {
          const Icon = icons[icon];
          return (
            <article key={title}>
              <Icon size={28} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
              <a href={href}>{cta}</a>
            </article>
          );
        })}
      </div>
      <button
        className="toolCarouselArrow toolCarouselArrowRight"
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollByCard(1)}
      >
        <ChevronRight size={24} aria-hidden="true" />
      </button>
    </div>
  );
}
