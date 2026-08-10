import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getSharedTrade, tradeVerdictLabel } from "../lib/shared-trade";
import type { MarketAsset } from "../types/MarketAsset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const trade = await getSharedTrade(request.nextUrl.searchParams);
  const verdict = tradeVerdictLabel(trade.evaluation);

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#f3f0e7",
          color: "#171c19",
          padding: "54px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <TradeCardMark />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "24px", fontWeight: 900 }}>FANTASY TRADE TARGET</span>
              <span style={{ marginTop: "5px", fontSize: "14px", letterSpacing: "3px", color: "#69706c" }}>SHARED MARKET RECEIPT</span>
            </div>
          </div>
          <div style={{ display: "flex", padding: "12px 18px", border: "3px solid #171c19", background: "#171c19", color: "white", fontSize: "17px", fontWeight: 800, textTransform: "uppercase" }}>
            {trade.format} · {trade.numQbs === 2 ? "Superflex" : "1QB"} · {trade.passingTdPoints}PT TD · {pprLabel(trade.receptionPoints)}
          </div>
        </div>

        <div style={{ display: "flex", gap: "22px", marginTop: "42px", flex: 1 }}>
          <CardSide label="SIDE A RECEIVES" assets={trade.sideA} value={trade.evaluation.sideA.adjusted} color="#dfff4f" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "70px", fontSize: "34px", fontWeight: 900 }}>FOR</div>
          <CardSide label="SIDE B RECEIVES" assets={trade.sideB} value={trade.evaluation.sideB.adjusted} color="#ff6b3d" />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "3px solid #171c19", paddingTop: "22px" }}>
          <span style={{ fontSize: "27px", fontWeight: 900 }}>{verdict}</span>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "#69706c" }}>{trade.evaluation.percentDifference}% adjusted gap · fantasytradetarget.com</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
  response.headers.set("Cache-Control", "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function TradeCardMark() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <rect x="2" y="2" width="60" height="60" fill="#dfff4f" stroke="#171c19" strokeWidth="4" />
      <circle cx="32" cy="32" r="20" fill="#f3f0e7" stroke="#171c19" strokeWidth="4" />
      <path d="M15 23h27" fill="none" stroke="#171c19" strokeWidth="6" />
      <path d="m36 16 7 7-7 7" fill="none" stroke="#171c19" strokeWidth="6" />
      <path d="M49 41H22" fill="none" stroke="#ff6b3d" strokeWidth="6" />
      <path d="m28 34-7 7 7 7" fill="none" stroke="#ff6b3d" strokeWidth="6" />
      <circle cx="32" cy="32" r="3.5" fill="#171c19" />
    </svg>
  );
}

function CardSide({
  label,
  assets,
  value,
  color,
}: {
  label: string;
  assets: MarketAsset[];
  value: number;
  color: string;
}) {
  const visible = assets.slice(0, 3);
  return (
    <div style={{ display: "flex", flex: 1, flexDirection: "column", border: "3px solid #171c19", background: "white" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", background: color, borderBottom: "3px solid #171c19" }}>
        <span style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "2px" }}>{label}</span>
        <span style={{ fontSize: "28px", fontWeight: 900 }}>{Math.round(value)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", padding: "10px 16px" }}>
        {visible.map((asset) => (
          <div key={asset.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "84px", padding: "7px 0", borderBottom: "1px solid #d1cec4" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <TradeCardPortrait asset={asset} />
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span style={{ fontSize: "20px", fontWeight: 850, lineHeight: 1.05 }}>{asset.name}</span>
                <span style={{ marginTop: "5px", color: "#69706c", fontSize: "11px", fontWeight: 800, letterSpacing: "1px" }}>
                  {asset.kind === "player" ? `${asset.team || "NFL"} · ${asset.position}` : "DRAFT CAPITAL"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginLeft: "12px" }}>
              <span style={{ fontSize: "18px", fontWeight: 900 }}>{Math.round(asset.value)}</span>
              {asset.scoringContext?.valueDelta ? (
                <span style={{ marginTop: "3px", color: "#69706c", fontSize: "9px", fontWeight: 800 }}>
                  {asset.scoringContext.valueDelta > 0 ? "+" : ""}{asset.scoringContext.valueDelta} LEAGUE
                </span>
              ) : null}
            </div>
          </div>
        ))}
        {assets.length > visible.length && <span style={{ display: "flex", paddingTop: "10px", color: "#69706c", fontSize: "16px", fontWeight: 700 }}>+ {assets.length - visible.length} more assets</span>}
      </div>
    </div>
  );
}

function TradeCardPortrait({ asset }: { asset: MarketAsset }) {
  const color = positionColor(asset.position);
  const secondary = asset.position === "RB" || asset.position === "TE" ? "#dfff4f" : "#ff6b3d";
  const initials = asset.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <span
      style={{
        position: "relative",
        display: "flex",
        width: "62px",
        height: "68px",
        flexShrink: 0,
        overflow: "hidden",
        border: "2px solid #171c19",
        background: color,
      }}
    >
      <span style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 900, letterSpacing: "-1px" }}>
        {asset.kind === "pick" ? asset.year?.slice(-2) || "PK" : initials || asset.position}
      </span>
      <span style={{ position: "absolute", top: "-12px", right: "-16px", width: "42px", height: "84px", background: secondary, opacity: 0.48, transform: "rotate(18deg)" }} />
      <span style={{ position: "absolute", right: "3px", bottom: "3px", display: "flex", padding: "3px 4px", border: "1px solid #171c19", background: color, fontSize: "8px", fontWeight: 900 }}>
        {asset.position}
      </span>
    </span>
  );
}

function positionColor(position: MarketAsset["position"]) {
  if (position === "QB") return "#8bcfff";
  if (position === "RB") return "#ffb29a";
  if (position === "WR") return "#dfff4f";
  if (position === "TE") return "#d7b6ff";
  return "#dedbd1";
}

function pprLabel(points: number) {
  if (points === 0) return "STD";
  if (points === 0.5) return "HALF PPR";
  return "PPR";
}
