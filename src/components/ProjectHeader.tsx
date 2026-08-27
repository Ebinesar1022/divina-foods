import { Box, Typography, IconButton, Chip, Stack, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { ProductionTargetRow } from '../types';

interface ProjectHeaderProps {
  record: ProductionTargetRow;
  progressPercent: number;
  onBack: () => void;
}

const STATUS_COLOR: Record<string, { bg: string; fg: string; border: string }> = {
  Planned: { bg: 'rgba(99, 102, 241, 0.25)', fg: '#e0e7ff', border: 'rgba(199, 210, 254, 0.4)' },
  'Waiting for Stock': { bg: 'rgba(239, 68, 68, 0.25)', fg: '#fecaca', border: 'rgba(254, 202, 202, 0.4)' },
  'In Progress': { bg: 'rgba(14, 165, 233, 0.25)', fg: '#bae6fd', border: 'rgba(186, 230, 253, 0.4)' },
  Completed: { bg: 'rgba(16, 185, 129, 0.28)', fg: '#a7f3d0', border: 'rgba(167, 243, 208, 0.4)' },
};

function statusPalette(status: string) {
  return STATUS_COLOR[status] ?? { bg: 'rgba(255, 255, 255, 0.18)', fg: '#ffffff', border: 'rgba(255, 255, 255, 0.3)' };
}

/**
 * ProgressDonut — lightweight SVG circular progress ring.
 */
function ProgressDonut({ value, size = 80 }: { value: number; size?: number }) {
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
          stroke="rgba(255, 255, 255, 0.2)"
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
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
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
        px: { xs: 2.5, sm: 3.5, md: 4 },
        py: { xs: 2.5, sm: 3, md: 3.5 },
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
        color: '#fff',
        boxShadow: '0 10px 30px -5px rgba(30, 58, 138, 0.35)',
      }}
    >
      {/* Decorative ambient glowing circles */}
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          right: -40,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -80,
          left: '30%',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
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
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.22)',
                transform: 'translateX(-2px)',
              },
              transition: 'all 0.2s ease',
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
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.65rem' },
                  letterSpacing: '-0.01em',
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
                  backdropFilter: 'blur(8px)',
                  px: 0.5,
                }}
              />
            </Stack>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255, 255, 255, 0.85)', mt: 0.5, fontWeight: 500 }}
            >
              Production Overview
            </Typography>
            {record.notes && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  display: 'block',
                  mt: 0.5,
                  maxWidth: 540,
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

        <Box sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
          <ProgressDonut value={progressPercent} size={78} />
        </Box>
      </Stack>
    </Paper>
  );
}

