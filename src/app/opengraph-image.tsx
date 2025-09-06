import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const runtime = "edge";

// Placeholder Open Graph image (no binary needed)
// URL: /opengraph-image (auto-used for OG/Twitter previews)
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)",
          color: "#ffffff",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.08,
            background:
              "radial-gradient(circle at 20% 20%, #ffffff 0%, transparent 30%), radial-gradient(circle at 80% 60%, #ffffff 0%, transparent 30%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: -0.5,
              }}
            >
              S
            </div>
            <div
              style={{
                fontSize: 28,
                color: "#d4d4d4",
                letterSpacing: -0.25,
                fontWeight: 600,
              }}
            >
              ProjectSol
            </div>
          </div>

          <h1
            style={{
              marginTop: 28,
              fontSize: 84,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: -1.5,
              background:
                "linear-gradient(90deg, #ffffff, #c9c9c9)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Memory-first AI for real work.
          </h1>

          <p
            style={{
              marginTop: 18,
              fontSize: 28,
              color: "#cfcfcf",
              maxWidth: 900,
            }}
          >
            Structured memory, speed, and clean UX — preview build.
          </p>
        </div>
      </div>
    ),
    { ...size, fonts: [] }
  );
}
