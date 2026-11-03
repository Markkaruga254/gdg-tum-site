export default function BorderCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-[3px] border-ink ${className}`}>{children}</div>;
}
