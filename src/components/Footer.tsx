export default function Footer({ borderTop = true }: { borderTop?: boolean } = {}) {
  return (
    <footer className={`flex flex-wrap justify-between gap-[12px] px-[22px] py-[16px] text-[12px] font-bold uppercase ${borderTop ? "border-t-[3px] border-ink" : ""}`}>
      <span>© 2026 GDG on Campus TUM</span>
      <span>GitHub · LinkedIn · Instagram · X</span>
    </footer>
  );
}
