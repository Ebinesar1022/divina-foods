import { useState, useEffect } from "react";
import { Box, Typography, keyframes } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const shimmerBar = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const statusSteps = [
  {
    title: "Checking Warehouse Stock & Available Lots",
    desc: "Scanning finished goods formulas & calculating needed raw material batch allocations...",
  },
  {
    title: "Picking Flour, San Marzano Tomatoes & Mozzarella",
    desc: "Locating high-grade ingredients from warehouse storage racks...",
  },
  {
    title: "Transporting Raw Materials to Kitchen Prep",
    desc: "Dispatching allocated inventory to the central kitchen prep line...",
  },
  {
    title: "Locking Inventory & Synchronizing with Zoho",
    desc: "Writing lot allocations and generating MRP records in Zoho Creator...",
  },
  {
    title: "Finalizing Material Requirement Plan",
    desc: "Validating stock sufficiency and setting production readiness status...",
  },
];

export default function MrpCreationLoader() {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % statusSteps.length);
    }, 3600);

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
          background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
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
          background: "radial-gradient(circle, rgba(245,158,11,0.14) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top Header Badge & Transfer Indicator */}
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
            Warehouse Depot
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: "#F59E0B",
            animation: `${pulseGlow} 2s ease-in-out infinite`,
          }}
        >
          <ArrowForwardIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "#B45309" }}>
          <RestaurantIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: "#EA580C" }} />
          <Typography sx={{ fontSize: { xs: 11, sm: 12.5 }, fontWeight: 700, letterSpacing: "0.02em" }}>
            Kitchen Prep Line
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
            {/* Linear & Radial Gradients for Scenes */}
            <linearGradient id="mrpSkyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            <linearGradient id="rackSteel" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            <linearGradient id="safetyBeam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            <linearGradient id="brickOven" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B91C1C" />
              <stop offset="50%" stopColor="#991B1B" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </linearGradient>

            <radialGradient id="ovenFireGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
              <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#DC2626" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#991B1B" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="flourSack" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>

            <linearGradient id="trolleySteel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>

            <linearGradient id="manVest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF7A00" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>

            <linearGradient id="floorGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            <style>{`
              @keyframes walkCycle {
                0% { transform: translateX(0px); }
                10% { transform: translateX(0px); }
                55% { transform: translateX(290px); }
                78% { transform: translateX(290px); }
                92% { transform: translateX(0px); opacity: 0.15; }
                95% { transform: translateX(0px); opacity: 1; }
                100% { transform: translateX(0px); }
              }

              @keyframes legSwing1 {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(24deg); }
                75% { transform: rotate(-24deg); }
              }

              @keyframes legSwing2 {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-24deg); }
                75% { transform: rotate(24deg); }
              }

              @keyframes wheelSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }

              @keyframes cartBob {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-3px); }
              }

              @keyframes fireFlicker {
                0%, 100% { transform: scale(1); opacity: 0.85; }
                50% { transform: scale(1.15) translateY(-2px); opacity: 1; }
              }

              @keyframes steamRise {
                0% { transform: translateY(0) scaleX(0.8); opacity: 0; }
                30% { opacity: 0.8; }
                100% { transform: translateY(-26px) scaleX(1.4); opacity: 0; }
              }

              @keyframes chevronFlow {
                0% { stroke-dashoffset: 24; }
                100% { stroke-dashoffset: 0; }
              }

              @keyframes allocatedPop {
                0%, 55% { opacity: 0; transform: scale(0.6) translateY(6px); }
                65% { opacity: 1; transform: scale(1.12) translateY(-6px); }
                76% { opacity: 1; transform: scale(1) translateY(-4px); }
                88%, 100% { opacity: 0; transform: scale(0.9) translateY(-10px); }
              }
            `}</style>
          </defs>

          {/* Background Wall & Floor */}
          <rect x="0" y="0" width="620" height="175" fill="url(#mrpSkyGrad)" />
          {/* Wall divide line */}
          <line x1="0" y1="175" x2="620" y2="175" stroke="#94A3B8" strokeWidth="2" />
          {/* Factory / Kitchen Epoxy Floor */}
          <rect x="0" y="175" width="620" height="55" fill="url(#floorGrad)" />

          {/* Floor Guide Path with Moving Chevrons */}
          <rect x="140" y="194" width="340" height="14" rx="7" fill="#E2E8F0" />
          <line
            x1="150"
            y1="201"
            x2="470"
            y2="201"
            stroke="#2563EB"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            strokeLinecap="round"
            style={{ animation: "chevronFlow 1.2s linear infinite" }}
          />

          {/* ══════════════ LEFT: WAREHOUSE ZONE ══════════════ */}
          <g id="warehouseZone">
            {/* Zone Tag */}
            <rect x="12" y="12" width="126" height="22" rx="6" fill="#1E293B" opacity="0.9" />
            <text x="75" y="27" textAnchor="middle" fill="#93C5FD" fontSize="10.5" fontWeight="700" letterSpacing="0.04em">
              🏭 WAREHOUSE BAY
            </text>

            {/* Industrial Storage Rack */}
            {/* Left Upright */}
            <rect x="18" y="42" width="6" height="133" fill="url(#rackSteel)" />
            {/* Right Upright */}
            <rect x="116" y="42" width="6" height="133" fill="url(#rackSteel)" />
            {/* Cross braces */}
            <line x1="24" y1="48" x2="116" y2="92" stroke="#64748B" strokeWidth="2" />
            <line x1="116" y1="48" x2="24" y2="92" stroke="#64748B" strokeWidth="2" />
            <line x1="24" y1="96" x2="116" y2="140" stroke="#64748B" strokeWidth="2" />
            <line x1="116" y1="96" x2="24" y2="140" stroke="#64748B" strokeWidth="2" />

            {/* Upper Safety Shelf */}
            <rect x="14" y="88" width="112" height="7" rx="2" fill="url(#safetyBeam)" />
            {/* Upper Shelf Stock: Olive Oil cans & Parmesan cheese wheel */}
            <rect x="26" y="65" width="18" height="23" rx="2" fill="#EAB308" stroke="#CA8A04" strokeWidth="1" />
            <rect x="30" y="61" width="10" height="4" rx="1" fill="#CA8A04" />
            <text x="35" y="79" textAnchor="middle" fill="#78350F" fontSize="7" fontWeight="bold">OIL</text>

            <rect x="49" y="65" width="18" height="23" rx="2" fill="#EAB308" stroke="#CA8A04" strokeWidth="1" />
            <rect x="53" y="61" width="10" height="4" rx="1" fill="#CA8A04" />
            <text x="58" y="79" textAnchor="middle" fill="#78350F" fontSize="7" fontWeight="bold">OIL</text>

            {/* Cheese wheel */}
            <ellipse cx="94" cy="77" rx="14" ry="9" fill="#FDE047" stroke="#EAB308" strokeWidth="1.5" />
            <ellipse cx="94" cy="74" rx="14" ry="4" fill="#FEF08A" />

            {/* Lower Safety Shelf */}
            <rect x="14" y="136" width="112" height="7" rx="2" fill="url(#safetyBeam)" />
            {/* Lower Shelf Stock: Stacks of Flour Sacks */}
            <g transform="translate(24, 98)">
              {/* Sack 1 */}
              <rect x="0" y="16" width="38" height="22" rx="5" fill="url(#flourSack)" stroke="#D97706" strokeWidth="1" />
              <text x="19" y="30" textAnchor="middle" fill="#92400E" fontSize="8" fontWeight="800">00 FLOUR</text>
              {/* Sack 2 atop */}
              <rect x="4" y="0" width="34" height="18" rx="4" fill="url(#flourSack)" stroke="#D97706" strokeWidth="1" />
              <text x="21" y="12" textAnchor="middle" fill="#92400E" fontSize="7" fontWeight="700">DIVINA</text>
            </g>

            {/* Wooden Crate with San Marzano Tomatoes */}
            <g transform="translate(68, 107)">
              <rect x="0" y="12" width="42" height="17" rx="2" fill="#B45309" stroke="#78350F" strokeWidth="1" />
              <line x1="0" y1="20" x2="42" y2="20" stroke="#78350F" strokeWidth="1" />
              {/* Ripe Tomatoes spilling over */}
              <circle cx="8" cy="11" r="5.5" fill="#EF4444" stroke="#B91C1C" strokeWidth="0.8" />
              <circle cx="17" cy="9" r="6" fill="#DC2626" stroke="#991B1B" strokeWidth="0.8" />
              <circle cx="27" cy="10" r="5.5" fill="#EF4444" stroke="#B91C1C" strokeWidth="0.8" />
              <circle cx="35" cy="11" r="5" fill="#DC2626" stroke="#991B1B" strokeWidth="0.8" />
              {/* Tomato green calyx */}
              <circle cx="17" cy="6" r="1.5" fill="#15803D" />
              <circle cx="27" cy="7" r="1.5" fill="#15803D" />
            </g>

            {/* Bottom Pallet on floor */}
            <rect x="22" y="166" width="96" height="9" fill="#92400E" />
            <rect x="30" y="169" width="12" height="6" fill="#1E293B" />
            <rect x="64" y="169" width="12" height="6" fill="#1E293B" />
            <rect x="98" y="169" width="12" height="6" fill="#1E293B" />
          </g>

          {/* ══════════════ RIGHT: KITCHEN ZONE ══════════════ */}
          <g id="kitchenZone">
            {/* Zone Tag */}
            <rect x="478" y="12" width="130" height="22" rx="6" fill="#1E293B" opacity="0.9" />
            <text x="543" y="27" textAnchor="middle" fill="#FDBA74" fontSize="10.5" fontWeight="700" letterSpacing="0.04em">
              🍕 CENTRAL KITCHEN
            </text>

            {/* Artisan Brick Pizza Oven */}
            {/* Oven Outer Arch Body */}
            <path
              d="M 500 175 L 500 100 Q 555 52 610 100 L 610 175 Z"
              fill="url(#brickOven)"
              stroke="#7F1D1D"
              strokeWidth="2"
            />
            {/* Brick pattern details */}
            <line x1="504" y1="120" x2="606" y2="120" stroke="#7F1D1D" strokeWidth="1.5" opacity="0.6" />
            <line x1="504" y1="140" x2="606" y2="140" stroke="#7F1D1D" strokeWidth="1.5" opacity="0.6" />
            <line x1="504" y1="160" x2="606" y2="160" stroke="#7F1D1D" strokeWidth="1.5" opacity="0.6" />

            {/* Oven Hearth Opening */}
            <path
              d="M 522 175 L 522 130 Q 555 110 588 130 L 588 175 Z"
              fill="#1F2937"
            />

            {/* Warm Fire Coals Glowing inside Hearth */}
            <ellipse
              cx="555"
              cy="162"
              rx="24"
              ry="12"
              fill="url(#ovenFireGlow)"
              style={{ animation: "fireFlicker 1.8s ease-in-out infinite" }}
            />
            {/* Glowing embers */}
            <circle cx="546" cy="164" r="3" fill="#FEF08A" />
            <circle cx="564" cy="163" r="2.5" fill="#FEF08A" />

            {/* Chimney on top */}
            <rect x="546" y="38" width="18" height="28" fill="#7F1D1D" />
            <rect x="543" y="35" width="24" height="6" rx="1.5" fill="#991B1B" />

            {/* Rising Chimney Hot Steam */}
            <ellipse cx="555" cy="28" rx="6" ry="12" fill="#E2E8F0" opacity="0.6" style={{ animation: "steamRise 2.2s ease-out infinite" }} />
            <ellipse cx="558" cy="24" rx="4" ry="10" fill="#E2E8F0" opacity="0.5" style={{ animation: "steamRise 2.4s ease-out infinite 0.7s" }} />

            {/* Kitchen Prep Counter Table */}
            <rect x="424" y="132" width="76" height="43" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
            <rect x="420" y="128" width="84" height="6" rx="2" fill="#F8FAFC" stroke="#64748B" strokeWidth="1" />

            {/* Prep table legs */}
            <rect x="426" y="134" width="4" height="41" fill="#94A3B8" />
            <rect x="494" y="134" width="4" height="41" fill="#94A3B8" />

            {/* Raw material delivery bin on counter (waiting to receive flour/tomatoes) */}
            <rect x="432" y="112" width="40" height="16" rx="3" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.2" />
            <text x="452" y="123" textAnchor="middle" fill="#B45309" fontSize="7" fontWeight="bold">PREP BIN</text>

            {/* Stainless steel bowl */}
            <ellipse cx="484" cy="124" rx="10" ry="5" fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
            <ellipse cx="484" cy="122" rx="9" ry="2.5" fill="#94A3B8" />

            {/* "+ Allocated!" Pop-up Achievement Burst */}
            <g style={{ animation: "allocatedPop 6s ease-in-out infinite" }}>
              <rect x="412" y="78" width="102" height="26" rx="8" fill="#15803D" />
              <text x="463" y="95" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">
                ✓ RAW STOCK IN!
              </text>
              <polygon points="463,104 457,98 469,98" fill="#15803D" />
            </g>
          </g>

          {/* ══════════════ MOVING HERO: WAREHOUSEMAN + TROLLEY ══════════════ */}
          <g style={{ animation: "walkCycle 6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite" }}>
            <g transform="translate(130, 105)">
              {/* Hand Truck / Trolley Assembly */}
              <g style={{ animation: "cartBob 0.6s ease-in-out infinite" }}>
                {/* Trolley Frame */}
                <line x1="28" y1="20" x2="68" y2="76" stroke="url(#trolleySteel)" strokeWidth="4.5" strokeLinecap="round" />
                {/* Handle grip */}
                <line x1="22" y1="14" x2="30" y2="22" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
                {/* Base plate */}
                <line x1="68" y1="76" x2="98" y2="76" stroke="#991B1B" strokeWidth="4" strokeLinecap="round" />
                <line x1="68" y1="76" x2="96" y2="60" stroke="#DC2626" strokeWidth="2.5" />

                {/* Goods on Trolley: Flour Sack */}
                <g transform="translate(56, 44) rotate(-18)">
                  <rect x="0" y="0" width="32" height="20" rx="4" fill="url(#flourSack)" stroke="#D97706" strokeWidth="1" />
                  <text x="16" y="13" textAnchor="middle" fill="#92400E" fontSize="7" fontWeight="bold">00 FLOUR</text>
                </g>

                {/* Goods on Trolley: Tomato Crate stacked atop */}
                <g transform="translate(48, 22) rotate(-14)">
                  <rect x="0" y="0" width="28" height="15" rx="2" fill="#B45309" stroke="#78350F" strokeWidth="1" />
                  <circle cx="6" cy="1" r="4.5" fill="#EF4444" />
                  <circle cx="14" cy="0" r="5" fill="#DC2626" />
                  <circle cx="22" cy="1" r="4.5" fill="#EF4444" />
                  <circle cx="14" cy="-2" r="1.2" fill="#15803D" />
                </g>

                {/* Trolley Wheel with Hub */}
                <g transform="translate(68, 76)">
                  <circle cx="0" cy="0" r="12" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
                  <circle cx="0" cy="0" r="6" fill="#94A3B8" />
                  <circle cx="0" cy="0" r="2.5" fill="#0F172A" />
                  {/* Rotating Wheel Spokes */}
                  <g style={{ animation: "wheelSpin 0.7s linear infinite", transformOrigin: "0px 0px" }}>
                    <line x1="0" y1="-10" x2="0" y2="10" stroke="#CBD5E1" strokeWidth="1.5" />
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#CBD5E1" strokeWidth="1.5" />
                  </g>
                </g>
              </g>

              {/* Warehouseman Worker */}
              {/* Back Leg */}
              <g transform="translate(10, 52)" style={{ animation: "legSwing1 0.6s ease-in-out infinite", transformOrigin: "4px 0px" }}>
                <rect x="0" y="0" width="8" height="26" rx="4" fill="#1E3A8A" />
                {/* Work Boot */}
                <path d="M 0 24 L 14 24 L 14 29 L -2 29 Z" fill="#78350F" />
              </g>

              {/* Front Leg */}
              <g transform="translate(18, 52)" style={{ animation: "legSwing2 0.6s ease-in-out infinite", transformOrigin: "4px 0px" }}>
                <rect x="0" y="0" width="8" height="26" rx="4" fill="#2563EB" />
                {/* Work Boot */}
                <path d="M 0 24 L 14 24 L 14 29 L -2 29 Z" fill="#78350F" />
              </g>

              {/* Torso & High-Vis Vest */}
              <g transform="translate(6, 18)" style={{ animation: "cartBob 0.6s ease-in-out infinite" }}>
                {/* Blue inner shirt */}
                <rect x="0" y="4" width="18" height="32" rx="5" fill="#1E40AF" />
                {/* Safety Vest (Hi-Vis Orange) */}
                <rect x="0" y="6" width="18" height="26" rx="4" fill="url(#manVest)" />
                {/* Silver reflective stripes */}
                <rect x="0" y="14" width="18" height="3" fill="#E2E8F0" />
                <rect x="0" y="24" width="18" height="3" fill="#E2E8F0" />

                {/* Stretched Arms holding trolley handle */}
                <path d="M 12 12 Q 22 16 26 12" stroke="#1E40AF" strokeWidth="5" strokeLinecap="round" fill="none" />
                <circle cx="26" cy="12" r="3.5" fill="#FBCFE8" />

                {/* Head & Face */}
                <circle cx="10" cy="-4" r="8.5" fill="#FBCFE8" />
                {/* Eyes & Smile */}
                <circle cx="13" cy="-5" r="1.2" fill="#0F172A" />
                <path d="M 11 -2 Q 13 0 15 -2" stroke="#0F172A" strokeWidth="0.8" fill="none" />

                {/* Divina Warehouse Cap */}
                <path d="M 2 -7 Q 10 -16 18 -7 Z" fill="#1E3A8A" />
                {/* Cap Visor */}
                <path d="M 14 -7 L 22 -5 L 17 -3 Z" fill="#0F172A" />
              </g>
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
        {/* Dynamic Step Title */}
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

        {/* Dynamic Step Description */}
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

        {/* Shimmering Progress Bar */}
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
                "linear-gradient(90deg, #2563EB 0%, #38BDF8 25%, #F59E0B 50%, #10B981 75%, #2563EB 100%)",
              backgroundSize: "200% 100%",
              animation: `${shimmerBar} 2.4s linear infinite`,
            }}
          />
        </Box>

        {/* Bottom Details Footer */}
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
              Allocating inventory lots
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
              bgcolor: "#EEF2FF",
              border: "1px solid #E0E7FF",
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#4F46E5",
                animation: `${pulseGlow} 1.5s infinite`,
              }}
            />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#4338CA" }}>
              Active • {elapsed}s
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
