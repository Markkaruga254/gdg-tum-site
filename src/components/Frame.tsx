export default function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto box-border min-h-screen w-full max-w-[1280px] border-[3px] border-ink bg-white font-body text-ink">
      {children}
    </div>
  );
}
