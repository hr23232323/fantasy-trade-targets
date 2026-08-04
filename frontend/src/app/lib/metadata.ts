import type { Metadata } from "next";

const DEFAULT_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Fantasy Trade Target",
};

export function buildPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path || "/" },
    openGraph: {
      type: "website",
      url: path || "/",
      title,
      description,
      images: [DEFAULT_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_IMAGE.url],
    },
  };
}
