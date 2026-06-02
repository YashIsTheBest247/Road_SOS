import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest — makes RoadSoS installable as a PWA so it
// can be launched from the home screen and used offline.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RoadSoS — Emergency Road Help",
    short_name: "RoadSoS",
    description:
      "Nearest hospitals, police, ambulance, towing & first-aid during road accidents — works offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#0f172a",
    orientation: "portrait",
    categories: ["medical", "navigation", "utilities"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
