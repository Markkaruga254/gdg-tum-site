export default function SectionHeader({
  children,
  className = "",
}: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[12px] font-bold uppercase tracking-[.5px] ${className}`}>{children}</p>;
}
