import { ImageResponse } from "next/og";

export const alt = "Scaffold — a project baseline, written down";
export const size = {
  height: 630,
  width: 1200,
};
export const contentType = "image/png";

const SUBTITLE =
  "Repo shape, tooling, package boundaries, agent workflow, and launch readiness. The baseline, written down.";
const FOOTER_LEFT = "scaffold.danielhowells.com";
const FOOTER_RIGHT = "Principles · Docs · Agent skill";
const ATTRIBUTION = "Daniel Howells";

// Glyph subset the image actually uses — requested from Google Fonts so Satori
// renders in real Inter instead of its default face.
const GLYPHS = `Scaffold ${ATTRIBUTION} ${SUBTITLE} ${FOOTER_LEFT} ${FOOTER_RIGHT}`;

async function loadInter(weight: number): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(GLYPHS)}`;
  const css = await (await fetch(url)).text();
  const src = css.match(
    /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/
  )?.[1];
  if (!src) {
    throw new Error("Failed to resolve Inter font URL for the OG image.");
  }
  return (await fetch(src)).arrayBuffer();
}

const OpengraphImage = async () => {
  const [regular, semibold] = await Promise.all([
    loadInter(400),
    loadInter(600),
  ]);

  return new ImageResponse(
    <div
      style={{
        backgroundColor: "#fbfbf9",
        backgroundImage:
          "radial-gradient(1100px circle at 86% -14%, rgba(49,92,75,0.14), transparent 56%)",
        color: "#1d1d1b",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter",
        height: "100%",
        justifyContent: "space-between",
        padding: 80,
        width: "100%",
      }}
    >
      <div style={{ alignItems: "center", display: "flex" }}>
        <div
          style={{
            backgroundColor: "#315c4b",
            borderRadius: 5,
            height: 18,
            width: 18,
          }}
        />
        <div
          style={{
            color: "#57564f",
            fontSize: 27,
            fontWeight: 400,
            marginLeft: 16,
          }}
        >
          {ATTRIBUTION}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            color: "#1d1d1b",
            fontSize: 184,
            fontWeight: 600,
            letterSpacing: "-0.045em",
            lineHeight: 1,
          }}
        >
          Scaffold
        </div>
        <div
          style={{
            color: "#6a6960",
            fontSize: 39,
            fontWeight: 400,
            lineHeight: 1.32,
            marginTop: 30,
            maxWidth: 840,
          }}
        >
          {SUBTITLE}
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          borderTop: "1px solid rgba(29,29,27,0.10)",
          color: "#57564f",
          display: "flex",
          fontSize: 27,
          justifyContent: "space-between",
          paddingTop: 30,
        }}
      >
        <div>{FOOTER_LEFT}</div>
        <div>{FOOTER_RIGHT}</div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { data: regular, name: "Inter", style: "normal", weight: 400 },
        { data: semibold, name: "Inter", style: "normal", weight: 600 },
      ],
    }
  );
};

export default OpengraphImage;
