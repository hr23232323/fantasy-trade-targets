import { buildPageMetadata } from "../lib/metadata";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "Privacy policy for Fantasy Trade Target.",
  path: "/privacy-policy",
});

const sections = [
  ["What we collect", "Fantasy Trade Target does not require an account and does not ask for your name or email. Standard server logs may contain technical request data such as IP address, browser type, requested URL, and timestamps. Product analytics may collect page views, referrers, device information, performance, errors, and interactions with site features."],
  ["Trade and form data", "Trades you build are calculated in your browser. A shared trade is encoded in the URL you choose to copy, and analytics may receive that page URL. Custom analytics events do not include market-search phrases or text entered into the meme generator. Do not place private or sensitive information in a shared URL."],
  ["Third-party services", "Published market releases are compiled from the licensed Tradyr public API before deployment. The meme page loads generated images from memegen.link. Hosting and infrastructure providers may process technical request data as needed to operate the site."],
  ["Analytics storage", "When enabled, PostHog provides product analytics using browser local storage rather than marketing cookies. Session replay is disabled. Analytics is configured to honor the browser Do Not Track preference. Future advertising or affiliate integrations will require this policy to be updated before launch."],
  ["Retention and choices", "Infrastructure and analytics data are retained according to their provider configurations. You may enable Do Not Track, block analytics with browser privacy controls, or clear site data stored by your browser. Because there are no user accounts, there is no account profile to access or delete."],
  ["Contact", "Questions about this policy can be sent to privacy@fantasytradetarget.com."],
];

export default function PrivacyPolicyPage() {
  return (
    <article className="page-wrap py-16 sm:py-24">
      <span className="eyebrow">Legal // privacy</span>
      <h1 className="display-type mt-7 uppercase">Privacy policy.</h1>
      <p className="mt-7 font-mono text-xs uppercase tracking-[0.07em] text-[#69706c]">Last updated August 4, 2026</p>
      <div className="mt-12 max-w-4xl border-t border-[#171c19]">
        {sections.map(([title, body]) => (
          <section key={title} className="grid gap-4 border-b border-[#171c19] py-7 md:grid-cols-[0.38fr_1fr]">
            <h2 className="text-xl font-black tracking-[-0.035em]">{title}</h2>
            <p className="text-sm leading-7 text-[#59605c]">{body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
