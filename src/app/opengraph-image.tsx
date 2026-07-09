import { ImageResponse } from "next/og";

export const alt = "Scaffold — a project baseline, written down";
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
        background: "#1d1d1b",
        color: "#e8e6e1",
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
          color: "#7fa896",
          fontSize: 32,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
        }}
      >
        A project baseline
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
          color: "#a3a199",
          fontSize: 40,
          lineHeight: 1.3,
          marginTop: 32,
          maxWidth: "900px",
        }}
      >
        The way I start projects: repo shape, tooling, boundaries, and launch
        readiness.
      </div>
    </div>,
    { ...size }
  );

export default OpengraphImage;
