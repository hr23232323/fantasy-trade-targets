import { buildPageMetadata } from "../lib/metadata";

export const metadata = buildPageMetadata({
  title: "Free Fantasy Football Trade Meme Generator — No Signup",
  description: "Make and download a fantasy football trade meme for your league chat. Free templates, no signup, and no paid AI call.",
  path: "/create-meme",
});

export default function CreateMemeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
