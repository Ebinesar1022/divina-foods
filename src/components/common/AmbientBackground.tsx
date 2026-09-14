import { Box } from "@mui/material";

/**
 * AmbientBackground — a fixed, pointer-events-none layer of soft blurred
 * "liquid glass" light orbs that float gently behind all page content. Purely
 * decorative: it never carries data and must never sit above readable
 * content (z-index stays negative, low-opacity, GPU-accelerated).
 */
export default function AmbientBackground() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Top-left Blue orb */}
      <Box
        sx={{
          position: "absolute",
          top: "-10%",
          left: "-6%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, rgba(37,99,235,0.02) 70%, transparent 100%)",
          filter: "blur(60px)",
          opacity: 0.7,
          animation: "floatSlow 18s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Top-right Cyan/Sky orb */}
      <Box
        sx={{
          position: "absolute",
          top: "6%",
          right: "-8%",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, rgba(14,165,233,0.02) 70%, transparent 100%)",
          filter: "blur(65px)",
          opacity: 0.65,
          animation: "floatDrift 22s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Bottom-left Emerald/Mint orb */}
      <Box
        sx={{
          position: "absolute",
          bottom: "-14%",
          left: "20%",
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.01) 70%, transparent 100%)",
          filter: "blur(75px)",
          opacity: 0.55,
          animation: "floatSlow 24s ease-in-out infinite reverse",
          willChange: "transform",
        }}
      />

      {/* Bottom-right Indigo/Purple orb */}
      <Box
        sx={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.01) 70%, transparent 100%)",
          filter: "blur(65px)",
          opacity: 0.5,
          animation: "pulseGlow 14s ease-in-out infinite",
          willChange: "transform",
        }}
      />
    </Box>
  );
}

