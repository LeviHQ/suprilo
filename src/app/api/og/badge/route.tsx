import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Dynamic OpenGraph Image Generator for Badges
 * Route: GET /api/og/badge?id=...&name=...&rarity=...&creator=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") || "Achievement Unlocked";
    const rarity = (searchParams.get("rarity") || "common").toLowerCase();
    const creator = searchParams.get("creator") || "A Suprilo Creator";

    // Gradient styling per rarity
    let bgGradient = "linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)";
    let accentColor = "#94a3b8";
    let badgeBg = "#334155";

    if (rarity === "legendary") {
      bgGradient = "linear-gradient(to bottom right, #241400, #451a03, #1e112a)";
      accentColor = "#fbbf24";
      badgeBg = "#78350f";
    } else if (rarity === "epic") {
      bgGradient = "linear-gradient(to bottom right, #1e0b36, #3b0764, #180d26)";
      accentColor = "#e879f9";
      badgeBg = "#701a75";
    } else if (rarity === "rare") {
      bgGradient = "linear-gradient(to bottom right, #081d3d, #1e3a8a, #0b192e)";
      accentColor = "#60a5fa";
      badgeBg = "#1e40af";
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            background: bgGradient,
            padding: "60px 80px",
            fontFamily: "sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#ff6b8b",
                  letterSpacing: "-0.5px",
                }}
              >
                Suprilo
              </span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.6)",
                }}
              >
                / Badges
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: badgeBg,
                padding: "8px 24px",
                borderRadius: "9999px",
                border: `2px solid ${accentColor}`,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                }}
              >
                {rarity} ACHIEVEMENT
              </span>
            </div>
          </div>

          {/* Center Showcase */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.1)",
                border: `6px solid ${accentColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 64,
                marginBottom: 24,
                boxShadow: `0 0 60px ${accentColor}40`,
              }}
            >
              ✨
            </div>

            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-1px",
                marginBottom: 12,
              }}
            >
              {name}
            </div>

            <div
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.8)",
              }}
            >
              Earned by {creator}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              paddingTop: "24px",
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              Official Suprilo Verification Seal
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#ff6b8b",
              }}
            >
              suprilo.com
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response("Failed to generate OG image", { status: 500 });
  }
}

