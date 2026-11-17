import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** Lets people "Add to Home Screen" on their phone and open it like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: "Free Events",
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0f",
    theme_color: "#ff2d6f",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
