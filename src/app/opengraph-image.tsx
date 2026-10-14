import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "PromptVault — Private AI Prompt Management System";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#09090b",
          backgroundImage: "radial-gradient(circle at 50% 20%, #1e1b4b 0%, #09090b 70%)",
          padding: "60px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          border: "12px solid #18181b",
        }}
      >
        {/* Top Header Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(129, 140, 248, 0.4)",
            borderRadius: "9999px",
            padding: "8px 20px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
            }}
          />
          <span
            style={{
              color: "#c7d2fe",
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Private Developer SaaS · Single Administrator
          </span>
        </div>

        {/* Center: Large Logo & Typography */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
          }}
        >
          {/* Logo SVG */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="100" height="100" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
                fill="#4F46E5"
                fillOpacity="0.25"
                stroke="#818CF8"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M16 7L24 11.5V20.5L16 25L8 20.5V11.5L16 7Z"
                fill="#1E1B4B"
                stroke="#A5B4FC"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M12 14L15.5 16L12 18"
                stroke="#C7D2FE"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="17.5"
                y1="18"
                x2="20.5"
                y2="18"
                stroke="#38BDF8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "68px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#fafafa" }}>Prompt</span>
            <span style={{ color: "#818cf8", marginLeft: "4px" }}>Vault</span>
          </div>

          <p
            style={{
              color: "#a1a1aa",
              fontSize: "24px",
              fontWeight: 400,
              maxWidth: "800px",
              textAlign: "center",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Private, single-user AI prompt management, versioning, templates, and multi-model testing workspace.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          {["CodeMirror 6 Editor", "Version Diffing", "Dynamic Templates", "Prompt Composer", "AI Playground", "Full Vault Backups"].map(
            (tag, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: "#e4e4e7",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {tag}
              </div>
            )
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
