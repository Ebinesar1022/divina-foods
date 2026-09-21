import { useState, useEffect } from "react";
import { Box, Typography, keyframes } from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const shimmerBar = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
`;

const poSteps = [
  {
    title: "Validating Supplier & Payment Terms",
    desc: "Cross-checking supplier credentials and agreed payment conditions in Zoho...",
  },
  {
    title: "Generating Purchase Order Number",
    desc: "Reserving the next sequential PO number in the Divina Foods system...",
  },
  {
    title: "Dispatching Order to Supplier",
    desc: "Sending confirmed line items, quantities and unit prices to the vendor...",
  },
  {
    title: "Scheduling Delivery & ETA",
    desc: "Locking in the expected delivery date and warehouse receiving slot...",
  },
  {
    title: "Saving Purchase Order in Zoho Creator",
    desc: "Writing the PO record, line items and tax breakdowns to the database...",
  },
];

export default function PoCreationLoader() {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % poSteps.length);
    }, 3400);
    const elapsedTimer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(stepTimer);
      clearInterval(elapsedTimer);
    };
  }, []);

  const activeStep = poSteps[currentStep];

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
        bgcolor: "#F5F3FF",
        borderRadius: "20px",
        position: "relative",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Ambient background glows */}
      <Box
        sx={{
          position: "absolute",
          top: -60,
          left: -60,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -60,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(67,56,202,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Flow badge: Supplier → Warehouse */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 1.5 },
          px: { xs: 1.5, sm: 2.25 },
          py: 0.75,
          borderRadius: "999px",
          bgcolor: "#FFFFFF",
          border: "1px solid rgba(196,181,253,0.7)",
          boxShadow: "0 2px 10px rgba(67,56,202,0.08)",
          mb: 1.5,
          maxWidth: "100%",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {/* Supplier icon: simple building */}
          <Box
            component="span"
            sx={{ fontSize: { xs: 16, sm: 18 }, lineHeight: 1 }}
          >
            🏪
          </Box>
          <Typography sx={{ fontSize: { xs: 11, sm: 12.5 }, fontWeight: 700, color: "#4338CA", letterSpacing: "0.02em" }}>
            Supplier / Vendor
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: "#6366F1",
            animation: `${pulseGlow} 1.8s ease-in-out infinite`,
          }}
        >
          <LocalShippingIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
          <ArrowForwardIcon sx={{ fontSize: { xs: 13, sm: 15 } }} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <WarehouseIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: "#4338CA" }} />
          <Typography sx={{ fontSize: { xs: 11, sm: 12.5 }, fontWeight: 700, color: "#4338CA", letterSpacing: "0.02em" }}>
            Divina Warehouse
          </Typography>
        </Box>
      </Box>

      {/* Main Animated Scene */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 620,
          aspectRatio: "620 / 230",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(196,181,253,0.7)",
          boxShadow: "0 8px 24px rgba(67,56,202,0.09)",
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
            {/* Sky gradient — day-time supply chain */}
            <linearGradient id="poSkyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EEF2FF" />
              <stop offset="100%" stopColor="#E0E7FF" />
            </linearGradient>

            {/* Road gradient */}
            <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Truck body gradients */}
            <linearGradient id="truckCab" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4338CA" />
              <stop offset="100%" stopColor="#312E81" />
            </linearGradient>

            <linearGradient id="truckCargo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>

            {/* Supplier building gradient */}
            <linearGradient id="supplierBldg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* Warehouse building */}
            <linearGradient id="warehouseBldg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {/* PO document gradient */}
            <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>

            {/* Ground / tarmac floor */}
            <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>

            <style>{`
              @keyframes truckDrive {
                0%   { transform: translateX(-10px); }
                8%   { transform: translateX(-10px); }
                55%  { transform: translateX(310px); }
                72%  { transform: translateX(310px); }
                88%  { transform: translateX(-10px); opacity: 0.1; }
                92%  { transform: translateX(-10px); opacity: 1; }
                100% { transform: translateX(-10px); }
              }

              @keyframes wheelRoll {
                0%   { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }

              @keyframes exhaustPuff {
                0%   { transform: translateX(0) translateY(0) scale(0.5); opacity: 0; }
                25%  { opacity: 0.7; }
                100% { transform: translateX(-20px) translateY(-12px) scale(1.5); opacity: 0; }
              }

              @keyframes exhaustPuff2 {
                0%   { transform: translateX(0) translateY(0) scale(0.4); opacity: 0; }
                30%  { opacity: 0.6; }
                100% { transform: translateX(-26px) translateY(-18px) scale(1.8); opacity: 0; }
              }

              @keyframes docFloat {
                0%,100% { transform: translateY(0px) rotate(-4deg); }
                50%      { transform: translateY(-5px) rotate(-4deg); }
              }

              @keyframes roadDash {
                0%   { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -28; }
              }

              @keyframes poDeliveredPop {
                0%, 55%  { opacity: 0; transform: scale(0.5) translateY(8px); }
                65%      { opacity: 1; transform: scale(1.14) translateY(-6px); }
                78%      { opacity: 1; transform: scale(1) translateY(-4px); }
                90%, 100%{ opacity: 0; transform: scale(0.85) translateY(-12px); }
              }

              @keyframes cloudDrift {
                0%   { transform: translateX(0px); }
                50%  { transform: translateX(14px); }
                100% { transform: translateX(0px); }
              }

              @keyframes signatureDraw {
                0%   { stroke-dashoffset: 60; opacity: 0; }
                20%  { opacity: 1; }
                100% { stroke-dashoffset: 0; opacity: 1; }
              }
            `}</style>
          </defs>

          {/* ─── SKY ─── */}
          <rect x="0" y="0" width="620" height="160" fill="url(#poSkyGrad)" />

          {/* Sun */}
          <circle cx="580" cy="32" r="20" fill="#FEF08A" opacity="0.8" />
          <circle cx="580" cy="32" r="14" fill="#FDE047" />

          {/* Drifting Clouds */}
          <g style={{ animation: "cloudDrift 6s ease-in-out infinite" }}>
            <ellipse cx="120" cy="30" rx="38" ry="14" fill="white" opacity="0.85" />
            <ellipse cx="100" cy="36" rx="24" ry="10" fill="white" opacity="0.7" />
            <ellipse cx="148" cy="36" rx="22" ry="9" fill="white" opacity="0.7" />
          </g>
          <g style={{ animation: "cloudDrift 8s ease-in-out infinite 2s" }}>
            <ellipse cx="330" cy="22" rx="30" ry="11" fill="white" opacity="0.75" />
            <ellipse cx="314" cy="28" rx="18" ry="8" fill="white" opacity="0.6" />
            <ellipse cx="354" cy="28" rx="18" ry="8" fill="white" opacity="0.6" />
          </g>

          {/* ─── GROUND ─── */}
          <rect x="0" y="160" width="620" height="70" fill="url(#groundGrad)" />

          {/* ─── ROAD SURFACE ─── */}
          <rect x="0" y="162" width="620" height="46" fill="url(#roadGrad)" />

          {/* Road white centre dashes (animated — flowing left to right) */}
          <line
            x1="0" y1="185"
            x2="620" y2="185"
            stroke="white"
            strokeWidth="3"
            strokeDasharray="18 10"
            strokeLinecap="round"
            style={{ animation: "roadDash 0.55s linear infinite" }}
          />

          {/* Road edge lines */}
          <line x1="0" y1="165" x2="620" y2="165" stroke="#FEF08A" strokeWidth="1.5" strokeDasharray="18 6" opacity="0.8" />
          <line x1="0" y1="205" x2="620" y2="205" stroke="#FEF08A" strokeWidth="1.5" strokeDasharray="18 6" opacity="0.8" />

          {/* Pavement / kerb */}
          <rect x="0" y="207" width="620" height="6" fill="#475569" />
          <rect x="0" y="213" width="620" height="17" fill="#94A3B8" />

          {/* ─── LEFT: SUPPLIER ─── */}
          <g id="supplierSide">
            {/* Zone badge */}
            <rect x="10" y="10" width="110" height="20" rx="6" fill="#312E81" opacity="0.9" />
            <text x="65" y="24" textAnchor="middle" fill="#C7D2FE" fontSize="10" fontWeight="700" letterSpacing="0.04em">
              🏪 SUPPLIER
            </text>

            {/* Building body */}
            <rect x="14" y="68" width="98" height="92" fill="url(#supplierBldg)" stroke="#94A3B8" strokeWidth="1.5" />
            {/* Roof */}
            <polygon points="10,70 66,44 122,70" fill="#64748B" />

            {/* Sign board above door */}
            <rect x="26" y="72" width="74" height="14" rx="3" fill="#312E81" />
            <text x="63" y="83" textAnchor="middle" fill="#C7D2FE" fontSize="8" fontWeight="700">DIVINA VENDOR</text>

            {/* Door */}
            <rect x="50" y="120" width="30" height="40" rx="2" fill="#475569" />
            <circle cx="78" cy="142" r="2" fill="#FDE047" />

            {/* Windows */}
            <rect x="22" y="90" width="22" height="20" rx="2" fill="#BFDBFE" stroke="#93C5FD" strokeWidth="1" />
            <rect x="72" y="90" width="22" height="20" rx="2" fill="#BFDBFE" stroke="#93C5FD" strokeWidth="1" />

            {/* Window grid */}
            <line x1="33" y1="90" x2="33" y2="110" stroke="#93C5FD" strokeWidth="0.8" />
            <line x1="22" y1="100" x2="44" y2="100" stroke="#93C5FD" strokeWidth="0.8" />
            <line x1="83" y1="90" x2="83" y2="110" stroke="#93C5FD" strokeWidth="0.8" />
            <line x1="72" y1="100" x2="94" y2="100" stroke="#93C5FD" strokeWidth="0.8" />

            {/* Floating PO Document with animated signature */}
            <g transform="translate(22, 42)" style={{ animation: "docFloat 3s ease-in-out infinite" }}>
              {/* Paper */}
              <rect x="0" y="0" width="48" height="58" rx="4" fill="url(#docGrad)" stroke="#C7D2FE" strokeWidth="1.5" />
              {/* Header stripe */}
              <rect x="0" y="0" width="48" height="10" rx="4" fill="#4338CA" />
              <rect x="0" y="6" width="48" height="4" fill="#4338CA" />
              <text x="24" y="8.5" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="800">PURCHASE ORDER</text>
              {/* Doc lines */}
              <line x1="6" y1="18" x2="42" y2="18" stroke="#CBD5E1" strokeWidth="1.2" />
              <line x1="6" y1="25" x2="42" y2="25" stroke="#CBD5E1" strokeWidth="1.2" />
              <line x1="6" y1="32" x2="42" y2="32" stroke="#CBD5E1" strokeWidth="1.2" />
              <line x1="6" y1="39" x2="34" y2="39" stroke="#CBD5E1" strokeWidth="1.2" />
              {/* Animated signature line */}
              <path
                d="M 8 50 C 12 44 16 56 20 50 C 24 44 28 54 32 50 C 36 46 38 52 42 50"
                fill="none"
                stroke="#4338CA"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray="60"
                style={{ animation: "signatureDraw 2.5s ease-in-out infinite" }}
              />
              {/* Approved stamp ring */}
              <circle cx="38" cy="22" r="7" fill="none" stroke="#22C55E" strokeWidth="1.5" opacity="0.9" />
              <text x="38" y="25" textAnchor="middle" fill="#22C55E" fontSize="5" fontWeight="800">✓</text>
            </g>
          </g>

          {/* ─── RIGHT: DIVINA WAREHOUSE ─── */}
          <g id="warehouseSide">
            {/* Zone badge */}
            <rect x="488" y="10" width="124" height="20" rx="6" fill="#312E81" opacity="0.9" />
            <text x="550" y="24" textAnchor="middle" fill="#C7D2FE" fontSize="10" fontWeight="700" letterSpacing="0.04em">
              🏭 OUR WAREHOUSE
            </text>

            {/* Warehouse building */}
            <rect x="490" y="60" width="124" height="100" fill="url(#warehouseBldg)" stroke="#94A3B8" strokeWidth="1.5" />
            {/* Shed roof */}
            <polygon points="488,62 552,38 616,62" fill="#94A3B8" />

            {/* Roller shutter / loading dock */}
            <rect x="508" y="118" width="88" height="42" rx="2" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
            {/* Shutter horizontal slats */}
            <line x1="508" y1="126" x2="596" y2="126" stroke="#94A3B8" strokeWidth="1" />
            <line x1="508" y1="134" x2="596" y2="134" stroke="#94A3B8" strokeWidth="1" />
            <line x1="508" y1="142" x2="596" y2="142" stroke="#94A3B8" strokeWidth="1" />
            <line x1="508" y1="150" x2="596" y2="150" stroke="#94A3B8" strokeWidth="1" />
            {/* Dock number */}
            <rect x="546" y="120" width="12" height="8" rx="1" fill="#475569" />
            <text x="552" y="127" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="bold">D1</text>

            {/* Side windows */}
            <rect x="498" y="72" width="22" height="18" rx="2" fill="#BFDBFE" stroke="#93C5FD" strokeWidth="1" />
            <rect x="582" y="72" width="22" height="18" rx="2" fill="#BFDBFE" stroke="#93C5FD" strokeWidth="1" />
            <line x1="509" y1="72" x2="509" y2="90" stroke="#93C5FD" strokeWidth="0.8" />
            <line x1="498" y1="81" x2="520" y2="81" stroke="#93C5FD" strokeWidth="0.8" />
            <line x1="593" y1="72" x2="593" y2="90" stroke="#93C5FD" strokeWidth="0.8" />
            <line x1="582" y1="81" x2="604" y2="81" stroke="#93C5FD" strokeWidth="0.8" />

            {/* "PO RECEIVED" floating pop badge */}
            <g style={{ animation: "poDeliveredPop 6.8s ease-in-out infinite" }}>
              <rect x="468" y="50" width="110" height="26" rx="8" fill="#4338CA" />
              <text x="523" y="67" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">
                ✓ PO RECEIVED!
              </text>
              <polygon points="523,76 517,70 529,70" fill="#4338CA" />
            </g>

            {/* Loading dock ramp */}
            <polygon points="486,208 508,160 596,160 618,208" fill="#64748B" opacity="0.6" />
          </g>

          {/* ─── ANIMATED DELIVERY TRUCK ─── */}
          <g style={{ animation: "truckDrive 6.8s cubic-bezier(0.45,0.05,0.55,0.95) infinite" }}>
            <g transform="translate(130, 130)">
              {/* Exhaust smoke puffs (behind cab) */}
              <circle
                cx="-4"
                cy="18"
                r="6"
                fill="#94A3B8"
                opacity="0.5"
                style={{ animation: "exhaustPuff 1.4s ease-out infinite" }}
              />
              <circle
                cx="-6"
                cy="14"
                r="5"
                fill="#CBD5E1"
                opacity="0.45"
                style={{ animation: "exhaustPuff2 1.4s ease-out infinite 0.5s" }}
              />

              {/* ── CARGO TRAILER ── */}
              <rect x="18" y="6" width="118" height="50" rx="4" fill="url(#truckCargo)" />
              {/* Trailer branding stripe */}
              <rect x="18" y="14" width="118" height="10" fill="#312E81" />
              <text x="77" y="22" textAnchor="middle" fill="#C7D2FE" fontSize="7" fontWeight="800" letterSpacing="0.06em">
                DIVINA FOODS
              </text>
              {/* Divina logo mini */}
              <circle cx="36" cy="36" r="8" fill="#312E81" />
              <text x="36" y="39" textAnchor="middle" fill="#C7D2FE" fontSize="6" fontWeight="800">D</text>

              {/* Cargo door line */}
              <line x1="130" y1="6" x2="130" y2="56" stroke="#312E81" strokeWidth="2.5" />
              {/* Door handle */}
              <circle cx="128" cy="32" r="2.5" fill="#FEF08A" />

              {/* Vertical ribbing on trailer */}
              <line x1="60" y1="6" x2="60" y2="56" stroke="#312E81" strokeWidth="1" opacity="0.5" />
              <line x1="90" y1="6" x2="90" y2="56" stroke="#312E81" strokeWidth="1" opacity="0.5" />
              <line x1="120" y1="6" x2="120" y2="56" stroke="#312E81" strokeWidth="1" opacity="0.5" />

              {/* Trailer rear wheels */}
              <g transform="translate(100, 56)">
                <circle cx="0" cy="0" r="13" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
                <circle cx="0" cy="0" r="7" fill="#475569" />
                <circle cx="0" cy="0" r="3" fill="#0F172A" />
                <g style={{ animation: "wheelRoll 0.5s linear infinite", transformOrigin: "0px 0px" }}>
                  <line x1="0" y1="-11" x2="0" y2="11" stroke="#CBD5E1" strokeWidth="1.5" />
                  <line x1="-11" y1="0" x2="11" y2="0" stroke="#CBD5E1" strokeWidth="1.5" />
                  <line x1="-8" y1="-8" x2="8" y2="8" stroke="#CBD5E1" strokeWidth="1" />
                  <line x1="8" y1="-8" x2="-8" y2="8" stroke="#CBD5E1" strokeWidth="1" />
                </g>
              </g>
              <g transform="translate(122, 56)">
                <circle cx="0" cy="0" r="13" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
                <circle cx="0" cy="0" r="7" fill="#475569" />
                <circle cx="0" cy="0" r="3" fill="#0F172A" />
                <g style={{ animation: "wheelRoll 0.5s linear infinite", transformOrigin: "0px 0px" }}>
                  <line x1="0" y1="-11" x2="0" y2="11" stroke="#CBD5E1" strokeWidth="1.5" />
                  <line x1="-11" y1="0" x2="11" y2="0" stroke="#CBD5E1" strokeWidth="1.5" />
                  <line x1="-8" y1="-8" x2="8" y2="8" stroke="#CBD5E1" strokeWidth="1" />
                  <line x1="8" y1="-8" x2="-8" y2="8" stroke="#CBD5E1" strokeWidth="1" />
                </g>
              </g>

              {/* ── CAB ── */}
              {/* Cab body */}
              <rect x="-4" y="14" width="26" height="42" rx="3" fill="url(#truckCab)" />
              {/* Cab roof fairing (aero) */}
              <path d="M -2 14 Q 0 4 22 6 L 22 14 Z" fill="#4338CA" />

              {/* Windscreen */}
              <rect x="2" y="18" width="16" height="14" rx="2" fill="#BFDBFE" opacity="0.9" />
              {/* Wiper */}
              <line x1="4" y1="30" x2="16" y2="22" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />

              {/* Front bumper */}
              <rect x="-6" y="50" width="28" height="5" rx="2" fill="#1E293B" />
              {/* Headlights */}
              <rect x="-4" y="44" width="8" height="5" rx="1.5" fill="#FEF08A" />
              <rect x="12" y="44" width="8" height="5" rx="1.5" fill="#FEF08A" />
              {/* Grill */}
              <rect x="-2" y="50" width="22" height="4" rx="1" fill="#334155" />
              <line x1="5" y1="50" x2="5" y2="54" stroke="#475569" strokeWidth="0.8" />
              <line x1="12" y1="50" x2="12" y2="54" stroke="#475569" strokeWidth="0.8" />

              {/* Cab front wheel */}
              <g transform="translate(6, 56)">
                <circle cx="0" cy="0" r="13" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
                <circle cx="0" cy="0" r="7" fill="#475569" />
                <circle cx="0" cy="0" r="3" fill="#0F172A" />
                <g style={{ animation: "wheelRoll 0.5s linear infinite", transformOrigin: "0px 0px" }}>
                  <line x1="0" y1="-11" x2="0" y2="11" stroke="#CBD5E1" strokeWidth="1.5" />
                  <line x1="-11" y1="0" x2="11" y2="0" stroke="#CBD5E1" strokeWidth="1.5" />
                  <line x1="-8" y1="-8" x2="8" y2="8" stroke="#CBD5E1" strokeWidth="1" />
                  <line x1="8" y1="-8" x2="-8" y2="8" stroke="#CBD5E1" strokeWidth="1" />
                </g>
              </g>
            </g>
          </g>
        </svg>
      </Box>

      {/* Step Tracker */}
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
            color: "#1E1B4B",
            letterSpacing: "-0.01em",
            mb: 0.5,
          }}
        >
          {activeStep.title}
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: 12, sm: 13 },
            color: "#6366F1",
            maxWidth: 480,
            lineHeight: 1.45,
            mb: 2,
            minHeight: { xs: 36, sm: 28 },
          }}
        >
          {activeStep.desc}
        </Typography>

        {/* Shimmer Progress Bar (indigo/violet theme) */}
        <Box
          sx={{
            width: "100%",
            height: 7,
            borderRadius: "999px",
            bgcolor: "#E0E7FF",
            overflow: "hidden",
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
                "linear-gradient(90deg, #4338CA 0%, #6366F1 25%, #A5B4FC 50%, #4338CA 75%, #6366F1 100%)",
              backgroundSize: "200% 100%",
              animation: `${shimmerBar} 2.4s linear infinite`,
            }}
          />
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            px: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 15, color: "#6366F1" }} />
            <Typography sx={{ fontSize: { xs: 11, sm: 12 }, fontWeight: 600, color: "#4338CA" }}>
              Submitting PO to Zoho Creator
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
              border: "1px solid #C7D2FE",
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#4338CA",
                animation: `${pulseGlow} 1.5s infinite`,
              }}
            />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#312E81" }}>
              Active • {elapsed}s
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
