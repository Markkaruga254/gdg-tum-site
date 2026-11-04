import Tag from "./Tag";

type PhotoCardProps = {
  url: string;
  caption: string;
  trackId: string;
  writeupId: string;
  href?: string;
  featured?: boolean;
  tagColor?: "blue" | "red" | "green" | "yellow" | "ink";
  bg?: string;
};

export default function PhotoCard({
  url,
  caption,
  trackId,
  writeupId,
  href = `/writeup?id=${writeupId}`,
  featured = false,
  tagColor,
  bg = "#111",
}: PhotoCardProps) {
  return (
    <a
      href={href}
      className={`border-[3px] border-ink flex flex-col ${featured ? "flex-[2_1_340px] min-h-[440px]" : "flex-[3_1_340px] min-h-[240px]"}`}
    >
      <div className="flex-1 relative overflow-hidden">
        <img
          src={url}
          alt={caption}
          className="w-full h-full object-cover"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.display = "none";
            const wrapper = el.closest(".flex-1") as HTMLElement | null;
            if (wrapper) {
              wrapper.style.backgroundColor = bg;
            }
          }}
        />
      </div>
      <div className="border-t-[3px] border-ink px-[12px] py-[10px] text-[13px] font-bold bg-white flex flex-col gap-1">
        {caption}
        <Tag label={trackId} color={tagColor ?? ("ink" as const)} />
      </div>
    </a>
  );
}
