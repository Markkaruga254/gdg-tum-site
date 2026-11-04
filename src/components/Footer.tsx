export default function Footer() {
  return (
    <footer className="border-t-[3px] border-ink">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="border-b-[3px] border-ink p-6 md:border-b-0 md:border-r-[3px]">
          <p className="mb-2 text-xs font-bold uppercase">Newsletter</p>
          <div className="flex gap-2">
            <input aria-label="Email" className="flex-1 border-[3px] border-ink px-3 py-2" placeholder="you@example.com" />
            <button className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">Subscribe</button>
          </div>
        </div>
        <div className="flex items-center gap-4 p-6 text-sm font-bold uppercase">
          <a href="#" className="focus:outline focus:outline-2 focus:outline-ink">Twitter</a>
          <a href="#" className="focus:outline focus:outline-2 focus:outline-ink">GitHub</a>
          <a href="#" className="focus:outline focus:outline-2 focus:outline-ink">Discord</a>
          <a href="/gallery" className="focus:outline focus:outline-2 focus:outline-ink">Gallery</a>
        </div>
      </div>
    </footer>
  );
}
