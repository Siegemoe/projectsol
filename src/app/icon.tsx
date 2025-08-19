import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

// Placeholder favicon generated at build/runtime (no binary needed)
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: -0.5,
        }}
      >
        S
      </div>
    ),
    size
  );
}
