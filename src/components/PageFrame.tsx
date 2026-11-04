export default function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1280px] mx-auto border-[3px] border-ink bg-white text-ink font-body min-h-screen box-border">
      {children}
    </div>
  );
}
