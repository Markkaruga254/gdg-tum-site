"use client";

import { useState } from "react";
import Tag from "./Tag";
import { TRACK_BG_COLORS, trackName, trackTagColor } from "@/lib/tracks";
import type { TrackSlug } from "@/lib/types";

export function PhotoImage({
  url,
  altText,
  trackId,
  className = "",
  bg = TRACK_BG_COLORS[trackId],
}: {
  url: string;
  altText?: string;
  trackId: TrackSlug;
  className?: string;
  bg?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={className} style={imageFailed ? { backgroundColor: bg } : undefined}>
      {imageFailed ? (
        <span role="img" aria-label={altText || "Event photo"} className="block h-full w-full" />
      ) : (
        <img
          src={url}
          alt={altText || "Event photo"}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}

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
  bg = TRACK_BG_COLORS[trackId],
}: PhotoCardProps) {
  return (
    <a href={href} className={`flex h-full flex-col border-[3px] border-ink bg-white ${featured ? "min-h-[440px]" : "min-h-[300px]"}`}>
      <PhotoImage
        url={url}
        altText={altText || caption}
        trackId={trackId}
        bg={bg}
        className={`flex flex-1 items-center justify-center overflow-hidden ${featured ? "min-h-[380px]" : "min-h-[240px]"}`}
      />
      <div className="flex flex-col gap-1 border-t-[3px] border-ink bg-white px-[12px] py-[10px] text-[13px] font-bold">
        {caption}
        <Tag label={trackName(trackId)} color={tagColor ?? trackTagColor(trackId)} />
      </div>
    </a>
  );
}
