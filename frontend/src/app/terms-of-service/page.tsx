import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Fantasy Trade Target.",
  alternates: { canonical: "/terms-of-service" },
};

const sections = [
  ["Use of the site", "Fantasy Trade Target provides informational fantasy sports tools. You may use the public site for lawful personal or commercial fantasy-football research, subject to these terms and the rights of third-party data providers."],
  ["No wagering or financial advice", "Calculator results are entertainment and informational references. They are not guarantees of player performance, contest outcomes, financial return, or a successful trade."],
  ["Data and availability", "Market values can be delayed, incomplete, or unavailable. Player status and circumstances change quickly. We may modify, suspend, or discontinue any feature without notice."],
  ["Intellectual property", "The Fantasy Trade Target name, original interface, copy, and trade-engine implementation are protected by applicable law. Third-party names, data, and services remain the property of their respective owners and are used under their applicable terms."],
  ["Acceptable use", "Do not attack, overload, reverse engineer, bypass rate limits, or use the service to violate another person’s rights. Automated access must respect robots directives and reasonable request rates."],
  ["Disclaimer", "The service is provided as-is and as-available without warranties of accuracy, availability, merchantability, fitness for a particular purpose, or non-infringement to the maximum extent permitted by law."],
  ["Limitation of liability", "To the maximum extent permitted by law, Fantasy Trade Target will not be liable for indirect, incidental, special, consequential, or punitive damages arising from use of the site or reliance on a trade result."],
  ["Changes and contact", "We may update these terms by posting a revised date on this page. Questions can be sent to contact@fantasytradetarget.com."],
];

export default function TermsPage() {
  return (
    <article className="page-wrap py-16 sm:py-24">
      <span className="eyebrow">Legal // terms</span>
      <h1 className="display-type mt-7 uppercase">Terms of service.</h1>
      <p className="mt-7 font-mono text-xs uppercase tracking-[0.07em] text-[#69706c]">Last updated August 3, 2026</p>
      <div className="mt-12 max-w-4xl border-t border-[#171c19]">
        {sections.map(([title, body], index) => (
          <section key={title} className="grid gap-4 border-b border-[#171c19] py-7 md:grid-cols-[0.38fr_1fr]">
            <h2 className="text-xl font-black tracking-[-0.035em]">{index + 1}. {title}</h2>
            <p className="text-sm leading-7 text-[#59605c]">{body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
