import BrandMark from "./BrandMark";
import { TrackedLink } from "./TrackedLink";

const tools = [
  ["Dynasty calculator", "/dynasty-trade-calculator"],
  ["Fantasy football trade targets", "/fantasy-football-trade-targets"],
  ["Scoring impact lab", "/scoring-impact"],
  ["6-point passing TD rankings", "/scoring/6-point-passing-td-rankings"],
  ["Standard vs. PPR values", "/scoring/standard-vs-ppr-player-values"],
  ["Half PPR trade values", "/scoring/half-ppr-trade-values"],
  ["Player research", "/players"],
  ["Market data", "/market"],
  ["Team outlooks", "/teams"],
  ["Redraft analyzer", "/fantasy-football-trade-analyzer"],
  ["Superflex calculator", "/dynasty-superflex-trade-calculator"],
  ["Dynasty rankings", "/dynasty-rankings"],
  ["Redraft value chart", "/fantasy-football-trade-value-chart"],
  ["Trade memes", "/create-meme"],
];

const company = [
  ["About", "/about"],
  ["Methodology", "/methodology"],
  ["Data sources", "/data-sources"],
  ["Editorial policy", "/editorial-policy"],
  ["FAQ", "/faq"],
  ["Privacy", "/privacy-policy"],
  ["Terms", "/terms-of-service"],
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[#171c19] bg-[#171c19] text-white">
      <div className="page-wrap grid gap-12 py-14 md:grid-cols-[1.35fr_1fr_1fr]">
        <div>
          <BrandMark className="mb-5 h-12 w-12" title="Fantasy Trade Target" />
          <h2 className="max-w-md text-3xl font-black tracking-[-0.055em]">
            Better offers start with better reference points.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
            Independent fantasy football tools. Not affiliated with the NFL,
            Sleeper, or any fantasy platform.
          </p>
        </div>
        <FooterLinks title="Tools" links={tools} />
        <FooterLinks title="Inside the model" links={company} />
      </div>
      <div className="border-t border-white/15">
        <div className="page-wrap flex flex-col gap-2 py-5 font-mono text-[10px] uppercase tracking-[0.08em] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Fantasy Trade Target</span>
          <TrackedLink
            href="/data-sources"
            className="text-[#dfff4f] hover:text-white"
            analyticsEvent="site_navigation_clicked"
            analyticsProperties={{
              location: "footer_bottom",
              destination: "/data-sources",
            }}
          >
            Sources, licensing & freshness →
          </TrackedLink>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: string[][];
}) {
  return (
    <div>
      <h3 className="mono-label mb-4 text-[#dfff4f]">{title}</h3>
      <ul className="space-y-3 text-sm text-white/70">
        {links.map(([label, href]) => (
          <li key={href}>
            <TrackedLink
              href={href}
              className="hover:text-white"
              analyticsEvent="site_navigation_clicked"
              analyticsProperties={{
                location: "footer",
                destination: href,
                label,
              }}
            >
              {label}
            </TrackedLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
