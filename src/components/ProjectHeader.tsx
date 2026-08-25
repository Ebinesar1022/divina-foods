// import React from 'react';
import { Box, Typography, IconButton, Chip, Stack, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { ProductionTargetRow } from '../types';

interface ProjectHeaderProps {
  record: ProductionTargetRow;
  progressPercent: number;
  onBack: () => void;
}

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  'Waiting for Stock': { bg: 'rgba(239,68,68,0.18)', fg: '#fecaca' },
  'Ready For Production': { bg: 'rgba(16,185,129,0.18)', fg: '#a7f3d0' },
  'Production Inprogress': { bg: 'rgba(14,165,233,0.18)', fg: '#bae6fd' },
  'Completed Production Target': { bg: 'rgba(16,185,129,0.25)', fg: '#a7f3d0' },
};

function statusPalette(status: string) {
  return STATUS_COLOR[status] ?? { bg: 'rgba(255,255,255,0.16)', fg: '#e0e7ff' };
}

/**
 * ProgressDonut — lightweight SVG circular progress ring.
 * No external chart lib needed; keeps the header bundle-light.
 */
function ProgressDonut({ value, size = 88 }: { value: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
          {value}%
        </Typography>
      </Box>
    </Box>
  );
}

export default function ProjectHeader({ record, progressPercent, onBack }: ProjectHeaderProps) {
  const palette = statusPalette(record.status);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '18px',
        px: { xs: 3, md: 4 },
        py: { xs: 3, md: 3.5 },
        background: 'linear-gradient(120deg, #1e3a8a 0%, #2563eb 55%, #0ea5e9 100%)',
        color: '#fff',
      }}
    >
      {/* Decorative translucent blur shapes */}
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          filter: 'blur(2px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -80,
          left: '35%',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          filter: 'blur(4px)',
          pointerEvents: 'none',
        }}
      />

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0 }}>
          <IconButton
            onClick={onBack}
            aria-label="Go back"
            sx={{
              color: '#fff',
              bgcolor: 'rgba(255,255,255,0.14)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' },
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff' }}>
                {record.productionTargetId}
              </Typography>
              <Chip
                label={record.status}
                size="small"
                sx={{
                  bgcolor: palette.bg,
                  color: palette.fg,
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)', mt: 0.5 }}>
              Production Overview
            </Typography>
            {record.notes && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  display: 'block',
                  mt: 0.5,
                  maxWidth: 480,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {record.notes}
              </Typography>
            )}
          </Box>
        </Stack>

        <ProgressDonut value={progressPercent} />
      </Stack>
    </Paper>
  );
}
