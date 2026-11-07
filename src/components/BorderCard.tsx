export default function BorderCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <article className={`border-[3px] border-ink bg-white ${className}`}>{children}</article>;
}
