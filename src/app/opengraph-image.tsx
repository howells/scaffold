import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const regular = readFile(join(currentDirectory, "fonts/Inter-400.ttf"));
const semibold = readFile(join(currentDirectory, "fonts/Inter-600.ttf"));

const OpengraphImage = async () => {
  const [regularData, semiboldData] = await Promise.all([regular, semibold]);

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
        { data: regularData, name: "Inter", style: "normal", weight: 400 },
        { data: semiboldData, name: "Inter", style: "normal", weight: 600 },
      ],
    }
  );
};

export default OpengraphImage;
