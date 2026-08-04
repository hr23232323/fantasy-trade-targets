import JsonLd from "./JsonLd";

const BASE_URL = "https://www.fantasytradetarget.com";

export default function WebAppSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name,
        description,
        url: `${BASE_URL}${path}`,
        applicationCategory: "SportsApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires a modern web browser with JavaScript enabled.",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: 0,
          priceCurrency: "USD",
        },
        provider: {
          "@id": `${BASE_URL}/#organization`,
        },
      }}
    />
  );
}
