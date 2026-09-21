import { useState, useEffect } from "react";
import { Box, Typography, keyframes } from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VerifiedIcon from "@mui/icons-material/Verified";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import WarehouseIcon from "@mui/icons-material/Warehouse";

const shimmerBar = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
`;

const receiveSteps = [
  {
    title: "Docking Carrier & Inward Inspection",
    desc: "Verifying supplier delivery note against Purchase Order items and logging bay arrival...",
  },
  {
    title: "Inspecting Batch Numbers & Expiry Dates",
    desc: "Cross-checking manufacturer batch codes, shelf life, and packaging integrity...",
  },
  {
    title: "Verifying Quality & Cold-Chain Compliance",
    desc: "Checking transit temperature logs, lot traceability, and food safety standards...",
  },
  {
    title: "Moving Pallets to Inward Storage",
    desc: "Transporting verified ingredients to raw material racks and cold storage rooms...",
  },
  {
    title: "Updating Stock & Syncing with Zoho Creator",
    desc: "Writing Receive Item records, registering batch details, and updating inventory levels...",
  },
];

interface PoReceiveLoaderProps {
  poNumber?: string;
  itemCount?: number;
}

export default function PoReceiveLoader({ poNumber, itemCount }: PoReceiveLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % receiveSteps.length);
    }, 3200);

    const elapsedTimer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stepTimer);
      clearInterval(elapsedTimer);
    };
  }, []);

  const activeStep = receiveSteps[currentStep];

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
        bgcolor: "#F0FDF4",
        borderRadius: "20px",
        position: "relative",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Background Ambient Glows */}
      <Box
        sx={{
          position: "absolute",
          top: -60,
          left: -60,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)",
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
          background: "radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top Header Flow Badge: Truck Delivery → Inspection & QC → Divina Storage */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 1.5 },
          px: { xs: 1.5, sm: 2.25 },
          py: 0.75,
          borderRadius: "999px",
          bgcolor: "#FFFFFF",
          border: "1px solid rgba(167,243,208,0.85)",
          boxShadow: "0 2px 10px rgba(5,150,105,0.08)",
          mb: 1.5,
          maxWidth: "100%",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <LocalShippingIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: "#059669" }} />
          <Typography sx={{ fontSize: { xs: 11, sm: 12.5 }, fontWeight: 700, color: "#065F46" }}>
            Delivery Truck
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: "#10B981",
            animation: `${pulseGlow} 1.8s ease-in-out infinite`,
          }}
        >
          <ArrowForwardIcon sx={{ fontSize: { xs: 13, sm: 15 } }} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          <QrCodeScannerIcon sx={{ fontSize: { xs: 15, sm: 17 }, color: "#059669" }} />
          <Typography sx={{ fontSize: { xs: 11, sm: 12.5 }, fontWeight: 700, color: "#047857" }}>
            Batch QC & Scan
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: "#10B981",
            animation: `${pulseGlow} 1.8s ease-in-out infinite 0.4s`,
          }}
        >
          <ArrowForwardIcon sx={{ fontSize: { xs: 13, sm: 15 } }} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <WarehouseIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: "#065F46" }} />
          <Typography sx={{ fontSize: { xs: 11, sm: 12.5 }, fontWeight: 700, color: "#065F46" }}>
            Goods Inward
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
          border: "1px solid rgba(167,243,208,0.85)",
          boxShadow: "0 8px 24px rgba(5,150,105,0.09)",
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
            {/* Dock wall gradient */}
            <linearGradient id="dockWallGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="70%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {/* Warehouse floor concrete */}
            <linearGradient id="dockFloorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="15%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Truck body gradient */}
            <linearGradient id="truckBodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>

            {/* Truck cargo bay */}
            <linearGradient id="cargoInteriorGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Inward cold storage portal */}
            <linearGradient id="coldStorageGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#065F46" />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>

            {/* Laser scan beam gradient */}
            <linearGradient id="laserBeamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(16,185,129,0.9)" />
              <stop offset="50%" stopColor="rgba(52,211,153,0.4)" />
              <stop offset="100%" stopColor="rgba(110,231,183,0.05)" />
            </linearGradient>

            {/* Flour sack gradient */}
            <linearGradient id="sackGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>

            {/* Tomato crate gradient */}
            <linearGradient id="tomatoCrateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>

            {/* Cheese crate gradient */}
            <linearGradient id="cheeseCrateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            <style>{`
              @keyframes scannerSweep {
                0%   { transform: rotate(-18deg); opacity: 0.3; }
                25%  { transform: rotate(14deg); opacity: 0.95; }
                50%  { transform: rotate(-10deg); opacity: 0.8; }
                75%  { transform: rotate(18deg); opacity: 0.95; }
                100% { transform: rotate(-18deg); opacity: 0.3; }
              }

              @keyframes qcBadgeFloat {
                0%   { opacity: 0; transform: translateY(8px) scale(0.65); }
                18%  { opacity: 1; transform: translateY(-4px) scale(1.08); }
                30%  { opacity: 1; transform: translateY(-8px) scale(1); }
                45%  { opacity: 0; transform: translateY(-16px) scale(0.85); }
                100% { opacity: 0; transform: translateY(-16px) scale(0.85); }
              }

              @keyframes palletJackRoll {
                0%   { transform: translateX(0px); }
                8%   { transform: translateX(0px); }
                58%  { transform: translateX(185px); }
                76%  { transform: translateX(185px); }
                86%  { transform: translateX(0px); opacity: 0.2; }
                90%  { transform: translateX(0px); opacity: 1; }
                100% { transform: translateX(0px); }
              }

              @keyframes wheelSpin {
                0%   { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }

              @keyframes inspectorBob {
                0%, 100% { transform: translateY(0); }
                50%      { transform: translateY(-2px); }
              }

              @keyframes armScan {
                0%, 100% { transform: rotate(0deg); }
                25%      { transform: rotate(4deg); }
                75%      { transform: rotate(-3deg); }
              }

              @keyframes coldSteamPuff {
                0%   { opacity: 0; transform: translateX(0) translateY(0) scale(0.6); }
                30%  { opacity: 0.45; }
                100% { opacity: 0; transform: translateX(20px) translateY(-14px) scale(1.5); }
              }

              @keyframes beaconBlink {
                0%, 100% { opacity: 0.3; }
                50%      { opacity: 1; }
              }

              @keyframes greenFlowArrows {
                0%   { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -20; }
              }
            `}</style>
          </defs>

          {/* ─── WAREHOUSE BACKGROUND WALL ─── */}
          <rect x="0" y="0" width="620" height="152" fill="url(#dockWallGrad)" />

          {/* Wall Panel Lines */}
          <line x1="0" y1="40" x2="620" y2="40" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />
          <line x1="0" y1="85" x2="620" y2="85" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />
          <line x1="0" y1="125" x2="620" y2="125" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />

          {/* Warehouse Steel Racks in the distant background (right) */}
          <g opacity="0.5">
            {/* Uprights */}
            <rect x="420" y="24" width="5" height="128" fill="#64748B" />
            <rect x="485" y="24" width="5" height="128" fill="#64748B" />
            <rect x="550" y="24" width="5" height="128" fill="#64748B" />
            {/* Shelf beams */}
            <rect x="415" y="55" width="145" height="4" fill="#E2E8F0" />
            <rect x="415" y="90" width="145" height="4" fill="#E2E8F0" />
            <rect x="415" y="125" width="145" height="4" fill="#E2E8F0" />
            {/* Stored goods on shelves */}
            <rect x="425" y="38" width="22" height="16" rx="2" fill="#FDE68A" />
            <rect x="452" y="36" width="24" height="18" rx="2" fill="#FCA5A5" />
            <rect x="495" y="38" width="20" height="16" rx="2" fill="#BBF7D0" />
            <rect x="520" y="34" width="24" height="20" rx="2" fill="#FDE68A" />

            <rect x="426" y="73" width="26" height="16" rx="2" fill="#FED7AA" />
            <rect x="458" y="75" width="22" height="14" rx="2" fill="#E9D5FF" />
            <rect x="495" y="72" width="24" height="17" rx="2" fill="#FCA5A5" />
            <rect x="524" y="74" width="20" height="15" rx="2" fill="#BBF7D0" />

            <rect x="426" y="108" width="24" height="16" rx="2" fill="#CBD5E1" />
            <rect x="455" y="107" width="25" height="17" rx="2" fill="#FEF08A" />
            <rect x="494" y="109" width="22" height="15" rx="2" fill="#BAE6FD" />
            <rect x="522" y="106" width="24" height="18" rx="2" fill="#FED7AA" />
          </g>

          {/* Overhead Industrial Lighting Fixture with Warm Cone */}
          <g>
            {/* Cord */}
            <line x1="280" y1="0" x2="280" y2="18" stroke="#475569" strokeWidth="2" />
            {/* Bell shade */}
            <path d="M 268 24 L 292 24 L 296 28 L 264 28 Z" fill="#0F172A" />
            <ellipse cx="280" cy="28" rx="16" ry="3" fill="#334155" />
            <circle cx="280" cy="29" r="3.5" fill="#FEF08A" />
            {/* Conical light beam */}
            <polygon points="266,29 294,29 370,165 190,165" fill="rgba(254, 240, 138, 0.12)" />
          </g>

          {/* Bay Header Sign */}
          <rect x="18" y="10" width="200" height="22" rx="5" fill="#065F46" />
          <text x="26" y="25" fill="#A7F3D0" fontSize="10" fontWeight="700" letterSpacing="0.08em" fontFamily="Inter, system-ui, sans-serif">
            DIVINA FOODS • BAY #01 INWARD
          </text>
          {/* Green Status Beacon */}
          <circle cx="206" cy="21" r="5" fill="#10B981" style={{ animation: "beaconBlink 1.4s ease-in-out infinite" }} />
          <circle cx="206" cy="21" r="2.5" fill="#ECFDF5" />

          {/* ─── DOCK & CONCRETE FLOOR ─── */}
          <rect x="0" y="152" width="620" height="78" fill="url(#dockFloorGrad)" />

          {/* Safety Hazard Stripes at Dock Edge (Yellow & Black) */}
          <defs>
            <pattern id="hazardPattern" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="16" fill="#F59E0B" />
              <rect x="8" width="8" height="16" fill="#1E293B" />
            </pattern>
          </defs>
          <rect x="0" y="152" width="145" height="7" fill="url(#hazardPattern)" opacity="0.9" />

          {/* Ground Inward Green Flow Direction Line */}
          <line
            x1="150"
            y1="214"
            x2="590"
            y2="214"
            stroke="#10B981"
            strokeWidth="3"
            strokeDasharray="12 8"
            style={{ animation: "greenFlowArrows 0.8s linear infinite" }}
          />

          {/* Floor Staging Zone Markings */}
          <rect x="360" y="165" width="210" height="42" rx="4" fill="none" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.75" />
          <text x="370" y="177" fill="#FEF08A" fontSize="8" fontWeight="700" letterSpacing="0.05em" opacity="0.8">
            VERIFIED PALLET STAGING ZONE
          </text>

          {/* ─── LEFT: REFRIGERATED DELIVERY TRUCK DOCKED AT BAY ─── */}
          <g id="deliveryTruck">
            {/* Truck Cab Outline in Dock */}
            <path d="M 0 35 L 5 35 L 8 45 L 8 152 L 0 152 Z" fill="#064E3B" />
            {/* Rear of Truck Cargo Box */}
            <rect x="8" y="32" width="118" height="120" rx="3" fill="url(#truckBodyGrad)" stroke="#064E3B" strokeWidth="2" />
            {/* Open Truck Cargo Door (Left Swing) */}
            <path d="M 8 32 L -6 40 L -6 148 L 8 152 Z" fill="#047857" opacity="0.9" />
            {/* Cargo Interior Opening */}
            <rect x="18" y="42" width="98" height="106" fill="url(#cargoInteriorGrad)" />

            {/* Shelves and boxes inside the delivery truck */}
            <g>
              {/* Stacked ingredient crates inside truck */}
              <rect x="24" y="60" width="34" height="24" rx="2" fill="#B45309" stroke="#78350F" strokeWidth="1" />
              <rect x="27" y="64" width="28" height="6" fill="#FDE68A" opacity="0.85" />
              <text x="30" y="70" fill="#78350F" fontSize="6" fontWeight="bold">SAN MARZ</text>

              <rect x="64" y="60" width="38" height="24" rx="2" fill="#D97706" stroke="#92400E" strokeWidth="1" />
              <rect x="67" y="64" width="32" height="6" fill="#FEF3C7" opacity="0.85" />
              <text x="70" y="70" fill="#92400E" fontSize="6" fontWeight="bold">MOZZAREL</text>

              {/* Lower row inside truck */}
              <rect x="24" y="90" width="40" height="26" rx="2" fill="#FEF3C7" stroke="#CBD5E1" strokeWidth="1" />
              <circle cx="44" cy="103" r="7" fill="#FDE047" opacity="0.9" />
              <text x="34" y="105" fill="#78350F" fontSize="6" fontWeight="bold">TIPO 00</text>

              <rect x="68" y="90" width="36" height="26" rx="2" fill="#047857" stroke="#064E3B" strokeWidth="1" />
              <rect x="72" y="94" width="28" height="7" fill="#A7F3D0" opacity="0.9" />
              <text x="76" y="100" fill="#065F46" fontSize="6" fontWeight="bold">EVOO OIL</text>
            </g>

            {/* Cold air vapor puff escaping refrigerated truck */}
            <g style={{ animation: "coldSteamPuff 3.5s ease-out infinite" }}>
              <ellipse cx="118" cy="115" rx="14" ry="6" fill="rgba(224,242,254,0.7)" />
              <ellipse cx="128" cy="110" rx="10" ry="5" fill="rgba(240,253,250,0.6)" />
            </g>

            {/* Dock Leveller Ramp (Extends from truck floor to warehouse dock) */}
            <polygon points="118,146 148,154 148,158 118,152" fill="#64748B" stroke="#334155" strokeWidth="1" />
            <polygon points="120,147 146,154 146,155 120,148" fill="#94A3B8" />
          </g>

          {/* ─── CENTER-LEFT: WAREHOUSE RECEIVING SPECIALIST (INSPECTOR) ─── */}
          <g id="receivingInspector" transform="translate(142, 68)" style={{ animation: "inspectorBob 2.4s ease-in-out infinite" }}>
            {/* Inspector Shadow */}
            <ellipse cx="28" cy="98" rx="18" ry="4" fill="rgba(15,23,42,0.3)" />

            {/* Legs & Industrial Safety Boots */}
            <rect x="20" y="60" width="7" height="34" rx="2" fill="#1E293B" />
            <rect x="29" y="60" width="7" height="34" rx="2" fill="#1E293B" />
            {/* Steel Toe Boots */}
            <rect x="18" y="90" width="11" height="7" rx="2" fill="#0F172A" />
            <rect x="29" y="90" width="11" height="7" rx="2" fill="#0F172A" />

            {/* Torso & High-Vis Emerald Safety Vest */}
            <rect x="16" y="24" width="24" height="38" rx="4" fill="#059669" />
            {/* Hi-Vis Silver Reflective Bands */}
            <rect x="16" y="32" width="24" height="4" fill="#E2E8F0" />
            <rect x="16" y="44" width="24" height="4" fill="#E2E8F0" />
            {/* Vest Collar & Necktie */}
            <polygon points="28,24 24,34 32,34" fill="#FFFFFF" />

            {/* Head & Divina Foods Cap */}
            <circle cx="28" cy="14" r="10" fill="#FCD34D" />
            {/* Cap */}
            <path d="M 17 12 C 17 5 39 5 39 12 Z" fill="#064E3B" />
            {/* Cap Visor pointing forward */}
            <rect x="28" y="10" width="14" height="3" rx="1.5" fill="#065F46" />
            {/* Eye & Smile */}
            <circle cx="33" cy="14" r="1.5" fill="#0F172A" />
            <path d="M 31 18 Q 34 20 37 18" stroke="#0F172A" strokeWidth="1" fill="none" />

            {/* Left Arm holding Digital Barcode / RFID Terminal */}
            <g id="scannerArm" style={{ animation: "armScan 3.2s ease-in-out infinite" }}>
              {/* Arm sleeve */}
              <rect x="26" y="26" width="7" height="20" rx="3" fill="#059669" transform="rotate(-20 26 26)" />
              {/* Hand holding device */}
              <circle cx="42" cy="38" r="4.5" fill="#FCD34D" />
              {/* Scanner Handheld Terminal */}
              <rect x="40" y="30" width="16" height="11" rx="2" fill="#1E293B" transform="rotate(15 40 30)" />
              {/* Scanner Screen */}
              <rect x="42" y="32" width="10" height="6" rx="1" fill="#10B981" transform="rotate(15 40 30)" />

              {/* Sweeping Green Laser Cone */}
              <g transform="translate(56, 38)">
                <g style={{ animation: "scannerSweep 2.8s ease-in-out infinite", transformOrigin: "0 0" }}>
                  <polygon points="0,0 62,-16 62,26" fill="url(#laserBeamGrad)" />
                  <line x1="0" y1="0" x2="62" y2="5" stroke="#34D399" strokeWidth="1.5" opacity="0.9" />
                  {/* Laser point spark */}
                  <circle cx="62" cy="5" r="3" fill="#6EE7B7" />
                </g>
              </g>
            </g>

            {/* Floating Quality Checked Badge with Sparkles */}
            <g transform="translate(68, -12)" style={{ animation: "qcBadgeFloat 3.2s ease-in-out infinite" }}>
              <rect x="0" y="0" width="86" height="26" rx="13" fill="#065F46" stroke="#34D399" strokeWidth="1.5" />
              <circle cx="14" cy="13" r="8" fill="#10B981" />
              <path d="M 10 13 L 13 16 L 18 10" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <text x="26" y="17" fill="#FFFFFF" fontSize="9" fontWeight="800" letterSpacing="0.04em" fontFamily="system-ui, sans-serif">
                LOT VERIFIED
              </text>
              {/* Tiny Sparkle Stars */}
              <path d="M 90 2 L 92 6 L 96 8 L 92 10 L 90 14 L 88 10 L 84 8 L 88 6 Z" fill="#FDE047" />
              <path d="M -8 18 L -6 20 L -4 22 L -6 24 L -8 26 L -10 24 L -12 22 L -10 20 Z" fill="#34D399" />
            </g>
          </g>

          {/* ─── MOVING PALLET JACK / TROLLEY WITH INGREDIENTS ─── */}
          <g style={{ animation: "palletJackRoll 6.5s ease-in-out infinite" }}>
            <g transform="translate(230, 112)">
              {/* Pallet Jack Cast Shadow */}
              <ellipse cx="65" cy="56" rx="55" ry="6" fill="rgba(15,23,42,0.25)" />

              {/* Wooden Pallet Base */}
              <g id="woodenPallet">
                {/* Pallet Runners */}
                <rect x="18" y="44" width="76" height="5" fill="#78350F" />
                <rect x="22" y="49" width="10" height="4" fill="#522504" />
                <rect x="52" y="49" width="10" height="4" fill="#522504" />
                <rect x="80" y="49" width="10" height="4" fill="#522504" />
                {/* Pallet Deck Boards */}
                <rect x="16" y="40" width="80" height="4" rx="1" fill="#B45309" />
                <line x1="38" y1="40" x2="38" y2="44" stroke="#78350F" strokeWidth="1" />
                <line x1="60" y1="40" x2="60" y2="44" stroke="#78350F" strokeWidth="1" />
                <line x1="82" y1="40" x2="82" y2="44" stroke="#78350F" strokeWidth="1" />
              </g>

              {/* ── STACKED RAW MATERIALS ON PALLET ── */}
              {/* Bottom Left: Crate of Fresh Italian Tomatoes */}
              <rect x="20" y="16" width="36" height="24" rx="2" fill="url(#tomatoCrateGrad)" stroke="#522504" strokeWidth="1" />
              {/* Tomato crate slats & label */}
              <line x1="20" y1="24" x2="56" y2="24" stroke="#522504" strokeWidth="1" />
              <line x1="20" y1="32" x2="56" y2="32" stroke="#522504" strokeWidth="1" />
              {/* Fresh Tomatoes visible at top */}
              <circle cx="28" cy="14" r="5" fill="#EF4444" />
              <circle cx="27" cy="12" r="1.5" fill="#22C55E" />
              <circle cx="38" cy="14" r="5.5" fill="#DC2626" />
              <circle cx="37" cy="12" r="1.5" fill="#16A34A" />
              <circle cx="48" cy="14" r="4.8" fill="#EF4444" />
              <circle cx="48" cy="12" r="1.5" fill="#22C55E" />
              {/* Crate Label */}
              <rect x="24" y="26" width="28" height="6" rx="1" fill="#FEF3C7" />
              <text x="26" y="31" fill="#78350F" fontSize="5" fontWeight="bold">SAN MARZANO</text>

              {/* Bottom Right: Crate with Cheese Wheels & Olive Oil */}
              <rect x="58" y="16" width="36" height="24" rx="2" fill="url(#cheeseCrateGrad)" stroke="#78350F" strokeWidth="1" />
              {/* Slat lines */}
              <line x1="58" y1="24" x2="94" y2="24" stroke="#78350F" strokeWidth="1" />
              <line x1="58" y1="32" x2="94" y2="32" stroke="#78350F" strokeWidth="1" />
              {/* Cheese wheels visible on top */}
              <ellipse cx="68" cy="14" rx="7" ry="4" fill="#FEF08A" stroke="#F59E0B" strokeWidth="1" />
              <ellipse cx="82" cy="14" rx="7" ry="4" fill="#FDE047" stroke="#D97706" strokeWidth="1" />
              <rect x="62" y="26" width="28" height="6" rx="1" fill="#FFFFFF" />
              <text x="64" y="31" fill="#92400E" fontSize="5" fontWeight="bold">MOZZARELLA</text>

              {/* Top Layer: Large Sacks of Tipo 00 Pizza Flour */}
              <g transform="translate(32, -8)">
                {/* Flour Sack 1 */}
                <path d="M 0 10 Q 5 -2 24 -2 Q 44 -2 48 10 Q 48 24 24 24 Q 0 24 0 10 Z" fill="url(#sackGrad)" stroke="#D97706" strokeWidth="1" />
                {/* Wheat logo mark on flour sack */}
                <ellipse cx="24" cy="10" rx="6" ry="6" fill="#FEF08A" />
                <path d="M 24 6 L 24 14 M 22 8 L 26 12 M 26 8 L 22 12" stroke="#B45309" strokeWidth="1" strokeLinecap="round" />
                <text x="14" y="21" fill="#78350F" fontSize="5.5" fontWeight="900" letterSpacing="0.04em">DIVINA 00</text>
              </g>

              {/* Green Inward Inspection Pass Tag on the Goods */}
              <g transform="translate(86, 0)">
                <polygon points="0,4 12,0 12,16 0,20" fill="#10B981" />
                <circle cx="4" cy="10" r="1.5" fill="#FFFFFF" />
                <text x="5" y="11" fill="#FFFFFF" fontSize="4.5" fontWeight="bold" transform="rotate(-15 5 11)">OK</text>
              </g>

              {/* ── HYDRAULIC PALLET JACK STEEL FRAME ── */}
              {/* Pallet Forks underneath */}
              <rect x="12" y="49" width="80" height="4" rx="1.5" fill="#047857" />
              {/* Front Rollers / Wheels */}
              <g transform="translate(88, 54)">
                <circle cx="0" cy="0" r="4.5" fill="#1E293B" style={{ animation: "wheelSpin 0.9s linear infinite" }} />
                <circle cx="0" cy="0" r="2" fill="#94A3B8" />
              </g>
              {/* Rear Drive Housing & Hydraulic Pump Cylinder */}
              <rect x="4" y="32" width="12" height="22" rx="2" fill="#065F46" />
              <rect x="7" y="26" width="6" height="8" fill="#10B981" />
              {/* Steer Wheels */}
              <g transform="translate(10, 54)">
                <circle cx="0" cy="0" r="5" fill="#0F172A" style={{ animation: "wheelSpin 0.9s linear infinite" }} />
                <circle cx="0" cy="0" r="2.5" fill="#CBD5E1" />
              </g>
              {/* T-bar Steering Tiller Handle */}
              <line x1="6" y1="34" x2="-8" y2="10" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
              <path d="M -12 8 L -4 12" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </g>

          {/* ─── RIGHT: INWARD COLD STORAGE PORTAL / SPEED DOOR ─── */}
          <g id="coldStorageDoor" transform="translate(515, 20)">
            {/* Speed Door Frame */}
            <rect x="0" y="0" width="105" height="135" rx="4" fill="url(#coldStorageGrad)" stroke="#047857" strokeWidth="2" />
            {/* Inner opening */}
            <rect x="8" y="14" width="97" height="121" fill="#022C22" />
            {/* Roll-up curtain segments */}
            <line x1="8" y1="30" x2="105" y2="30" stroke="#065F46" strokeWidth="2" />
            <line x1="8" y1="50" x2="105" y2="50" stroke="#065F46" strokeWidth="2" />
            <line x1="8" y1="70" x2="105" y2="70" stroke="#065F46" strokeWidth="2" />
            <line x1="8" y1="90" x2="105" y2="90" stroke="#065F46" strokeWidth="2" />
            <line x1="8" y1="110" x2="105" y2="110" stroke="#065F46" strokeWidth="2" />

            {/* Digital Thermostat Display Above Door */}
            <rect x="18" y="4" width="68" height="10" rx="2" fill="#0F172A" />
            <text x="24" y="12" fill="#34D399" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
              ❄️ CHILL +2.4°C
            </text>

            {/* Inward Traffic Signal (Green arrow) */}
            <circle cx="8" cy="8" r="4.5" fill="#10B981" />
            <polygon points="6,9 10,9 8,6" fill="#FFFFFF" />
          </g>
        </svg>
      </Box>

      {/* Dynamic Status Display & Rotating Stage Cards */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 580,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          px: 1,
        }}
      >
        {/* Step dots with active pulse */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          {receiveSteps.map((_, idx) => (
            <Box
              key={idx}
              sx={{
                width: idx === currentStep ? 24 : 7,
                height: 7,
                borderRadius: "999px",
                bgcolor: idx === currentStep ? "#059669" : "rgba(16,185,129,0.25)",
                transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          ))}
        </Box>

        {/* PO Number & Items Header Pill if provided */}
        {(poNumber || itemCount) && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.5,
              py: 0.3,
              borderRadius: "999px",
              bgcolor: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.3)",
              mb: 0.75,
            }}
          >
            <VerifiedIcon sx={{ fontSize: 13, color: "#059669" }} />
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#065F46" }}>
              {poNumber ? `Receiving for ${poNumber}` : "Receiving Purchase Order"}
              {itemCount ? ` • ${itemCount} ${itemCount === 1 ? "line item" : "line items"}` : ""}
            </Typography>
          </Box>
        )}

        {/* Active Step Title */}
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: 14.5, sm: 16.5 },
            color: "#064E3B",
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
            color: "#4B5563",
            maxWidth: 480,
            lineHeight: 1.45,
            mb: 2,
            minHeight: { xs: 36, sm: 28 },
          }}
        >
          {activeStep.desc}
        </Typography>

        {/* Shimmering Progress Bar (Emerald -> Mint -> Teal) */}
        <Box
          sx={{
            width: "100%",
            height: 7,
            borderRadius: "999px",
            bgcolor: "#D1FAE5",
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
                "linear-gradient(90deg, #059669 0%, #10B981 25%, #34D399 50%, #059669 75%, #047857 100%)",
              backgroundSize: "200% 100%",
              animation: `${shimmerBar} 2.2s linear infinite`,
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
            color: "#4B5563",
            fontSize: 12,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <VerifiedIcon sx={{ fontSize: 15, color: "#059669" }} />
            <Typography sx={{ fontSize: { xs: 11, sm: 12 }, fontWeight: 600, color: "#065F46" }}>
              Verifying lot batches & expiry
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
              border: "1px solid #A7F3D0",
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#10B981",
                animation: `${pulseGlow} 1.5s infinite`,
              }}
            />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#047857" }}>
              Receiving • {elapsed}s
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
