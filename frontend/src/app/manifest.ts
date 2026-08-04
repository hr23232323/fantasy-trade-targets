import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fantasy Trade Target",
    short_name: "FTT",
    description:
      "Fantasy football market values, player and team research, NFL schedules, rankings, and deterministic trade tools.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f0e7",
    theme_color: "#171c19",
    icons: [
      {
        src: "/brand-mark-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand-mark-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
