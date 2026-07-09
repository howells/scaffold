import { ImageResponse } from "next/og";

export const alt = "Scaffold — a project baseline";
export const size = {
  height: 630,
  width: 1200,
};
export const contentType = "image/png";

const DESCRIPTION =
  "The baseline I start projects from: repo shape, tooling, package boundaries, agent workflow, and launch readiness.";
const FOOTER_LEFT = "scaffold.danielhowells.com";
const FOOTER_RIGHT = "Principles · Docs · Agent skill";

// Glyph subset the image actually uses — requested from Google Fonts so Satori
// renders in real Inter instead of its default face.
const GLYPHS = `Scaffold ${DESCRIPTION} ${FOOTER_LEFT} ${FOOTER_RIGHT}`;

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
        color: "#1d1d1b",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter",
        height: "100%",
        justifyContent: "space-between",
        padding: 100,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ alignItems: "center", display: "flex" }}>
          <div
            style={{
              backgroundColor: "#315c4b",
              borderRadius: 4,
              height: 12,
              width: 12,
            }}
          />
          <div
            style={{
              color: "#1d1d1b",
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              marginLeft: 12,
            }}
          >
            Scaffold
          </div>
        </div>
        <div
          style={{
            color: "#75736b",
            fontSize: 30,
            fontWeight: 400,
            lineHeight: 1.5,
            marginTop: 24,
            maxWidth: 720,
          }}
        >
          {DESCRIPTION}
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          borderTop: "1px solid rgba(29,29,27,0.10)",
          color: "#807e76",
          display: "flex",
          fontSize: 22,
          fontWeight: 400,
          justifyContent: "space-between",
          paddingTop: 28,
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
