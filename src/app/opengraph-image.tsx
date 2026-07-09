import { ImageResponse } from "next/og";

export const alt =
  "Scaffold — a field guide for starting projects with less drift";
export const size = {
  height: 630,
  width: 1200,
};
export const contentType = "image/png";

const STATEMENT = "A field guide for starting projects with less drift.";
const FOOTER_LEFT = "scaffold.danielhowells.com";
const FOOTER_RIGHT = "Principles · Docs · Agent skill";

// Glyph subset the image actually uses — requested from Google Fonts so Satori
// renders in real Inter instead of its default face.
const GLYPHS = `Scaffold ${STATEMENT} ${FOOTER_LEFT} ${FOOTER_RIGHT}`;

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
  const [medium, semibold] = await Promise.all([
    loadInter(500),
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
      <div style={{ alignItems: "center", display: "flex" }}>
        <div
          style={{
            backgroundColor: "#315c4b",
            borderRadius: 4,
            height: 13,
            width: 13,
          }}
        />
        <div
          style={{
            color: "#1d1d1b",
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            marginLeft: 13,
          }}
        >
          Scaffold
        </div>
      </div>

      <div
        style={{
          color: "#1d1d1b",
          display: "flex",
          fontSize: 62,
          fontWeight: 500,
          letterSpacing: "-0.022em",
          lineHeight: 1.15,
          maxWidth: 880,
        }}
      >
        {STATEMENT}
      </div>

      <div
        style={{
          alignItems: "center",
          borderTop: "1px solid rgba(29,29,27,0.10)",
          color: "#807e76",
          display: "flex",
          fontSize: 24,
          fontWeight: 500,
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
        { data: medium, name: "Inter", style: "normal", weight: 500 },
        { data: semibold, name: "Inter", style: "normal", weight: 600 },
      ],
    }
  );
};

export default OpengraphImage;
