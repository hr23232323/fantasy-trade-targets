import Script from "next/script";

export type FaqItem = {
  question: string;
  answer: string;
};

export default function FaqBlock({
  items,
  title = "Questions, answered.",
}: {
  items: FaqItem[];
  title?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className="page-wrap py-20">
      <Script
        id={`faq-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
        <div>
          <span className="eyebrow">FAQ // straight answers</span>
          <h2 className="section-title mt-6">{title}</h2>
        </div>
        <div className="border-t border-[#171c19]">
          {items.map((item) => (
            <details key={item.question} className="group border-b border-[#171c19]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-lg font-bold tracking-[-0.025em]">
                {item.question}
                <span className="font-mono text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-3xl pb-6 pr-8 text-sm leading-7 text-[#5c635f]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
