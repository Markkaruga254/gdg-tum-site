export default function NumberedRow({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[60px_1fr] border-t-[3px] border-ink">
      <div className="flex items-center justify-center border-r-[3px] border-ink p-4 font-display text-2xl">{n}</div>
      <div className="p-4">{children}</div>
    </div>
  );
}
