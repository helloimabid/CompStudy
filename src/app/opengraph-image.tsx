import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CompStudy - Free Online Study Room & Pomodoro Timer | Study Together";
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
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Gradient Orb */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "10%",
            width: "400px",
            height: "400px",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(60px)",
          }}
        />

        {/* Logo/Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
              backgroundClip: "text",
              color: "transparent",
              display: "flex",
            }}
          >
            ⚡ CompStudy
          </div>
        </div>

        {/* Main Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            marginBottom: "24px",
            lineHeight: 1.2,
            maxWidth: "900px",
          }}
        >
          Free Online Study Room & Pomodoro Timer
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "32px",
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "800px",
            marginBottom: "48px",
          }}
        >
          Study Together Online • Live Study Rooms • Exam Preparation
        </div>

        {/* Features (instead of fake stats) */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{ 
                fontSize: "32px", 
                fontWeight: "bold", 
                color: "#6366f1",
                marginBottom: "8px" 
              }}
            >
              ⏱️
            </div>
            <div style={{ fontSize: "18px", color: "#e4e4e7" }}>
              Pomodoro Study Timer
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{ 
                fontSize: "32px", 
                fontWeight: "bold", 
                color: "#6366f1",
                marginBottom: "8px"  
              }}
            >
              👥
            </div>
            <div style={{ fontSize: "18px", color: "#e4e4e7" }}>
              Live Study Rooms
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{ 
                fontSize: "32px", 
                fontWeight: "bold", 
                color: "#6366f1",
                marginBottom: "8px"  
              }}
            >
              🏆
            </div>
            <div style={{ fontSize: "18px", color: "#e4e4e7" }}>
              Leaderboards
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{ 
                fontSize: "40px", 
                fontWeight: "bold", 
                color: "#22c55e",
                marginBottom: "8px"  
              }}
            >
              FREE
            </div>
            <div style={{ fontSize: "18px", color: "#e4e4e7" }}>
              Forever
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "18px",
            color: "#71717a",
          }}
        >
          compstudy.tech • Free Study App for Online Learning
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
