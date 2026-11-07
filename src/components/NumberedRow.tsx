export default function NumberedRow({
  n,
  children,
  meta,
  trailing,
  className = "",
}: {
  n: string;
  children: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`grid grid-cols-[60px_minmax(0,1fr)] items-center gap-[12px] border-b-[3px] border-ink px-[20px] py-[14px] sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:gap-[14px] sm:px-[22px] ${className}`}>
      <span className="font-display text-[44px] leading-none sm:text-[56px]">{n}</span>
      <div className="min-w-0">
        {children}
        {meta && <p className="mt-[4px] text-[13px]">{meta}</p>}
      </div>
      {trailing && <div className="col-start-2 flex flex-wrap items-center gap-[10px] sm:col-start-auto">{trailing}</div>}
    </article>
  );
}
