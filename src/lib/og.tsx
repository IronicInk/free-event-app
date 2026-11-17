/**
 * Social share preview images (what shows up when a link is posted on
 * Instagram stories, iMessage, X, Facebook, Slack…).
 * Generated as 1200×630 PNGs by next/og.
 */
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

interface OgCardProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** CSS gradient for the background. */
  background: string;
}

export function renderOgImage({ eyebrow, title, subtitle, background }: OgCardProps) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundImage: background,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              padding: "10px 24px",
              borderRadius: 999,
              background: "#16a34a",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            FREE
          </div>
          <div style={{ display: "flex", fontSize: 30, opacity: 0.9 }}>{eyebrow}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>
            {title}
          </div>
          <div style={{ display: "flex", fontSize: 34, opacity: 0.9 }}>{subtitle}</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
