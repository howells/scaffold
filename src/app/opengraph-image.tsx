import { ImageResponse } from "next/og";

export const alt = "Scaffold — the Howells project baseline";
export const size = {
  height: 630,
  width: 1200,
};
export const contentType = "image/png";

const OpengraphImage = () =>
  new ImageResponse(
    <div
      style={{
        alignItems: "flex-start",
        background: "#0a0a0a",
        color: "#fafafa",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        padding: "80px",
        width: "100%",
      }}
    >
      <div
        style={{
          color: "#a1a1aa",
          fontSize: 32,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
        }}
      >
        Howells Baseline
      </div>
      <div
        style={{
          fontSize: 160,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          marginTop: 24,
        }}
      >
        Scaffold
      </div>
      <div
        style={{
          color: "#d4d4d8",
          fontSize: 40,
          lineHeight: 1.3,
          marginTop: 32,
          maxWidth: "900px",
        }}
      >
        Project shape, tooling, package boundaries, and launch readiness for new
        TypeScript repos.
      </div>
    </div>,
    { ...size }
  );

export default OpengraphImage;
