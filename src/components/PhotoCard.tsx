import Tag from "./Tag";
import { trackTagColor } from "@/lib/tracks";
import type { TrackSlug } from "@/lib/types";

type PhotoCardProps = {
  url: string;
  caption: string;
  altText?: string;
  trackId: TrackSlug;
  writeupId: string;
  href?: string;
  featured?: boolean;
  tagColor?: "blue" | "red" | "green" | "yellow" | "ink";
  bg?: string;
};

function trackLabel(trackId: string) {
  return trackId === "women-in-tech" ? "Women in Tech" : trackId.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PhotoCard({
  url,
  caption,
  altText,
  trackId,
  writeupId,
  href = `/writeup?id=${writeupId}`,
  featured = false,
  tagColor,
  bg = "#111",
}: PhotoCardProps) {
  return (
    <a href={href} className={`flex h-full flex-col border-[3px] border-ink bg-white ${featured ? "min-h-[440px]" : "min-h-[300px]"}`}>
      <div className={`relative flex-1 overflow-hidden ${featured ? "min-h-[380px]" : "min-h-[240px]"}`} style={{ backgroundColor: bg }}>
        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold uppercase">{caption || "Event photo"}</span>
        <img
          src={url}
          alt={altText || caption}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </div>
      <div className="flex flex-col gap-1 border-t-[3px] border-ink bg-white px-[12px] py-[10px] text-[13px] font-bold">
        {caption}
        <Tag label={trackLabel(trackId)} color={tagColor ?? trackTagColor(trackId)} />
      </div>
    </a>
  );
}
