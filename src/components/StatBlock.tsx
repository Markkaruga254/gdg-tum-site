export default function StatBlock({ value, label, className = "" }: { value: string | number; label: string; className?: string }) {
  return (
    <div className={`border-r-[3px] border-ink p-[18px] last:border-r-0 ${className}`}>
      <div className="mb-[8px] font-display text-[40px] leading-none">{value}</div>
      <div className="text-[12px] font-bold uppercase tracking-[.5px]">{label}</div>
    </div>
  );
}
