import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
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
  { bg: string; border: string; fg: string; connector: string; shadow?: string }
> = {
  done: {
    bg: '#ecfdf5',
    border: '#10b981',
    fg: '#059669',
    connector: '#10b981',
    shadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
  },
  active: {
    bg: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    border: '#2563eb',
    fg: '#ffffff',
    connector: '#e2e8f0',
    shadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
  },
  pending: {
    bg: '#ffffff',
    border: '#e2e8f0',
    fg: '#94a3b8',
    connector: '#e2e8f0',
    shadow: '0 2px 4px rgba(15, 23, 42, 0.02)',
  },
  skipped: {
    bg: '#f8fafc',
    border: '#cbd5e1',
    fg: '#94a3b8',
    connector: '#cbd5e1',
    shadow: 'none',
  },
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
        width: '100%',
        overflowX: 'auto',
        py: { xs: 1.5, sm: 2 },
        px: { xs: 1, sm: 2 },
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'rgba(148, 163, 184, 0.3)',
          borderRadius: '999px',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          minWidth: { xs: 580, md: '100%' },
          width: '100%',
        }}
      >
        {STAGES.map((stage, index) => {
          const state = stepState(index, currentIndex, isFullyComplete, procurementSkipped);
          const styles = STATE_STYLES[state];
          const isLast = index === STAGES.length - 1;
          const isDone = state === 'done';

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
                {/* Main Node with Top-Right Completed Badge */}
                <Box sx={{ position: 'relative', flexShrink: 0, mx: 'auto' }}>
                  <Box
                    sx={{
                      width: { xs: 46, sm: 50 },
                      height: { xs: 46, sm: 50 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: styles.bg,
                      border: `2.5px solid ${styles.border}`,
                      boxShadow: styles.shadow,
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                      transform: state === 'active' ? 'scale(1.1)' : 'scale(1)',
                      animation: state === 'active' ? `${pulse} 2s infinite` : 'none',
                      opacity: state === 'skipped' ? 0.65 : 1,
                    }}
                  >
                    <StageIcon
                      iconName={stage.iconName}
                      sx={{
                        color: styles.fg,
                        fontSize: { xs: 22, sm: 24 },
                      }}
                    />
                  </Box>

                  {/* Top-Right Badge: Only shown if state === 'done' */}
                  {isDone && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -3,
                        right: -3,
                        width: 19,
                        height: 19,
                        borderRadius: '50%',
                        bgcolor: '#10b981',
                        border: '2px solid #ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)',
                        zIndex: 2,
                        animation: 'fadeIn 0.3s ease-in-out',
                      }}
                    >
                      <CheckIcon sx={{ color: '#ffffff', fontSize: 13, stroke: '#ffffff', strokeWidth: 0.5 }} />
                    </Box>
                  )}
                </Box>

                {/* Connector Line between stages */}
                {!isLast && (
                  <Box
                    sx={{
                      flex: 1,
                      height: 3,
                      mx: { xs: 0.5, sm: 1 },
                      bgcolor: styles.connector,
                      borderRadius: '999px',
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
              <Box sx={{ textAlign: 'center', mt: 1.25, px: 0.5, maxWidth: 130 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: state === 'active' ? 700 : state === 'done' ? 700 : 600,
                    fontSize: { xs: 11.5, sm: 12 },
                    lineHeight: 1.3,
                    color:
                      state === 'active'
                        ? '#2563eb'
                        : state === 'done'
                        ? '#059669'
                        : state === 'skipped'
                        ? '#94a3b8'
                        : '#64748b',
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
                      fontSize: 10,
                      mt: 0.25,
                    }}
                  >
                    Skipped — In Stock
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

