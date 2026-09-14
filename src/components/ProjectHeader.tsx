import { memo } from 'react';
import { Box, Typography, IconButton, Chip, Stack, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { ProductionTargetRow } from '../types';

interface ProjectHeaderProps {
  record: ProductionTargetRow;
  progressPercent: number;
  onBack: () => void;
}

const STATUS_COLOR: Record<string, { bg: string; fg: string; border: string }> = {
  Planned: { bg: 'rgba(99, 102, 241, 0.28)', fg: '#e0e7ff', border: 'rgba(199, 210, 254, 0.45)' },
  'Waiting for Stock': { bg: 'rgba(239, 68, 68, 0.28)', fg: '#fecaca', border: 'rgba(254, 202, 202, 0.45)' },
  'In Progress': { bg: 'rgba(14, 165, 233, 0.28)', fg: '#bae6fd', border: 'rgba(186, 230, 253, 0.45)' },
  Completed: { bg: 'rgba(16, 185, 129, 0.32)', fg: '#a7f3d0', border: 'rgba(167, 243, 208, 0.45)' },
};

function statusPalette(status: string) {
  return STATUS_COLOR[status] ?? { bg: 'rgba(255, 255, 255, 0.20)', fg: '#ffffff', border: 'rgba(255, 255, 255, 0.35)' };
}

/**
 * ProgressDonut — lightweight SVG circular progress ring with luminous glowing accent.
 */
function ProgressDonut({ value, size = 82 }: { value: number; size?: number }) {
  const strokeWidth = 7.5;
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
          stroke="rgba(255, 255, 255, 0.18)"
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
          style={{
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))',
          }}
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
        <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: 16, sm: 18 }, lineHeight: 1 }}>
          {value}%
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 9.5, fontWeight: 600, mt: 0.25, letterSpacing: '0.04em' }}>
          PROGRESS
        </Typography>
      </Box>
    </Box>
  );
}

function ProjectHeader({ record, progressPercent, onBack }: ProjectHeaderProps) {
  const palette = statusPalette(record.status);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '22px',
        px: { xs: 2.5, sm: 3.5, md: 4 },
        py: { xs: 2.5, sm: 3, md: 3.5 },
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #2563eb 75%, #0ea5e9 100%)',
        border: '1px solid rgba(255, 255, 255, 0.22)',
        color: '#fff',
        boxShadow: '0 20px 45px -10px rgba(37, 99, 235, 0.28), 0 8px 20px rgba(15, 23, 42, 0.12)',
        animation: 'fadeIn 0.4s ease-out',
      }}
    >
      {/* Decorative liquid-glass bubbles with floating animation */}
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          right: -40,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
          animation: 'floatSlow 16s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -80,
          left: '25%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(14, 165, 233, 0) 70%)',
          filter: 'blur(25px)',
          pointerEvents: 'none',
          animation: 'floatDrift 20s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -20,
          left: 35,
          width: 110,
          height: 110,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25), rgba(255,255,255,0.02) 70%)',
          filter: 'blur(2px)',
          pointerEvents: 'none',
          animation: 'pulseGlow 8s ease-in-out infinite',
        }}
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={{ xs: 2, sm: 3 }}
        sx={{ position: 'relative', zIndex: 1, width: '100%' }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0, flex: 1 }}>
          <IconButton
            onClick={onBack}
            aria-label="Go back"
            sx={{
              color: '#fff',
              bgcolor: 'rgba(255, 255, 255, 0.14)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.26)',
                transform: 'translateX(-3px) scale(1.04)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
              },
              '&:active': {
                transform: 'scale(0.96)',
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ gap: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#fff',
                  fontSize: { xs: '1.35rem', sm: '1.55rem', md: '1.75rem' },
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                }}
              >
                {record.productionTargetId}
              </Typography>
              <Chip
                label={record.status}
                size="small"
                sx={{
                  bgcolor: palette.bg,
                  color: palette.fg,
                  fontWeight: 700,
                  fontSize: 12,
                  border: `1px solid ${palette.border}`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  px: 0.5,
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.04)',
                  },
                }}
              />
            </Stack>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255, 255, 255, 0.90)', mt: 0.5, fontWeight: 500, fontSize: { xs: 13, sm: 14 } }}
            >
              Production Overview &amp; Tracking
            </Typography>
            {(record.date || record.assignedTo) && (
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255, 255, 255, 0.75)', display: 'block', mt: 0.5, fontWeight: 500, fontSize: 12 }}
              >
                {[record.date, record.assignedTo].filter(Boolean).join(' · ')}
              </Typography>
            )}
            {record.notes && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  display: 'block',
                  mt: 0.5,
                  maxWidth: 560,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 11.5,
                }}
              >
                {record.notes}
              </Typography>
            )}
          </Box>
        </Stack>

        <Box sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
          <ProgressDonut value={progressPercent} size={82} />
        </Box>
      </Stack>
    </Paper>
  );
}

export default memo(ProjectHeader);


