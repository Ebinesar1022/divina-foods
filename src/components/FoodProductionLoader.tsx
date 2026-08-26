import { Box, Typography, keyframes } from "@mui/material";

// Keyframe animations for food production dynamics
const steamFloat1 = keyframes`
  0% { transform: translateY(0) scaleX(1) scaleY(1); opacity: 0; }
  30% { opacity: 0.75; }
  100% { transform: translateY(-36px) scaleX(1.4) scaleY(1.2); opacity: 0; }
`;

const steamFloat2 = keyframes`
  0% { transform: translateY(0) scaleX(1); opacity: 0; }
  40% { opacity: 0.85; }
  100% { transform: translateY(-42px) scaleX(1.6) translateX(8px); opacity: 0; }
`;

const steamFloat3 = keyframes`
  0% { transform: translateY(0) scaleX(1); opacity: 0; }
  35% { opacity: 0.7; }
  100% { transform: translateY(-38px) scaleX(1.3) translateX(-6px); opacity: 0; }
`;

const potSimmer = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-1.5px) rotate(-0.8deg); }
  75% { transform: translateY(1.5px) rotate(0.8deg); }
`;

const bubblePop = keyframes`
  0% { transform: translateY(6px) scale(0.3); opacity: 0; }
  50% { opacity: 0.9; }
  100% { transform: translateY(-14px) scale(1.1); opacity: 0; }
`;

const gearSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const shimmerBar = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const ingredientFloat = keyframes`
  0% { transform: translateY(-16px) rotate(0deg) scale(0.7); opacity: 0; }
  30% { opacity: 1; transform: translateY(-4px) rotate(45deg) scale(1); }
  80% { opacity: 0.9; transform: translateY(12px) rotate(90deg) scale(0.8); }
  100% { transform: translateY(22px) rotate(120deg) scale(0.4); opacity: 0; }
`;

const pulseGlow = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.15); opacity: 0.85; }
`;

interface FoodProductionLoaderProps {
  text?: string;
  subtext?: string;
  size?: "small" | "medium" | "large";
}

export default function FoodProductionLoader({
  text = "Processing Production Data…",
  subtext = "Checking inventory stocks & exploding recipe BOMs",
  size = "medium",
}: FoodProductionLoaderProps) {
  const scale = size === "small" ? 0.75 : size === "large" ? 1.2 : 1;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: size === "small" ? 2 : size === "large" ? 8 : 5,
        px: 2,
        userSelect: "none",
      }}
    >
      {/* Visual Animation Container */}
      <Box
        sx={{
          position: "relative",
          width: 140 * scale,
          height: 120 * scale,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2.5,
        }}
      >
        {/* Ambient Radial Glow */}
        <Box
          sx={{
            position: "absolute",
            width: 130 * scale,
            height: 130 * scale,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(14,165,233,0.12) 40%, transparent 70%)",
            animation: `${pulseGlow} 3s ease-in-out infinite`,
            zIndex: 0,
          }}
        />

        {/* Industrial / Automation Gear in background */}
        <Box
          sx={{
            position: "absolute",
            top: 6 * scale,
            right: 8 * scale,
            zIndex: 1,
            opacity: 0.4,
            animation: `${gearSpin} 12s linear infinite`,
            transformOrigin: "center",
          }}
        >
          <svg width={36 * scale} height={36 * scale} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 15a3 3 0 100-6 3 3 0 000 6z"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              stroke="#2563eb"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>

        {/* Small Automation Gear */}
        <Box
          sx={{
            position: "absolute",
            bottom: 12 * scale,
            left: 10 * scale,
            zIndex: 1,
            opacity: 0.3,
            animation: `${gearSpin} 8s linear infinite reverse`,
            transformOrigin: "center",
          }}
        >
          <svg width={26 * scale} height={26 * scale} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 15a3 3 0 100-6 3 3 0 000 6z"
              stroke="#0ea5e9"
              strokeWidth="2"
            />
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              stroke="#0ea5e9"
              strokeWidth="2"
            />
          </svg>
        </Box>

        {/* Rising Steam Trails */}
        <Box
          sx={{
            position: "absolute",
            top: 8 * scale,
            left: "40%",
            width: 8 * scale,
            height: 22 * scale,
            borderRadius: "50%",
            background: "linear-gradient(to top, rgba(37,99,235,0.6), transparent)",
            animation: `${steamFloat1} 2s ease-out infinite`,
            zIndex: 2,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 4 * scale,
            left: "52%",
            width: 10 * scale,
            height: 26 * scale,
            borderRadius: "50%",
            background: "linear-gradient(to top, rgba(14,165,233,0.7), transparent)",
            animation: `${steamFloat2} 2.4s ease-out infinite 0.6s`,
            zIndex: 2,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 6 * scale,
            left: "64%",
            width: 8 * scale,
            height: 20 * scale,
            borderRadius: "50%",
            background: "linear-gradient(to top, rgba(16,185,129,0.6), transparent)",
            animation: `${steamFloat3} 2.1s ease-out infinite 1.2s`,
            zIndex: 2,
          }}
        />

        {/* Falling Ingredient Particles into Pot */}
        <Box
          sx={{
            position: "absolute",
            top: 20 * scale,
            left: "32%",
            width: 7 * scale,
            height: 7 * scale,
            borderRadius: "50%",
            bgcolor: "#F59E0B", // Gold / Spice / Grain
            boxShadow: "0 0 6px rgba(245,158,11,0.8)",
            animation: `${ingredientFloat} 2s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.2s`,
            zIndex: 4,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 16 * scale,
            left: "68%",
            width: 6 * scale,
            height: 6 * scale,
            borderRadius: "40%",
            bgcolor: "#10B981", // Fresh Herb / Green
            boxShadow: "0 0 6px rgba(16,185,129,0.8)",
            animation: `${ingredientFloat} 2.3s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.9s`,
            zIndex: 4,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 18 * scale,
            left: "50%",
            width: 6 * scale,
            height: 6 * scale,
            borderRadius: "50%",
            bgcolor: "#EF4444", // Tomato / Fresh Red
            boxShadow: "0 0 6px rgba(239,68,68,0.8)",
            animation: `${ingredientFloat} 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite 1.5s`,
            zIndex: 4,
          }}
        />

        {/* Main Cooking Pot / Production Vat */}
        <Box
          sx={{
            position: "relative",
            zIndex: 3,
            animation: `${potSimmer} 3s ease-in-out infinite`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt: 2 * scale,
          }}
        >
          {/* Pot SVG */}
          <svg
            width={86 * scale}
            height={68 * scale}
            viewBox="0 0 86 68"
            fill="none"
            style={{ filter: "drop-shadow(0 8px 16px rgba(30,58,138,0.22))" }}
          >
            <defs>
              <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#93c5fd" />
              </linearGradient>
            </defs>

            {/* Left Pot Handle */}
            <path
              d="M14 26 C6 26, 4 38, 14 42"
              stroke="#1e3a8a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Right Pot Handle */}
            <path
              d="M72 26 C80 26, 82 38, 72 42"
              stroke="#1e3a8a"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Main Pot Body */}
            <path
              d="M16 22 L20 54 C21 61, 65 61, 66 54 L70 22 Z"
              fill="url(#potGrad)"
            />

            {/* Simmering Liquid Surface */}
            <ellipse cx="43" cy="24" rx="24" ry="5.5" fill="url(#liquidGrad)" opacity="0.9" />

            {/* Glossy Pot Rim */}
            <ellipse
              cx="43"
              cy="22"
              rx="27"
              ry="4.5"
              fill="none"
              stroke="url(#rimGrad)"
              strokeWidth="2.5"
            />

            {/* Chef / Production Emblem on Pot */}
            <circle cx="43" cy="40" r="8" fill="#ffffff" opacity="0.25" />
            <path
              d="M40 38 L43 35 L46 38 M43 35 L43 45"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </svg>

          {/* Bubbles over the liquid */}
          <Box
            sx={{
              position: "absolute",
              top: 14 * scale,
              left: 32 * scale,
              width: 5 * scale,
              height: 5 * scale,
              borderRadius: "50%",
              bgcolor: "#fff",
              opacity: 0.8,
              animation: `${bubblePop} 1.6s ease-in infinite`,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: 12 * scale,
              left: 48 * scale,
              width: 6 * scale,
              height: 6 * scale,
              borderRadius: "50%",
              bgcolor: "#6ee7b7",
              opacity: 0.8,
              animation: `${bubblePop} 2s ease-in infinite 0.7s`,
            }}
          />
        </Box>
      </Box>

      {/* Primary Status Text */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: size === "small" ? 13 : size === "large" ? 17 : 15,
          color: "#0F172A",
          letterSpacing: "-0.01em",
          textAlign: "center",
          mb: 0.5,
        }}
      >
        {text}
      </Typography>

      {/* Subtext */}
      {subtext && (
        <Typography
          sx={{
            fontSize: size === "small" ? 11.5 : size === "large" ? 13.5 : 12.5,
            color: "#64748B",
            textAlign: "center",
            maxWidth: 380,
            lineHeight: 1.4,
            mb: 2,
          }}
        >
          {subtext}
        </Typography>
      )}

      {/* Shimmering Animated Food Production Line Progress Bar */}
      <Box
        sx={{
          width: 180 * scale,
          height: 5,
          borderRadius: "999px",
          bgcolor: "#E2E8F0",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #2563eb 0%, #38bdf8 30%, #10b981 60%, #2563eb 100%)",
            backgroundSize: "200% 100%",
            animation: `${shimmerBar} 2s linear infinite`,
          }}
        />
      </Box>
    </Box>
  );
}
