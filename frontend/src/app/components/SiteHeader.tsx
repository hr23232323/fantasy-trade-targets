"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { captureAnalytics } from "../lib/analytics";
import BrandMark from "./BrandMark";

const links = [
  { href: "/dynasty-trade-calculator", label: "Calculator" },
  { href: "/fantasy-football-trade-targets", label: "Targets" },
  { href: "/players", label: "Players" },
  { href: "/market", label: "Market" },
  { href: "/teams", label: "Teams" },
  { href: "/scoring-impact", label: "Scoring" },
  { href: "/fantasy-trade-calculator", label: "Redraft" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header>
      <div className="border-b border-[#171c19] bg-[#171c19] text-[#dfff4f]">
        <div className="page-wrap flex h-8 items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.12em]">
          <span>Free. No login. No nonsense.</span>
          <span className="hidden sm:inline">Market values refresh daily</span>
        </div>
      </div>
      <div className="border-b border-[#171c19] bg-[#f3f0e7]/95 backdrop-blur">
        <div className="page-wrap flex h-[76px] items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-3"
            onClick={() => {
              captureAnalytics("site_navigation_clicked", {
                location: "header_brand",
                destination: "/",
              });
              setOpen(false);
            }}
          >
            <BrandMark className="h-11 w-11 shrink-0 shadow-[3px_3px_0_#171c19] transition-transform group-hover:-translate-y-0.5" />
            <span className="leading-none">
              <span className="block text-[17px] font-black tracking-[-0.04em]">
                FANTASY TRADE
              </span>
              <span className="block text-[17px] font-black tracking-[-0.04em]">
                TARGET
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href === "/players" && pathname.startsWith("/players/")) ||
                (link.href === "/fantasy-football-trade-targets" && pathname.startsWith("/fantasy-football-trade-targets/")) ||
                (link.href === "/market" && pathname.startsWith("/market/")) ||
                (link.href === "/teams" && pathname.startsWith("/teams/")) ||
                (link.href === "/scoring-impact" && pathname.startsWith("/scoring"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
                    active
                      ? "bg-[#171c19] text-white"
                      : "hover:bg-[#e4dfd2]"
                  }`}
                  onClick={() =>
                    captureAnalytics("site_navigation_clicked", {
                      location: "desktop_header",
                      destination: link.href,
                      label: link.label,
                    })
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center border border-[#171c19] bg-white lg:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => {
              captureAnalytics("mobile_navigation_toggled", {
                action: open ? "close" : "open",
              });
              setOpen((value) => !value);
            }}
          >
            {open ? <FiX size={21} /> : <FiMenu size={21} />}
          </button>
        </div>

        {open && (
          <nav
            className="page-wrap grid border-t border-[#171c19] py-3 lg:hidden"
            aria-label="Mobile navigation"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-[#bcb9ae] px-1 py-4 font-mono text-xs font-bold uppercase tracking-[0.08em] last:border-0"
                onClick={() => {
                  captureAnalytics("site_navigation_clicked", {
                    location: "mobile_header",
                    destination: link.href,
                    label: link.label,
                  });
                  setOpen(false);
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
