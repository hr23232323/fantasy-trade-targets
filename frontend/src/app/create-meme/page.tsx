"use client";

import { useState } from "react";
import { FiDownload, FiZap } from "react-icons/fi";
import { captureAnalytics } from "../lib/analytics";

type GeneratedMeme = {
  id: string;
  texts: Array<{ topText: string; bottomText: string }>;
};

function memeUrl(meme: GeneratedMeme) {
  const top = encodeURIComponent(meme.texts[0]?.topText || "_");
  const bottom = encodeURIComponent(meme.texts[0]?.bottomText || "_");
  return `https://api.memegen.link/images/${meme.id}/${top}/${bottom}.png`;
}

export default function CreateMemePage() {
  const [give, setGive] = useState("");
  const [send, setSend] = useState("");
  const [memes, setMemes] = useState<GeneratedMeme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate-meme-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ give, send }),
      });
      if (!response.ok) throw new Error("Meme generation failed");
      const data = await response.json();
      const generated = data.memeTexts || [];
      setMemes(generated);
      captureAnalytics("memes_generated", {
        meme_count: generated.length,
        target_length: give.trim().length,
        offer_length: send.trim().length,
      });
    } catch (generationError) {
      setError("The meme bench missed that one. Try again.");
      captureAnalytics("meme_generation_failed", {
        target_length: give.trim().length,
        offer_length: send.trim().length,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="page-wrap py-14 sm:py-20">
        <span className="eyebrow">Trade meme generator // still unhinged</span>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <h1 className="display-type uppercase">Send the offer. <span className="text-[#ff6b3d]">Then send the meme.</span></h1>
          <p className="border-l border-[#171c19] pl-5 text-base leading-7 text-[#59605c]">
            A free deterministic meme generator for your league chat. No AI call, no account,
            and no reason to send another “thoughts?” text by itself.
          </p>
        </div>
      </section>

      <section className="page-wrap paper-card p-5 sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="mono-label mb-2 block text-[#69706c]">I’m trying to get</span>
            <input
              value={give}
              onChange={(event) => setGive(event.target.value)}
              placeholder="Bijan Robinson"
              className="h-14 w-full border border-[#171c19] bg-white px-4 text-base font-bold"
            />
          </label>
          <label>
            <span className="mono-label mb-2 block text-[#69706c]">I’m offering</span>
            <input
              value={send}
              onChange={(event) => setSend(event.target.value)}
              placeholder="Three flex players and hope"
              className="h-14 w-full border border-[#171c19] bg-white px-4 text-base font-bold"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={!give.trim() || !send.trim() || loading}
          className="mt-5 inline-flex items-center gap-2 border border-[#171c19] bg-[#dfff4f] px-6 py-4 font-mono text-xs font-black uppercase tracking-[0.08em] shadow-[4px_4px_0_#171c19] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiZap /> {loading ? "Generating…" : "Generate trade memes"}
        </button>
        {error && <p className="mt-4 text-sm font-bold text-[#a23616]">{error}</p>}
      </section>

      <section className="page-wrap py-16">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <span className="eyebrow">Built for league chat</span>
            <h2 className="section-title mt-6">A joke with the exact offer attached.</h2>
          </div>
          <div className="grid border-l border-t border-[#171c19] sm:grid-cols-3">
            {[
              ["Name the target", "Use the player or pick you are trying to acquire so the meme is specific to the negotiation."],
              ["Describe the package", "Enter the real offer or the funniest honest summary of it. The same inputs always produce the same set."],
              ["Send the evidence too", "Pair the meme with a shared calculator URL when the group chat inevitably asks whether the trade is fair."],
            ].map(([title, body]) => (
              <article key={title} className="border-b border-r border-[#171c19] bg-white/35 p-6">
                <h3 className="text-lg font-black tracking-[-0.03em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#69706c]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {memes.length > 0 && (
        <section className="page-wrap mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {memes.map((meme) => {
            const url = memeUrl(meme);
            return (
              <article key={meme.id} className="paper-card mb-5 break-inside-avoid p-3">
                {/* External generator is intentional: it keeps this indexed legacy tool free. */}
                <img src={url} alt={`Fantasy trade meme about ${give}`} className="block h-auto w-full" />
                <a
                  href={url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-2 py-2 font-mono text-[10px] font-black uppercase tracking-[0.07em] hover:bg-[#dfff4f]"
                  onClick={() =>
                    captureAnalytics("meme_download_opened", {
                      template_id: meme.id,
                    })
                  }
                >
                  <FiDownload /> Open / download
                </a>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
