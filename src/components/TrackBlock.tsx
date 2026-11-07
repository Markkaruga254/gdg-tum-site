import { TRACK_BG_COLORS } from "@/lib/tracks";
import type { TrackSlug } from "@/lib/types";

export default function TrackBlock({
  number,
  name,
  slug,
  description,
  leadNames = [],
  href = `/track?slug=${slug}`,
}: {
  number: number;
  name: string;
  slug: TrackSlug;
  description: string;
  leadNames?: string[];
  href?: string;
}) {
  const textColor = slug === "cloud" ? "#fff" : "#111";
  return (
    <article className="border-[3px] border-ink p-[26px]" style={{ backgroundColor: TRACK_BG_COLORS[slug], color: textColor }}>
      <p className="font-display text-[72px] leading-none">{String(number).padStart(2, "0")}</p>
      <h2 className="my-[8px] font-display text-[44px] uppercase leading-none">{name}</h2>
      <p className="mb-[16px] text-[15px] leading-[1.5]">{description}</p>
      {leadNames.length > 0 && (
        <p className="mb-[16px] text-[12px] font-bold uppercase">Lead: {leadNames.join(", ")}</p>
      )}
      <a href={href} className="inline-block border-[3px] border-ink bg-white px-[20px] py-[12px] text-[12px] font-bold uppercase text-ink">
        Open track ↗
      </a>
    </article>
  );
}
