import Tag from "./Tag";
import type { PartnerType } from "@/lib/types";

const partnerTag: Record<PartnerType, { label: string; color: "blue" | "green" | "red" | "white" }> = {
  university: { label: "University", color: "blue" },
  community: { label: "Community", color: "green" },
  sponsor: { label: "Sponsor", color: "red" },
  company: { label: "Company", color: "white" },
};

export default function PartnerCell({
  name,
  logoUrl,
  link,
  type,
}: {
  name: string;
  logoUrl?: string;
  link: string;
  type: PartnerType;
}) {
  const tag = partnerTag[type];
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-[110px] flex-col items-center justify-center gap-[10px] border-r-[3px] border-b-[3px] border-ink p-[20px] text-center text-[13px] font-bold uppercase"
    >
      {logoUrl ? <img src={logoUrl} alt={name} className="max-h-[64px] max-w-full object-contain" /> : <span>{name}</span>}
      <Tag label={tag.label} color={tag.color} bordered={type === "company"} />
    </a>
  );
}
