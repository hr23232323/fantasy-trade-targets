export default function CalculatorGuide({ mode = "dynasty" }: { mode?: "dynasty" | "redraft" | "superflex" }) {
  const copy = {
    dynasty: {
      eyebrow: "Dynasty values // explained",
      title: "More than a pile of market scores.",
      intro:
        "Dynasty trades exchange production today, career runway, and rookie liquidity. The calculator starts with daily consensus market values, then evaluates the package as a package.",
      cards: [
        ["01", "Choose the real format", "Switch between 1QB and Superflex, turn TE premium on when your league rewards it, and set league size so rookie picks match your market."],
        ["02", "Add every asset", "Players and exact rookie-pick slots share one searchable board. Compare the raw total with the adjusted total instead of hiding the math."],
        ["03", "Price roster spots", "The optional roster-cost model discounts the second, third, and later pieces. That models the practical truth that one elite starter is often worth more than four bench upgrades."],
      ],
    },
    redraft: {
      eyebrow: "In-season trades // explained",
      title: "Trade value changes when the season does.",
      intro:
        "Redraft value is about the current season: role, projected opportunity, and positional replacement cost. Use the analyzer as a market checkpoint, then layer in your standings and weekly lineup needs.",
      cards: [
        ["01", "Set the lineup format", "Quarterback and tight-end settings change scarcity. Match the tool to the league before comparing players."],
        ["02", "Enter the complete offer", "A two-for-one is not only two player values added together. The open roster spot and replacement player matter too."],
        ["03", "Use the verdict as a checkpoint", "A fair market offer can still be wrong for an 0–5 team or an injury-thin contender. The calculator prices the deal; you decide if it solves the problem."],
      ],
    },
    superflex: {
      eyebrow: "Superflex values // explained",
      title: "Quarterback scarcity changes everything.",
      intro:
        "Starting a second quarterback pushes reliable passers up the board and changes how picks, veterans, and positional depth should be bundled in trades.",
      cards: [
        ["01", "Value both QB slots", "Superflex market values price the ability to start a second quarterback. A generic 1QB chart will badly understate the cost."],
        ["02", "Respect the elite tier", "The gap between locked-in QB1 production and a fragile starter is hard to replace. Package discounts make consolidation cost visible."],
        ["03", "Compare exact picks", "A 1.03 and 1.10 are not generic firsts. Search exact slots for the current rookie class and future seasons."],
      ],
    },
  }[mode];

  return (
    <section className="page-wrap py-20">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h2 className="section-title mt-6">{copy.title}</h2>
        </div>
        <p className="max-w-2xl text-base leading-7 text-[#59605c]">{copy.intro}</p>
      </div>
      <div className="mt-10 grid border-l border-t border-[#171c19] md:grid-cols-3">
        {copy.cards.map(([number, title, body]) => (
          <article key={number} className="border-b border-r border-[#171c19] bg-white/35 p-6 sm:p-8">
            <span className="font-mono text-xs font-black text-[#ff6b3d]">{number}</span>
            <h3 className="mt-5 text-xl font-black tracking-[-0.035em]">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#69706c]">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
