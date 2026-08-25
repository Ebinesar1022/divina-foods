import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import * as Icons from '@mui/icons-material';
import { STAGES, stepState } from '../config/stages.config';
import type { StageKey, StageState } from '../types';

interface PipelineStepperProps {
  currentStageKey: StageKey;
  currentIndex: number;
  isFullyComplete: boolean;
  procurementSkipped: boolean;
}

const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.45); }
  70%  { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
`;

const STATE_STYLES: Record<
  StageState,
  { bg: string; border: string; fg: string; connector: string }
> = {
  done: { bg: '#10b981', border: '#10b981', fg: '#ffffff', connector: '#10b981' },
  active: { bg: '#2563eb', border: '#2563eb', fg: '#ffffff', connector: '#94a3b8' },
  pending: { bg: '#ffffff', border: '#cbd5e1', fg: '#94a3b8', connector: '#cbd5e1' },
  skipped: { bg: '#f1f5f9', border: '#cbd5e1', fg: '#94a3b8', connector: '#cbd5e1' },
};

function StageIcon({ iconName, sx }: { iconName: string; sx?: object }) {
  const IconComponent = (Icons as Record<string, React.ElementType>)[iconName];
  if (!IconComponent) return null;
  return <IconComponent sx={sx} />;
}

export default function PipelineStepper({
  // currentStageKey,
  currentIndex,
  isFullyComplete,
  procurementSkipped,
}: PipelineStepperProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        width: '100%',
        px: { xs: 1, md: 3 },
        py: 2,
      }}
    >
      {STAGES.map((stage, index) => {
        const state = stepState(index, currentIndex, isFullyComplete, procurementSkipped);
        const styles = STATE_STYLES[state];
        const isLast = index === STAGES.length - 1;

        return (
          <Box
            key={stage.key}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: isLast ? '0 0 auto' : 1,
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {/* Node */}
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: styles.bg,
                  border: `2px solid ${styles.border}`,
                  flexShrink: 0,
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  transform: state === 'active' ? 'scale(1.12)' : 'scale(1)',
                  animation: state === 'active' ? `${pulse} 1.8s infinite` : 'none',
                  opacity: state === 'skipped' ? 0.7 : 1,
                }}
              >
                {state === 'done' ? (
                  <CheckIcon sx={{ color: styles.fg, fontSize: 22 }} />
                ) : state === 'skipped' ? (
                  <RemoveIcon sx={{ color: styles.fg, fontSize: 20 }} />
                ) : (
                  <StageIcon iconName={stage.iconName} sx={{ color: styles.fg, fontSize: 22 }} />
                )}
              </Box>

              {/* Connector */}
              {!isLast && (
                <Box
                  sx={{
                    flex: 1,
                    height: 2,
                    mx: 0.5,
                    bgcolor: styles.connector,
                    ...(state === 'skipped'
                      ? {
                          backgroundImage:
                            'repeating-linear-gradient(to right, #cbd5e1 0 6px, transparent 6px 12px)',
                          bgcolor: 'transparent',
                        }
                      : {}),
                  }}
                />
              )}
            </Box>

            {/* Label */}
            <Box sx={{ textAlign: 'center', mt: 1, maxWidth: 120 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: state === 'active' ? 700 : 600,
                  color: state === 'active' ? '#2563eb' : state === 'done' ? '#10b981' : '#64748b',
                  fontStyle: state === 'skipped' ? 'italic' : 'normal',
                }}
              >
                {stage.label}
              </Typography>
              {state === 'skipped' && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: '#94a3b8',
                    fontStyle: 'italic',
                    fontSize: 10.5,
                    mt: 0.25,
                  }}
                >
                  Skipped — Stock Available
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
