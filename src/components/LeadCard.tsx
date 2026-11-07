"use client";

import { useState } from "react";
import Tag from "./Tag";
import { TRACK_BG_COLORS, trackName, trackTagColor } from "@/lib/tracks";
import type { TrackSlug } from "@/lib/types";

export default function LeadCard({
  name,
  track,
  bio,
  photoUrl,
  href,
}: {
  name: string;
  track: TrackSlug;
  bio?: string;
  photoUrl?: string;
  href: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const textColor = track === "cloud" ? "#fff" : "#111";
  return (
    <article className="border-[3px] border-ink bg-white">
      <a href={href} className="block">
        <div
          className="flex min-h-[170px] items-center justify-center overflow-hidden border-b-[3px] border-ink"
          style={imageFailed ? { backgroundColor: TRACK_BG_COLORS[track], color: textColor } : undefined}
        >
          {photoUrl && !imageFailed ? (
            <img src={photoUrl} alt={name} className="h-[170px] w-full object-cover" onError={() => setImageFailed(true)} />
          ) : (
            <span className="font-display text-[56px] uppercase">{name.slice(0, 1)}</span>
          )}
        </div>
        <div className="p-[20px]">
          <Tag label={trackName(track)} color={trackTagColor(track)} />
          <h2 className="mt-[12px] text-[20px] font-bold">{name}</h2>
          {bio && <p className="mt-[8px] text-[14px] leading-[1.5]">{bio}</p>}
        </div>
      </a>
    </article>
  );
}
