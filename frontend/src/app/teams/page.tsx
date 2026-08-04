import Image from "next/image";
import Link from "next/link";
import JsonLd from "../components/JsonLd";
import TeamMap from "../components/TeamMap";
import { getMarket } from "../lib/market";
import { buildPageMetadata } from "../lib/metadata";
import {
  averageEnvironment,
  environmentClass,
  environmentLabel,
  formatRecord,
  getTeamAssets,
  getUpcomingGames,
  teamRelease,
  teams,
} from "../lib/team-data";

export const metadata = buildPageMetadata({
  title: "NFL Team Fantasy Outlooks, Schedules & Dynasty Players",
  description:
    "Browse all 32 NFL teams with current dynasty assets, 2026 schedules, matchup environment signals, team context, venues, and linked fantasy player research.",
  path: "/teams",
});

const divisions = [
  "AFC East",
  "AFC North",
  "AFC South",
  "AFC West",
  "NFC East",
  "NFC North",
  "NFC South",
  "NFC West",
];

export default async function TeamsPage() {
  const market = await getMarket({ format: "dynasty", numQbs: 2 });
  const teamCards = teams.map((team) => {
    const assets = getTeamAssets(team, market.assets);
    const openingWindow = getUpcomingGames(team, 4);
    const environment = averageEnvironment(openingWindow);
    return {
      team,
      topAsset: assets[0],
      environment,
      label: environmentLabel(environment),
    };
  });

  return (
    <>
      <JsonLd data={buildSchema()} />

      <section className="page-wrap py-14 sm:py-20">
        <span className="eyebrow">NFL team intelligence // all 32</span>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <h1 className="display-type max-w-5xl uppercase">
            Every team. <span className="text-[#ff6b3d]">One connected market.</span>
          </h1>
          <div className="border-l border-[#171c19] pl-5">
            <p className="text-base font-medium leading-7 text-[#515854]">
              Current dynasty rosters meet the complete {teamRelease.season} calendar, opponent scoring context, rest, venue, and player research.
            </p>
            <Link
              href="#team-directory"
              className="mt-6 inline-block border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#dfff4f]"
            >
              Choose a team ↓
            </Link>
          </div>
        </div>
      </section>

      <section className="page-wrap grid gap-8 pb-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
        <TeamMap />
        <div className="border border-[#171c19] bg-[#171c19] p-7 text-white sm:p-10">
          <span className="mono-label text-[#dfff4f]">How to read the layer</span>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.055em]">Market value, connected to the calendar.</h2>
          <div className="mt-8 space-y-5 text-sm leading-7 text-white/70">
            <p>Each team page ranks its fantasy assets on the current dynasty Superflex scale and links every available player research file.</p>
            <p>Matchup temperatures use the opponent&apos;s {teamRelease.baselineSeason} NFL scoring defense, then account for site and rest. They describe a team scoring environment—not a player projection.</p>
          </div>
          <div className="mt-9 grid grid-cols-5 gap-1" aria-label="Matchup temperature legend">
            {(["Cold", "Cool", "Balanced", "Warm", "Hot"] as const).map((label) => (
              <div key={label} className={`${environmentClass(label)} px-1 py-3 text-center font-mono text-[8px] font-black uppercase text-[#171c19] sm:text-[10px]`}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="team-directory" className="page-wrap scroll-mt-8 py-10">
        <div className="border-t border-[#171c19] pt-7">
          <span className="eyebrow">Team directory</span>
          <h2 className="section-title mt-6">Browse by division.</h2>
        </div>

        <div className="mt-12 space-y-14">
          {divisions.map((division) => (
            <section key={division} aria-labelledby={`${division.replaceAll(" ", "-")}-title`}>
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-[#171c19] pb-3">
                <h3 id={`${division.replaceAll(" ", "-")}-title`} className="text-2xl font-black tracking-[-0.04em]">{division}</h3>
                <span className="mono-label text-[#69706c]">4 teams</span>
              </div>
              <div className="grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2 xl:grid-cols-4">
                {teamCards
                  .filter(({ team }) => team.division === division)
                  .map(({ team, topAsset, environment, label }) => (
                    <Link
                      key={team.abbr}
                      href={`/teams/${team.slug}`}
                      className="group bg-[#f3f0e7] p-5 hover:bg-white"
                      style={{ borderTop: `8px solid ${team.colors[0]}` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="mono-label text-[#69706c]">{team.abbr} · {formatRecord(team)} in {teamRelease.baselineSeason}</span>
                          <h4 className="mt-2 text-2xl font-black tracking-[-0.045em]">{team.name}</h4>
                        </div>
                        <div className="grid h-16 w-16 shrink-0 place-items-center bg-white p-2">
                          <Image src={team.logo.src} alt={team.logo.alt} width={56} height={56} className="h-12 w-12 object-contain" />
                        </div>
                      </div>
                      <dl className="mt-9 grid grid-cols-[1fr_auto] gap-x-3 gap-y-3 border-t border-[#bcb9ae] pt-4 text-xs">
                        <dt className="text-[#69706c]">Top dynasty asset</dt>
                        <dd className="text-right font-bold">{topAsset?.name ?? "Market updating"}</dd>
                        <dt className="text-[#69706c]">First four games</dt>
                        <dd className={`${environmentClass(label)} border border-[#171c19] px-2 py-1 font-mono text-[9px] font-black uppercase`}>
                          {label} · {environment ?? "—"}
                        </dd>
                      </dl>
                      <span className="mt-6 inline-block font-mono text-[10px] font-black uppercase tracking-[0.07em] group-hover:translate-x-1">
                        Open team outlook →
                      </span>
                    </Link>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <aside className="page-wrap mt-12 border-t border-[#9d9a91] pt-5 text-[11px] leading-6 text-[#69706c]">
        Current market values update daily. Schedule, team identity, and prior-season scoring context are sourced from nflverse under CC BY 4.0. Team names and marks identify their respective clubs; Fantasy Trade Target is not affiliated with the NFL or its teams. See <Link href="/data-sources" className="underline underline-offset-2">sources and methodology</Link>.
      </aside>
    </>
  );
}

function buildSchema() {
  const url = "https://www.fantasytradetarget.com/teams";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: "NFL team fantasy outlooks",
        description: `All 32 NFL teams with ${teamRelease.season} schedules, dynasty assets, and matchup environment context.`,
        dateModified: teamRelease.capturedAt,
        publisher: { "@id": "https://www.fantasytradetarget.com/#organization" },
        mainEntity: { "@id": `${url}#teams` },
      },
      {
        "@type": "ItemList",
        "@id": `${url}#teams`,
        numberOfItems: teams.length,
        itemListElement: teams.map((team, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: team.name,
          url: `${url}/${team.slug}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.fantasytradetarget.com/" },
          { "@type": "ListItem", position: 2, name: "Teams", item: url },
        ],
      },
    ],
  };
}
