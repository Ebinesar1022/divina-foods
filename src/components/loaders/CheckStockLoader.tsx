import { useState, useEffect } from "react";
import { Box, Typography, keyframes } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const shimmerBar = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

// The three things MRP.CheckStock actually has to decide for every
// still-short raw material — stock arrived? a PO even raised yet? can the
// target finally be released? — narrated here instead of built as three
// separate scenes, so one loader covers all of it.
const statusSteps = [
  {
    title: "Scanning Main Warehouse Shelves",
    desc: "Comparing every shortfall raw material against current Available Stock...",
  },
  {
    title: "Checking Purchase Orders Raised",
    desc: "Looking for a Purchase Order already covering what's still needed...",
  },
  {
    title: "Confirming Shipments Received",
    desc: "Verifying whether raised Purchase Orders have actually been received...",
  },
  {
    title: "Recalculating Reserved Quantities",
    desc: "Reserving whatever now covers the shortfall against on-hand stock...",
  },
  {
    title: "Deciding Production Readiness",
    desc: "Releasing the Production Target only once nothing is left short...",
  },
];

export default function CheckStockLoader() {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % statusSteps.length);
    }, 3200);

    const elapsedTimer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stepTimer);
      clearInterval(elapsedTimer);
    };
  }, []);

  const activeStep = statusSteps[currentStep];

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 2.5, sm: 3.5 },
        px: { xs: 1.5, sm: 3 },
        bgcolor: "#F8FAFC",
        borderRadius: "20px",
        position: "relative",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Background Decorative Ambient Glows */}
      <Box
        sx={{
          position: "absolute",
          top: -50,
          left: -50,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -50,
          right: -50,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top Header Badge */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 1.5 },
          px: { xs: 1.5, sm: 2.25 },
          py: 0.75,
          borderRadius: "999px",
          bgcolor: "#FFFFFF",
          border: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
          mb: 1.5,
          maxWidth: "100%",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "#1E3A8A" }}>
          <Inventory2OutlinedIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: "#2563EB" }} />
          <Typography sx={{ fontSize: { xs: 11, sm: 12.5 }, fontWeight: 700, letterSpacing: "0.02em" }}>
            Main Warehouse
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: "#10B981",
            animation: `${pulseGlow} 2s ease-in-out infinite`,
          }}
        >
          <FactCheckOutlinedIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "#065F46" }}>
          <Typography sx={{ fontSize: { xs: 11, sm: 12.5 }, fontWeight: 700, letterSpacing: "0.02em" }}>
            Stock Ledger
          </Typography>
        </Box>
      </Box>

      {/* Main Animated Scene SVG Container */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 620,
          aspectRatio: "620 / 230",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(203,213,225,0.7)",
          boxShadow: "0 8px 24px rgba(15,23,42,0.07)",
          bgcolor: "#FFFFFF",
          position: "relative",
          mb: 2.5,
        }}
      >
        <svg
          viewBox="0 0 620 230"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient id="csSkyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            <linearGradient id="csRackSteel" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            <linearGradient id="csSafetyBeam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            <linearGradient id="csFlourSack" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>

            <linearGradient id="csFloorGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            <linearGradient id="csScanBeam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0" />
              <stop offset="50%" stopColor="#10B981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="csLedgerPanel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>

            <linearGradient id="csManVest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            <style>{`
              @keyframes csScanSweep {
                0%, 8% { transform: translateX(0px); }
                46%, 54% { transform: translateX(176px); }
                92%, 100% { transform: translateX(0px); }
              }
              @keyframes csBeamPulse {
                0%, 100% { opacity: 0.55; }
                50% { opacity: 1; }
              }
              @keyframes csBadgeCheck1 {
                0%, 18% { opacity: 0; transform: scale(0.5) translateY(6px); }
                26%, 86% { opacity: 1; transform: scale(1) translateY(0px); }
                96%, 100% { opacity: 0; transform: scale(0.8) translateY(-4px); }
              }
              @keyframes csBadgeWarn {
                0%, 44% { opacity: 0; transform: scale(0.5) translateY(6px); }
                52%, 86% { opacity: 1; transform: scale(1) translateY(0px); }
                96%, 100% { opacity: 0; transform: scale(0.8) translateY(-4px); }
              }
              @keyframes csBadgeCheck2 {
                0%, 62% { opacity: 0; transform: scale(0.5) translateY(6px); }
                70%, 86% { opacity: 1; transform: scale(1) translateY(0px); }
                96%, 100% { opacity: 0; transform: scale(0.8) translateY(-4px); }
              }
              @keyframes csLedgerRow1 {
                0%, 20% { opacity: 0.25; }
                26%, 100% { opacity: 1; }
              }
              @keyframes csLedgerRow2 {
                0%, 48% { opacity: 0.25; }
                54%, 100% { opacity: 1; }
              }
              @keyframes csLedgerRow3 {
                0%, 72% { opacity: 0.25; }
                78%, 100% { opacity: 1; }
              }
              @keyframes csClipboardBob {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-2.5px) rotate(-1.5deg); }
              }
              @keyframes csScannerBlink {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 1; }
              }
              @keyframes csPingRing {
                0% { r: 3; opacity: 0.9; }
                100% { r: 16; opacity: 0; }
              }
            `}</style>
          </defs>

          {/* Background Wall & Floor */}
          <rect x="0" y="0" width="620" height="175" fill="url(#csSkyGrad)" />
          <line x1="0" y1="175" x2="620" y2="175" stroke="#94A3B8" strokeWidth="2" />
          <rect x="0" y="175" width="620" height="55" fill="url(#csFloorGrad)" />

          {/* ══════════════ LEFT: WAREHOUSE RACK ══════════════ */}
          <g id="csRackZone">
            <rect x="12" y="12" width="150" height="22" rx="6" fill="#1E293B" opacity="0.9" />
            <text x="87" y="27" textAnchor="middle" fill="#6EE7B7" fontSize="10.5" fontWeight="700" letterSpacing="0.04em">
              📦 RAW MATERIAL RACK
            </text>

            {/* Industrial Storage Rack */}
            <rect x="24" y="48" width="6" height="120" fill="url(#csRackSteel)" />
            <rect x="286" y="48" width="6" height="120" fill="url(#csRackSteel)" />
            <rect x="20" y="94" width="272" height="7" rx="2" fill="url(#csSafetyBeam)" />
            <rect x="20" y="152" width="272" height="7" rx="2" fill="url(#csSafetyBeam)" />

            {/* Upper shelf: three generic tracked items — no product names,
                since whatever's actually short varies MRP to MRP. Each gets
                a small barcode mark instead, just to read as "a tracked
                SKU" rather than naming anything specific. */}
            <g transform="translate(40, 60)">
              {/* Crate */}
              <rect x="0" y="4" width="54" height="30" rx="3" fill="#B45309" stroke="#78350F" strokeWidth="1" />
              <line x1="0" y1="14" x2="54" y2="14" stroke="#78350F" strokeWidth="1" />
              <g transform="translate(17, 20)">
                <rect x="0" y="0" width="1.6" height="9" fill="#FEF3C7" />
                <rect x="3.2" y="0" width="3" height="9" fill="#FEF3C7" />
                <rect x="7.4" y="0" width="1.6" height="9" fill="#FEF3C7" />
                <rect x="10.2" y="0" width="2.2" height="9" fill="#FEF3C7" />
                <rect x="13.6" y="0" width="1.6" height="9" fill="#FEF3C7" />
                <rect x="16.4" y="0" width="3" height="9" fill="#FEF3C7" />
              </g>

              {/* Round container (cheese wheel / drum shape) */}
              <g transform="translate(86, 0)">
                <ellipse cx="18" cy="24" rx="20" ry="12" fill="#FDE047" stroke="#EAB308" strokeWidth="1.5" />
                <ellipse cx="18" cy="20" rx="20" ry="5" fill="#FEF08A" />
                <g transform="translate(9, 20)">
                  <rect x="0" y="0" width="1.4" height="8" fill="#78350F" />
                  <rect x="2.8" y="0" width="2.6" height="8" fill="#78350F" />
                  <rect x="6.6" y="0" width="1.4" height="8" fill="#78350F" />
                  <rect x="9" y="0" width="2" height="8" fill="#78350F" />
                  <rect x="12" y="0" width="1.4" height="8" fill="#78350F" />
                  <rect x="14.6" y="0" width="2.6" height="8" fill="#78350F" />
                  <rect x="18.6" y="0" width="1.4" height="8" fill="#78350F" />
                </g>
              </g>

              {/* Sack / crate */}
              <g transform="translate(174, 0)">
                <rect x="0" y="6" width="54" height="28" rx="3" fill="url(#csFlourSack)" stroke="#D97706" strokeWidth="1" />
                <g transform="translate(17, 16)">
                  <rect x="0" y="0" width="1.6" height="9" fill="#92400E" />
                  <rect x="3.2" y="0" width="3" height="9" fill="#92400E" />
                  <rect x="7.4" y="0" width="1.6" height="9" fill="#92400E" />
                  <rect x="10.2" y="0" width="2.2" height="9" fill="#92400E" />
                  <rect x="13.6" y="0" width="1.6" height="9" fill="#92400E" />
                  <rect x="16.4" y="0" width="3" height="9" fill="#92400E" />
                </g>
              </g>
            </g>

            {/* Status badges above each item, cued to the scanner's sweep.
                NOTE: an SVG element's `transform` attribute is fully
                replaced (not composed) by a CSS `transform` animation on
                that same element — so the positioning offset has to live
                on an outer static <g>, with the animated scale/translate
                kept on an inner <g> of its own. */}
            <g transform="translate(67, 46)">
              <g style={{ animation: "csBadgeCheck1 6.2s ease-in-out infinite" }}>
                <rect x="-15" y="-13" width="30" height="16" rx="8" fill="#10B981" />
                <text x="0" y="-1.5" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">
                  ✓
                </text>
              </g>
            </g>
            <g transform="translate(167, 42)">
              <g style={{ animation: "csBadgeWarn 6.2s ease-in-out infinite" }}>
                <rect x="-18" y="-13" width="36" height="16" rx="8" fill="#D97706" />
                <text x="0" y="-1.5" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800">
                  SHORT
                </text>
              </g>
            </g>
            <g transform="translate(267, 46)">
              <g style={{ animation: "csBadgeCheck2 6.2s ease-in-out infinite" }}>
                <rect x="-15" y="-13" width="30" height="16" rx="8" fill="#10B981" />
                <text x="0" y="-1.5" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">
                  ✓
                </text>
              </g>
            </g>

            {/* Bottom pallet */}
            <rect x="30" y="160" width="252" height="9" fill="#92400E" />
            <rect x="40" y="163" width="14" height="6" fill="#1E293B" />
            <rect x="148" y="163" width="14" height="6" fill="#1E293B" />
            <rect x="256" y="163" width="14" height="6" fill="#1E293B" />

            {/* Horizontal scanner beam sweeping across the rack */}
            <g style={{ animation: "csScanSweep 6.2s cubic-bezier(0.45,0.05,0.55,0.95) infinite" }}>
              <rect x="54" y="38" width="3" height="132" fill="#6EE7B7" opacity="0.9" />
              <rect
                x="50"
                y="38"
                width="11"
                height="132"
                fill="url(#csScanBeam)"
                style={{ animation: "csBeamPulse 1s ease-in-out infinite" }}
              />
            </g>
          </g>

          {/* ══════════════ WORKER WITH SCANNER ══════════════ */}
          {/* Static position on an outer <g>; the idle-bob CSS animation
              lives on an inner <g> of its own — see the note on the status
              badges above for why this has to be split in two. */}
          <g transform="translate(316, 96)">
            {/* Legs — attached flush under the torso, no separate transform */}
            <rect x="4" y="50" width="9" height="28" rx="4" fill="#1E3A8A" />
            <path d="M 3 76 L 18 76 L 18 81 L 1 81 Z" fill="#78350F" />
            <rect x="19" y="50" width="9" height="28" rx="4" fill="#2563EB" />
            <path d="M 18 76 L 33 76 L 33 81 L 16 81 Z" fill="#78350F" />

            <g transform="translate(2, 16)">
              <g style={{ animation: "csClipboardBob 1.8s ease-in-out infinite" }}>
                {/* Torso + hi-vis vest */}
                <rect x="0" y="4" width="22" height="34" rx="6" fill="#0F766E" />
                <rect x="0" y="6" width="22" height="28" rx="5" fill="url(#csManVest)" />
                <rect x="0" y="15" width="22" height="3" fill="#ECFDF5" />
                <rect x="0" y="26" width="22" height="3" fill="#ECFDF5" />

                {/* Arm holding scanner out toward the rack */}
                <path d="M 2 14 Q -8 18 -16 16" stroke="#0F766E" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                <g transform="translate(-26, 11)">
                  <rect x="0" y="0" width="13" height="8" rx="2" fill="#1E293B" />
                  <rect x="-3" y="6" width="6" height="8" rx="2" fill="#334155" />
                  <circle cx="13" cy="4" r="2.2" fill="#34D399" style={{ animation: "csScannerBlink 0.9s ease-in-out infinite" }} />
                </g>

                {/* Head */}
                <circle cx="11" cy="-5" r="9" fill="#FBCFE8" />
                <circle cx="14" cy="-6" r="1.2" fill="#0F172A" />
                <path d="M 11 -2 Q 13 0 15 -2" stroke="#0F172A" strokeWidth="0.8" fill="none" />
                <path d="M 2 -8 Q 11 -17 20 -8 Z" fill="#0F766E" />
                <path d="M 15 -8 L 24 -6 L 18 -3 Z" fill="#0F172A" />
              </g>
            </g>

            {/* Scan ping ring pulsing from the scanner */}
            <circle cx="-11" cy="31" r="3" fill="none" stroke="#34D399" strokeWidth="1.6" style={{ animation: "csPingRing 1.6s ease-out infinite" }} />
          </g>

          {/* ══════════════ RIGHT: STOCK LEDGER PANEL ══════════════ */}
          <g id="csLedgerZone">
            <rect x="398" y="12" width="110" height="22" rx="6" fill="#1E293B" opacity="0.9" />
            <text x="453" y="27" textAnchor="middle" fill="#93C5FD" fontSize="10.5" fontWeight="700" letterSpacing="0.04em">
              📋 STOCK LEDGER
            </text>

            <rect x="392" y="44" width="200" height="124" rx="10" fill="url(#csLedgerPanel)" stroke="#CBD5E1" strokeWidth="1.5" />
            <rect x="392" y="44" width="200" height="22" rx="10" fill="#0F172A" />
            <text x="492" y="59" textAnchor="middle" fill="#E2E8F0" fontSize="9" fontWeight="700" letterSpacing="0.03em">
              ACTIVE MRP · STOCK CHECK
            </text>

            {/* Ledger rows lighting up in sequence */}
            <g transform="translate(406, 80)" style={{ animation: "csLedgerRow1 6.2s ease-in-out infinite" }}>
              <rect x="0" y="0" width="16" height="16" rx="4" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.3" />
              <text x="8" y="12" textAnchor="middle" fill="#047857" fontSize="10" fontWeight="800">✓</text>
              <text x="24" y="11.5" fill="#334155" fontSize="9.5" fontWeight="600">Main Warehouse Stock</text>
            </g>
            <g transform="translate(406, 112)" style={{ animation: "csLedgerRow2 6.2s ease-in-out infinite" }}>
              <rect x="0" y="0" width="16" height="16" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.3" />
              <text x="8" y="12" textAnchor="middle" fill="#B45309" fontSize="9" fontWeight="800">!</text>
              <text x="24" y="11.5" fill="#334155" fontSize="9.5" fontWeight="600">Purchase Order Raised</text>
            </g>
            <g transform="translate(406, 144)" style={{ animation: "csLedgerRow3 6.2s ease-in-out infinite" }}>
              <rect x="0" y="0" width="16" height="16" rx="4" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.3" />
              <text x="8" y="12" textAnchor="middle" fill="#1D4ED8" fontSize="9" fontWeight="800">↻</text>
              <text x="24" y="11.5" fill="#334155" fontSize="9.5" fontWeight="600">Shipment Received?</text>
            </g>
          </g>
        </svg>
      </Box>

      {/* Progress & Current Phase Tracker */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 540,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: 14.5, sm: 16.5 },
            color: "#0F172A",
            letterSpacing: "-0.01em",
            mb: 0.5,
            transition: "all 0.3s ease",
          }}
        >
          {activeStep.title}
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: 12, sm: 13 },
            color: "#64748B",
            maxWidth: 480,
            lineHeight: 1.45,
            mb: 2,
            minHeight: { xs: 36, sm: 28 },
          }}
        >
          {activeStep.desc}
        </Typography>

        <Box
          sx={{
            width: "100%",
            height: 7,
            borderRadius: "999px",
            bgcolor: "#E2E8F0",
            overflow: "hidden",
            position: "relative",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, #10B981 0%, #34D399 25%, #F59E0B 50%, #2563EB 75%, #10B981 100%)",
              backgroundSize: "200% 100%",
              animation: `${shimmerBar} 2.4s linear infinite`,
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            px: 1,
            color: "#64748B",
            fontSize: 12,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 15, color: "#10B981" }} />
            <Typography sx={{ fontSize: { xs: 11, sm: 12 }, fontWeight: 600, color: "#475569" }}>
              Verifying stock coverage
            </Typography>
          </Box>

          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.25,
              borderRadius: "999px",
              bgcolor: "#ECFDF5",
              border: "1px solid #D1FAE5",
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#059669",
                animation: `${pulseGlow} 1.5s infinite`,
              }}
            />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#047857" }}>
              Active • {elapsed}s
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
