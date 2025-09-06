import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

// Minimal static icon with no text to avoid font loading on Windows
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          // add a subtle inner circle purely with CSS (no text, so no fonts)
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9999,
            background: "#1f2937",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.06)",
          }}
        />
      </div>
    ),
    { ...size, fonts: [] }
  );
}
