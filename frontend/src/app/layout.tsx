import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { CSPostHogProvider } from "./components/PosthogProvider";
import SiteHeader from "./components/SiteHeader";
import Footer from "./components/Footer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fantasytradetarget.com"),
  title: {
    default: "Fantasy Trade Target — Free Fantasy Football Trade Calculator",
    template: "%s | Fantasy Trade Target",
  },
  description:
    "A free dynasty and redraft fantasy football trade calculator with daily market values, rookie picks, Superflex, and TE premium support.",
  applicationName: "Fantasy Trade Target",
  category: "sports",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.fantasytradetarget.com",
    siteName: "Fantasy Trade Target",
    title: "Fantasy Trade Target",
    description:
      "Build a trade. Price every piece. See the roster-cost-adjusted verdict.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fantasy Trade Target trade calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fantasy Trade Target",
    description:
      "Free dynasty and redraft trade values, calculators, and rankings.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171c19",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Fantasy Trade Target",
  url: "https://www.fantasytradetarget.com",
  description:
    "Free fantasy football trade calculators, dynasty values, and rankings.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <CSPostHogProvider>
          <div className="site-shell">
            <SiteHeader />
            <main className="min-h-[70vh]">{children}</main>
            <Footer />
          </div>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
