import Link from "next/link";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export default function PageHero({
  eyebrow,
  title,
  accent,
  description,
  primaryHref = "#trade-calculator",
  primaryLabel = "Build a trade",
  secondaryHref = "/methodology",
  secondaryLabel = "See the methodology",
}: PageHeroProps) {
  return (
    <section className="page-wrap py-14 sm:py-20">
      <span className="eyebrow">{eyebrow}</span>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.45fr_0.55fr] lg:items-end">
        <h1 className="display-type max-w-5xl uppercase">
          {title} {accent && <span className="text-[#ff6b3d]">{accent}</span>}
        </h1>
        <div className="border-l border-[#171c19] pl-5">
          <p className="text-base font-medium leading-7 text-[#515854]">{description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#dfff4f] hover:bg-[#2c342f]"
            >
              {primaryLabel} ↘
            </Link>
            <Link
              href={secondaryHref}
              className="border border-[#171c19] bg-white/50 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em] hover:bg-white"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
