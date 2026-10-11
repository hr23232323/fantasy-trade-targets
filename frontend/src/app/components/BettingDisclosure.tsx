export default function BettingDisclosure() {
  return (
    <aside className="border-y border-[#171c19] bg-[#171c19] text-white">
      <div className="page-wrap grid gap-5 py-7 md:grid-cols-[1fr_auto] md:items-center">
        <p className="max-w-4xl text-xs leading-6 text-white/70">
          FTT publishes independent statistical analysis, not guaranteed outcomes. Lines can move after the timestamp shown. If you choose to wager, follow local law, meet the legal age requirement, and set a firm limit before you start.
        </p>
        <a href="https://www.ncpgambling.org/help-treatment/" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] font-black uppercase text-[#dfff4f] underline">
          Support: 1-800-MY-RESET ↗
        </a>
      </div>
    </aside>
  );
}
