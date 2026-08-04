import { buildPageMetadata } from "../lib/metadata";

export const metadata = buildPageMetadata({
  title: "Free Fantasy Football Trade Meme Generator",
  description: "Create free fantasy football trade memes for your league chat. Deterministic, no login, and no paid AI call.",
  path: "/create-meme",
});

export default function CreateMemeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
