import { Box, Typography, keyframes } from "@mui/material";

// Keyframe animations for gourmet pizza production dynamics
const pizzaHoverAndSpin = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(180deg); }
  100% { transform: translateY(0px) rotate(360deg); }
`;

const steamFloat1 = keyframes`
  0% { transform: translateY(0) scaleX(1); opacity: 0; }
  30% { opacity: 0.8; }
  100% { transform: translateY(-38px) scaleX(1.4) translateX(6px); opacity: 0; }
`;

const steamFloat2 = keyframes`
  0% { transform: translateY(0) scaleX(1); opacity: 0; }
  40% { opacity: 0.85; }
  100% { transform: translateY(-44px) scaleX(1.6) translateX(-8px); opacity: 0; }
`;

const steamFloat3 = keyframes`
  0% { transform: translateY(0) scaleX(1); opacity: 0; }
  35% { opacity: 0.75; }
  100% { transform: translateY(-40px) scaleX(1.3) translateX(10px); opacity: 0; }
`;

const toppingRain1 = keyframes`
  0% { transform: translateY(-24px) rotate(0deg) scale(0.6); opacity: 0; }
  30% { opacity: 1; transform: translateY(-6px) rotate(45deg) scale(1); }
  75% { opacity: 0.95; transform: translateY(14px) rotate(90deg) scale(0.9); }
  100% { transform: translateY(28px) rotate(135deg) scale(0.4); opacity: 0; }
`;

const toppingRain2 = keyframes`
  0% { transform: translateY(-26px) rotate(0deg) scale(0.5); opacity: 0; }
  35% { opacity: 1; transform: translateY(-4px) rotate(-60deg) scale(1); }
  80% { opacity: 0.9; transform: translateY(16px) rotate(-120deg) scale(0.85); }
  100% { transform: translateY(30px) rotate(-180deg) scale(0.3); opacity: 0; }
`;

const toppingRain3 = keyframes`
  0% { transform: translateY(-22px) rotate(0deg) scale(0.7); opacity: 0; }
  25% { opacity: 1; transform: translateY(-2px) rotate(30deg) scale(1); }
  70% { opacity: 0.9; transform: translateY(18px) rotate(75deg) scale(0.8); }
  100% { transform: translateY(32px) rotate(110deg) scale(0.3); opacity: 0; }
`;

const ovenGlowPulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.18); opacity: 0.95; }
`;

const sparkleTwinkle = keyframes`
  0%, 100% { transform: scale(0.4) rotate(0deg); opacity: 0.2; }
  50% { transform: scale(1.15) rotate(180deg); opacity: 1; }
`;

const shimmerBar = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

interface FoodProductionLoaderProps {
  text?: string;
  subtext?: string;
  size?: "small" | "medium" | "large";
}

export default function FoodProductionLoader({
  text = "Baking Production Batch…",
  subtext = "Formulating recipes, exploding BOMs & allocating warehouse stock",
  size = "medium",
}: FoodProductionLoaderProps) {
  const scale = size === "small" ? 0.78 : size === "large" ? 1.25 : 1;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: size === "small" ? 2 : size === "large" ? 7 : 4.5,
        px: 2,
        userSelect: "none",
      }}
    >
      {/* Visual Animation Stage Container */}
      <Box
        sx={{
          position: "relative",
          width: 150 * scale,
          height: 130 * scale,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2.5,
        }}
      >
        {/* Warm Wood-Fired Stone Oven Ambient Glow */}
        <Box
          sx={{
            position: "absolute",
            width: 140 * scale,
            height: 140 * scale,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(245,158,11,0.28) 0%, rgba(239,68,68,0.16) 45%, rgba(37,99,235,0.06) 70%, transparent 80%)",
            animation: `${ovenGlowPulse} 3.2s ease-in-out infinite`,
            zIndex: 0,
          }}
        />

        {/* Floating Oven Baking Sparkles */}
        <Box
          sx={{
            position: "absolute",
            top: 14 * scale,
            right: 18 * scale,
            width: 8 * scale,
            height: 8 * scale,
            color: "#F59E0B",
            animation: `${sparkleTwinkle} 2.2s ease-in-out infinite`,
            zIndex: 1,
          }}
        >
          ✦
        </Box>
        <Box
          sx={{
            position: "absolute",
            bottom: 20 * scale,
            left: 14 * scale,
            width: 6 * scale,
            height: 6 * scale,
            color: "#EF4444",
            animation: `${sparkleTwinkle} 2.6s ease-in-out infinite 0.8s`,
            zIndex: 1,
          }}
        >
          ✦
        </Box>

        {/* Rising Hot Oven Steam Trails */}
        <Box
          sx={{
            position: "absolute",
            top: 2 * scale,
            left: "38%",
            width: 9 * scale,
            height: 24 * scale,
            borderRadius: "50%",
            background: "linear-gradient(to top, rgba(245,158,11,0.6), rgba(255,255,255,0.8), transparent)",
            animation: `${steamFloat1} 2.2s ease-out infinite`,
            zIndex: 4,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: -2 * scale,
            left: "52%",
            width: 11 * scale,
            height: 28 * scale,
            borderRadius: "50%",
            background: "linear-gradient(to top, rgba(239,68,68,0.5), rgba(255,255,255,0.85), transparent)",
            animation: `${steamFloat2} 2.6s ease-out infinite 0.7s`,
            zIndex: 4,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 4 * scale,
            left: "64%",
            width: 8 * scale,
            height: 22 * scale,
            borderRadius: "50%",
            background: "linear-gradient(to top, rgba(16,185,129,0.5), rgba(255,255,255,0.75), transparent)",
            animation: `${steamFloat3} 2.4s ease-out infinite 1.3s`,
            zIndex: 4,
          }}
        />

        {/* Cascading Fresh Ingredients onto Pizza */}
        {/* 1. Fresh Basil Leaf */}
        <Box
          sx={{
            position: "absolute",
            top: 10 * scale,
            left: "30%",
            width: 12 * scale,
            height: 7 * scale,
            borderRadius: "80% 0 80% 0",
            bgcolor: "#10B981",
            boxShadow: "0 0 6px rgba(16,185,129,0.7)",
            animation: `${toppingRain1} 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
            zIndex: 5,
          }}
        />
        {/* 2. Sliced Pepperoni disc */}
        <Box
          sx={{
            position: "absolute",
            top: 8 * scale,
            left: "66%",
            width: 10 * scale,
            height: 10 * scale,
            borderRadius: "50%",
            bgcolor: "#DC2626",
            border: "1.5px solid #991B1B",
            boxShadow: "0 0 6px rgba(220,38,38,0.7)",
            animation: `${toppingRain2} 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.8s`,
            zIndex: 5,
          }}
        />
        {/* 3. Golden Melted Cheese / Olive topping */}
        <Box
          sx={{
            position: "absolute",
            top: 12 * scale,
            left: "50%",
            width: 8 * scale,
            height: 8 * scale,
            borderRadius: "50%",
            bgcolor: "#1E293B",
            border: "2px solid #F59E0B",
            animation: `${toppingRain3} 2.7s cubic-bezier(0.4, 0, 0.2, 1) infinite 1.5s`,
            zIndex: 5,
          }}
        />

        {/* Main Animated Pizza Pie with Wooden Peel Shadow */}
        <Box
          sx={{
            position: "relative",
            zIndex: 3,
            animation: `${pizzaHoverAndSpin} 14s linear infinite`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: "drop-shadow(0 10px 20px rgba(180, 83, 9, 0.28))",
          }}
        >
          {/* Detailed SVG Pizza */}
          <svg
            width={100 * scale}
            height={100 * scale}
            viewBox="0 0 120 120"
            fill="none"
          >
            <defs>
              {/* Crispy Golden Pizza Crust Gradient */}
              <radialGradient id="crustGrad" cx="50%" cy="50%" r="50%">
                <stop offset="70%" stopColor="#D97706" />
                <stop offset="88%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#78350F" />
              </radialGradient>

              {/* Rich Tomato Sauce Base */}
              <radialGradient id="sauceGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="85%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#B91C1C" />
              </radialGradient>

              {/* Bubbling Melted Mozzarella Cheese */}
              <radialGradient id="cheeseGrad" cx="45%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="60%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#F59E0B" />
              </radialGradient>

              {/* Pepperoni Slices Gradient */}
              <radialGradient id="pepGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="70%" stopColor="#B91C1C" />
                <stop offset="100%" stopColor="#7F1D1D" />
              </radialGradient>

              {/* Basil Green Gradient */}
              <linearGradient id="basilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              {/* Mushroom Gradient */}
              <linearGradient id="mushGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F4F4F5" />
                <stop offset="100%" stopColor="#A1A1AA" />
              </linearGradient>
            </defs>

            {/* Base Crust (Outer Rim) */}
            <circle cx="60" cy="60" r="56" fill="url(#crustGrad)" />
            <circle cx="60" cy="60" r="54" stroke="#FDE68A" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />

            {/* Rich Tomato Sauce Bed */}
            <circle cx="60" cy="60" r="48" fill="url(#sauceGrad)" />

            {/* Melted Mozzarella Layer */}
            <circle cx="60" cy="60" r="45" fill="url(#cheeseGrad)" />

            {/* Cheese bubbling spots */}
            <circle cx="50" cy="40" r="14" fill="#FEF9C3" opacity="0.75" />
            <circle cx="72" cy="55" r="12" fill="#FEF9C3" opacity="0.65" />
            <circle cx="48" cy="74" r="13" fill="#FEF9C3" opacity="0.7" />

            {/* Pepperoni Slices */}
            {/* Top Right */}
            <circle cx="75" cy="40" r="8" fill="url(#pepGrad)" stroke="#7F1D1D" strokeWidth="1" />
            <circle cx="73" cy="38" r="1.5" fill="#F87171" opacity="0.7" />
            <circle cx="77" cy="42" r="1.2" fill="#F87171" opacity="0.7" />

            {/* Bottom Right */}
            <circle cx="78" cy="75" r="8" fill="url(#pepGrad)" stroke="#7F1D1D" strokeWidth="1" />
            <circle cx="76" cy="73" r="1.5" fill="#F87171" opacity="0.7" />

            {/* Bottom Center */}
            <circle cx="52" cy="85" r="7.5" fill="url(#pepGrad)" stroke="#7F1D1D" strokeWidth="1" />

            {/* Left */}
            <circle cx="35" cy="60" r="8" fill="url(#pepGrad)" stroke="#7F1D1D" strokeWidth="1" />
            <circle cx="33" cy="58" r="1.5" fill="#F87171" opacity="0.7" />

            {/* Top Center-Left */}
            <circle cx="42" cy="38" r="7.5" fill="url(#pepGrad)" stroke="#7F1D1D" strokeWidth="1" />

            {/* Fresh Green Basil Leaves */}
            <path
              d="M60 32 C65 26, 74 30, 68 37 C63 36, 61 34, 60 32 Z"
              fill="url(#basilGrad)"
              stroke="#047857"
              strokeWidth="0.75"
            />
            <path
              d="M40 70 C34 66, 36 57, 43 61 C43 66, 42 68, 40 70 Z"
              fill="url(#basilGrad)"
              stroke="#047857"
              strokeWidth="0.75"
            />
            <path
              d="M68 62 C74 58, 80 64, 76 70 C70 69, 69 65, 68 62 Z"
              fill="url(#basilGrad)"
              stroke="#047857"
              strokeWidth="0.75"
            />
            <path
              d="M56 50 C52 44, 60 40, 64 46 C60 48, 58 49, 56 50 Z"
              fill="url(#basilGrad)"
              stroke="#047857"
              strokeWidth="0.75"
            />

            {/* Sliced Black Olives */}
            <circle cx="62" cy="78" r="4" fill="#0F172A" />
            <circle cx="62" cy="78" r="2" fill="#FDE047" />

            <circle cx="85" cy="56" r="3.5" fill="#0F172A" />
            <circle cx="85" cy="56" r="1.8" fill="#FDE047" />

            <circle cx="34" cy="46" r="3.5" fill="#0F172A" />
            <circle cx="34" cy="46" r="1.8" fill="#FDE047" />

            {/* Sliced Mushrooms */}
            <path
              d="M50 56 C50 52, 57 52, 57 56 L55 60 L52 60 Z"
              fill="url(#mushGrad)"
              stroke="#71717A"
              strokeWidth="0.6"
            />

            {/* 6 Pizza Slice Cut Lines (Subtle artisan cut scoring) */}
            <line x1="60" y1="12" x2="60" y2="108" stroke="#78350F" strokeWidth="1.2" opacity="0.45" strokeDasharray="3 2" />
            <line x1="18" y1="36" x2="102" y2="84" stroke="#78350F" strokeWidth="1.2" opacity="0.45" strokeDasharray="3 2" />
            <line x1="18" y1="84" x2="102" y2="36" stroke="#78350F" strokeWidth="1.2" opacity="0.45" strokeDasharray="3 2" />

            {/* Center Cheese Melt Ring */}
            <circle cx="60" cy="60" r="5" fill="#FEF08A" opacity="0.8" />
          </svg>
        </Box>
      </Box>

      {/* Primary Status Text */}
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: size === "small" ? 13.5 : size === "large" ? 17.5 : 15.5,
          color: "#0F172A",
          letterSpacing: "-0.02em",
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
            maxWidth: 400,
            lineHeight: 1.45,
            mb: 2,
          }}
        >
          {subtext}
        </Typography>
      )}

      {/* Gourmet Food Production Shimmer Progress Indicator */}
      <Box
        sx={{
          width: 190 * scale,
          height: 6,
          borderRadius: "999px",
          bgcolor: "#E2E8F0",
          overflow: "hidden",
          position: "relative",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: "999px",
            background:
              "linear-gradient(90deg, #DC2626 0%, #F59E0B 25%, #10B981 50%, #2563EB 75%, #DC2626 100%)",
            backgroundSize: "200% 100%",
            animation: `${shimmerBar} 2.2s linear infinite`,
          }}
        />
      </Box>
    </Box>
  );
}

