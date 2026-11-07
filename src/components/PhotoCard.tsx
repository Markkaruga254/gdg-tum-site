"use client";

import { useState } from "react";
import Tag from "./Tag";
import { trackName, trackTagColor } from "@/lib/tracks";
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
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <a href={href} className={`flex h-full flex-col border-[3px] border-ink bg-white ${featured ? "min-h-[440px]" : "min-h-[300px]"}`}>
      <div
        className={`flex flex-1 items-center justify-center overflow-hidden ${featured ? "min-h-[380px]" : "min-h-[240px]"}`}
        style={imageFailed ? { backgroundColor: bg } : undefined}
      >
        {imageFailed ? (
          <span role="img" aria-label={altText || caption || "Event photo"} className="px-4 text-center text-[12px] font-bold uppercase text-white">
            {caption || "Event photo"}
          </span>
        ) : (
          <img
            src={url}
            alt={altText || caption}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      <div className="flex flex-col gap-1 border-t-[3px] border-ink bg-white px-[12px] py-[10px] text-[13px] font-bold">
        {caption}
        <Tag label={trackName(trackId)} color={tagColor ?? trackTagColor(trackId)} />
      </div>
    </a>
  );
}
