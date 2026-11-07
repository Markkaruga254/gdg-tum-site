export default function LoadingBlock({
  label = "Loading…",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`border-[3px] border-ink px-[20px] py-[18px] text-center text-[13px] font-bold uppercase ${className}`} role="status" aria-live="polite">
      {label}
    </div>
  );
}
