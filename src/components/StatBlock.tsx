export default function StatBlock({ value, label, className = "" }: { value: string | number; label: string; className?: string }) {
  return (
    <div className={`border-r-[3px] border-ink p-[14px] last:border-r-0 xl:p-[18px] ${className}`}>
      <div className="mb-[8px] font-display text-[34px] leading-none xl:text-[40px]">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-[.5px] xl:text-[12px]">{label}</div>
    </div>
  );
}
