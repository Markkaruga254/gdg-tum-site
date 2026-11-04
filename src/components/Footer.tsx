export default function Footer() {
  return (
    <footer className="border-t-[3px] border-ink bg-white text-ink">
      <section className="bg-red border-[3px] border-ink border-t-0 px-[32px] py-[34px]">
        <h2 className="font-display font-normal text-[44px] uppercase leading-1 mb-[14px]">Get the weekly digest</h2>
        <div className="flex flex-wrap border-[3px] border-ink bg-white">
          <label htmlFor="em" className="sr-only">
            Email
          </label>
          <input
            id="em"
            type="email"
            placeholder="ENTER YOUR EMAIL"
            disabled
            className="flex-1 min-w-[160px] border-0 px-[14px] py-[14px] font-inherit text-[13px] font-bold focus:outline-none bg-transparent"
          />
          <button type="button" disabled className="bg-ink text-white border-0 px-[22px] py-[14px] font-inherit font-bold uppercase text-[13px]">
            Coming soon
          </button>
        </div>
        <p className="mt-[18px] text-[13px] font-bold uppercase leading-[1.5]">
          A backend is not connected yet. Subscribe when the digest goes live.
        </p>
      </section>

      <div className="flex flex-wrap justify-between gap-[12px] px-[26px] py-[16px] text-[12px] font-bold uppercase">
        <span>&copy; 2026 GDG on Campus TUM</span>
        <span>GitHub &middot; LinkedIn &middot; Instagram &middot; X</span>
      </div>
    </footer>
  );
}
