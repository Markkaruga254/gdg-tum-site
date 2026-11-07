export default function EmptyState({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-[3px] border-ink px-[20px] py-[22px] text-center text-[13px] font-bold uppercase ${className}`} role="status">
      {children}
    </div>
  );
}
