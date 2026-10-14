import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const alt = "VTU Adda Projects";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const fontPath = path.join(process.cwd(), "public", "fonts", "SourceSerif4-Regular.ttf");
  const fontData = fs.readFileSync(fontPath);

  return new ImageResponse(
    (
      <div
        style={{
          height: 630,
          width: 1200,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#FBFAF7",
          padding: "72px 80px",
          fontFamily: "Source Serif 4",
          border: "12px solid #DDD9D0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#5F6670",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            VTU Adda Projects
          </div>
          <div
            style={{
              fontSize: "52px",
              fontWeight: 700,
              color: "#17191C",
              lineHeight: 1.15,
              maxWidth: "980px",
            }}
          >
            Engineering Project Kits, Custom Builds and Mentoring
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: 1040,
            borderTop: "2px solid #DDD9D0",
            paddingTop: "28px",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              color: "#4A5058",
            }}
          >
            projects.vtuadda.com · For VTU Engineering Students
          </div>
          <div
            style={{
              fontSize: "20px",
              color: "#5F6670",
            }}
          >
            Source Code · Report · Viva
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Source Serif 4",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
