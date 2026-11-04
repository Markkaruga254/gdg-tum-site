export default function StatBlock({ value, label, className = "" }: { value: string | number; label: string; className?: string }) {
  return (
    <div className={`border-b-[3px] border-ink p-[20px] text-center ${className}`}>
      <div className="font-display text-[48px] leading-[1] mb-[20px]">{value}</div>
      <div className="text-[13px] font-bold uppercase tracking-[.5px]">{label}</div>
    </div>
  );
}
