import { NextRequest, NextResponse } from "next/server";

const templates = [
  ["drake", (give: string, send: string) => [`Keeping ${send}`, `Getting ${give}`]],
  ["buzz", (give: string) => [`${give}`, `${give} everywhere`]],
  ["db", (give: string, send: string) => [`Trade away ${send}`, `Acquire ${give}`, "Win the league"]],
  ["oprah", (give: string) => [`You get ${give}`, `You get ${give}`, `Everybody gets ${give}`]],
  ["gru", (give: string, send: string) => [`Offer ${send}`, `Ask for ${give}`, "They accept", "They accepted?!"]],
  ["fry", (give: string, send: string) => [`Not sure if fair trade`, `Or ${send} is secretly cooked`]],
  ["success", (give: string) => [`Trade offer accepted`, `${give} is finally mine`]],
  ["fine", (_give: string, send: string) => [`My roster after trading ${send}`, "This is fine"]],
  ["both", (give: string, send: string) => [`Keep ${send}?`, `Trade for ${give}?`, "Why not both?"]],
  ["wonka", (give: string) => [`Oh, you want ${give}?`, "Tell me more about your waiver-wire package"]],
  ["icanhas", (give: string) => [`I can has`, `${give}?`]],
  ["morpheus", (give: string) => [`What if I told you`, `${give} is available for the right price`]],
] as const;

function clean(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return value.replace(/[<>]/g, "").trim().slice(0, 80) || fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const give = clean(body.give, "your trade target");
    const send = clean(body.send, "your entire bench");
    const seed = `${give}|${send}`.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
    const ordered = [...templates.slice(seed % templates.length), ...templates.slice(0, seed % templates.length)];

    const memeTexts = ordered.map(([id, makeLines]) => {
      const lines = makeLines(give, send);
      return {
        id,
        texts: [
          {
            topText: lines[0] || "",
            bottomText: lines.slice(1).join(" / "),
          },
        ],
      };
    });

    return NextResponse.json(
      { memeTexts, deterministic: true },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch {
    return NextResponse.json({ error: "Invalid meme request" }, { status: 400 });
  }
}
