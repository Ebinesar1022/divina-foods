import { Box } from "@mui/material";

/**
 * AmbientBackground — a fixed, pointer-events-none layer of soft blurred
 * "liquid glass" light blobs sitting behind all page content. Purely
 * decorative: it never carries data and must never sit above readable
 * content (z-index stays negative, and every blob is low-opacity).
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
      <Box
        sx={{
          position: "absolute",
          top: "-12%",
          left: "-8%",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "rgba(37,99,235,0.10)",
          filter: "blur(70px)",
          opacity: 0.5,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "4%",
          right: "-10%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "rgba(14,165,233,0.08)",
          filter: "blur(70px)",
          opacity: 0.5,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-16%",
          left: "22%",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "rgba(16,185,129,0.07)",
          filter: "blur(80px)",
          opacity: 0.4,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "8%",
          right: "12%",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "rgba(99,102,241,0.05)",
          filter: "blur(70px)",
          opacity: 0.4,
        }}
      />
    </Box>
  );
}
