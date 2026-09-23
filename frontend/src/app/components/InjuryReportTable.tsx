import Link from "next/link";
import PlayerThumbnail from "./PlayerThumbnail";
import TeamLogo from "./TeamLogo";
import type { FantasyInjuryRow } from "../lib/injuries";

export default function InjuryReportTable({ rows }: { rows: FantasyInjuryRow[] }) {
  return <div className="overflow-x-auto border border-[#171c19] bg-white/60"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Player</th><th className="p-4">Team</th><th className="p-4">Game status</th><th className="p-4">Practice</th><th className="p-4">Listed injury</th></tr></thead><tbody className="divide-y divide-[#bcb9ae]">{rows.map((row) => <tr key={row.slug}><td className="p-4"><span className="flex items-center gap-3"><PlayerThumbnail slug={row.slug} name={row.name} position={fantasyPosition(row.position)} team={row.team} size={48} /><span><Link href={`/players/${row.slug}`} className="font-black hover:underline">{row.name}</Link><span className="ml-2 font-mono text-[10px] font-bold text-[#69706c]">{row.position}</span></span></span></td><td className="p-4"><span className="flex items-center gap-2"><TeamLogo team={row.team} size={28} /><span className="font-mono font-bold">{row.team ?? "—"}</span></span></td><td className="p-4"><span className={`inline-block border border-[#171c19] px-3 py-2 font-mono text-[10px] font-black uppercase ${statusClass(row.status)}`}>{row.status}</span></td><td className="p-4">{row.practice}</td><td className="p-4 font-bold">{row.injury}</td></tr>)}</tbody></table></div>;
}

function fantasyPosition(position: string | null) {
  return position === "QB" || position === "RB" || position === "WR" || position === "TE" ? position : undefined;
}

function statusClass(status: string) {
  const value = status.toLowerCase();
  if (value.includes("out") || value.includes("doubtful")) return "bg-[#ff6b3d]";
  if (value.includes("questionable") || value.includes("did not")) return "bg-[#ffb29a]";
  if (value.includes("limited")) return "bg-[#d7b6ff]";
  return "bg-[#dfff4f]";
}
