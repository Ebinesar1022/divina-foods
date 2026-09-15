import type { ReactNode } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { STAGES, stepState } from '../config/stages.config';
import type { StageKey, StageState } from '../types';

interface PipelineStepperProps {
  currentStageKey: StageKey;
  currentIndex: number;
  isFullyComplete: boolean;
  procurementSkipped: boolean;
  renderStageExtra?: (stageKey: StageKey) => ReactNode;
  // Lets clicking a stage's icon jump straight to that stage's tab (e.g.
  // Production Target -> Overview, MRP -> MRP, ...) instead of only being
  // able to switch tabs via the tab bar below the stepper.
  onStageClick?: (tabKey: string) => void;
}

const pulseAura = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.45), 0 4px 16px rgba(37, 99, 235, 0.35); }
  60%  { box-shadow: 0 0 0 12px rgba(37, 99, 235, 0), 0 4px 16px rgba(37, 99, 235, 0.35); }
  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0), 0 4px 16px rgba(37, 99, 235, 0.35); }
`;

const STATE_STYLES: Record<
  StageState,
  { bg: string; border: string; fg: string; shadow?: string }
> = {
  done: {
    bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    border: '#10b981',
    fg: '#059669',
    shadow: '0 4px 14px rgba(16, 185, 129, 0.20)',
  },
  active: {
    bg: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    border: '#2563eb',
    fg: '#ffffff',
    shadow: '0 6px 20px rgba(37, 99, 235, 0.38)',
  },
  pending: {
    bg: 'rgba(255, 255, 255, 0.85)',
    border: '#e2e8f0',
    fg: '#94a3b8',
    shadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
  },
  skipped: {
    bg: 'rgba(248, 250, 252, 0.85)',
    border: '#cbd5e1',
    fg: '#94a3b8',
    shadow: 'none',
  },
};

export default function PipelineStepper({
  currentIndex,
  isFullyComplete,
  procurementSkipped,
  renderStageExtra,
  onStageClick,
}: PipelineStepperProps) {
  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        py: { xs: 1.5, sm: 2.25 },
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
          minWidth: { xs: 600, md: '100%' },
          width: '100%',
        }}
      >
        {STAGES.map((stage, index) => {
          const state = stepState(index, currentIndex, isFullyComplete, procurementSkipped);
          const styles = STATE_STYLES[state];
          const isDone = state === 'done';
          const isActive = state === 'active';
          const StageIcon = stage.icon;

          // Connector between (index - 1) and index
          const prevStageState =
            index > 0
              ? stepState(index - 1, currentIndex, isFullyComplete, procurementSkipped)
              : null;
          const leftConnectorSkipped = state === 'skipped';
          const leftConnectorDone = prevStageState === 'done';

          // Connector between index and (index + 1)
          const nextStageState =
            index < STAGES.length - 1
              ? stepState(index + 1, currentIndex, isFullyComplete, procurementSkipped)
              : null;
          const rightConnectorSkipped = nextStageState === 'skipped';
          const rightConnectorDone = state === 'done';

          return (
            <Box
              key={stage.key}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 0,
              }}
            >
              {/* Row with Left Half-Connector, Centered Circle, and Right Half-Connector */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  position: 'relative',
                }}
              >
                {/* Left Half Connector */}
                <Box
                  sx={{
                    flex: 1,
                    height: 3.5,
                    borderRadius: '999px 0 0 999px',
                    visibility: index === 0 ? 'hidden' : 'visible',
                    ...(leftConnectorSkipped
                      ? {
                          backgroundImage:
                            'repeating-linear-gradient(to right, #cbd5e1 0 6px, transparent 6px 12px)',
                          bgcolor: 'transparent',
                        }
                      : {
                          bgcolor: leftConnectorDone ? '#10b981' : '#e2e8f0',
                          boxShadow: leftConnectorDone ? '0 0 6px rgba(16, 185, 129, 0.3)' : 'none',
                        }),
                    transition: 'all 0.3s ease',
                  }}
                />

                {/* Main Node with Top-Right Completed Badge */}
                <Box sx={{ position: 'relative', flexShrink: 0, zIndex: 2 }}>
                  <Box
                    onClick={onStageClick ? () => onStageClick(stage.tabKey) : undefined}
                    role={onStageClick ? 'button' : undefined}
                    tabIndex={onStageClick ? 0 : undefined}
                    onKeyDown={
                      onStageClick
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onStageClick(stage.tabKey);
                            }
                          }
                        : undefined
                    }
                    aria-label={onStageClick ? `Go to ${stage.label}` : undefined}
                    sx={{
                      width: { xs: 48, sm: 52 },
                      height: { xs: 48, sm: 52 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: styles.bg,
                      border: `2.5px solid ${styles.border}`,
                      boxShadow: styles.shadow,
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease',
                      transform: isActive ? 'scale(1.12)' : 'scale(1)',
                      animation: isActive ? `${pulseAura} 2.2s infinite` : 'none',
                      opacity: state === 'skipped' ? 0.65 : 1,
                      cursor: onStageClick ? 'pointer' : 'default',
                      outline: 'none',
                      '&:hover': {
                        transform: isActive ? 'scale(1.16)' : 'scale(1.08) translateY(-2px)',
                        boxShadow: isActive
                          ? '0 8px 24px rgba(37, 99, 235, 0.45)'
                          : '0 6px 18px rgba(15, 23, 42, 0.12)',
                      },
                      '&:focus-visible': onStageClick
                        ? { boxShadow: `0 0 0 3px rgba(37, 99, 235, 0.35), ${styles.shadow || 'none'}` }
                        : undefined,
                    }}
                  >
                    <StageIcon
                      sx={{
                        color: styles.fg,
                        fontSize: { xs: 22, sm: 25 },
                      }}
                    />
                  </Box>

                  {/* Top-Right Completed Badge */}
                  {isDone && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -3,
                        right: -3,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: '#10b981',
                        border: '2px solid #ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.45)',
                        zIndex: 3,
                        animation: 'fadeIn 0.3s ease-in-out',
                      }}
                    >
                      <CheckIcon sx={{ color: '#ffffff', fontSize: 13, stroke: '#ffffff', strokeWidth: 0.5 }} />
                    </Box>
                  )}
                </Box>

                {/* Right Half Connector */}
                <Box
                  sx={{
                    flex: 1,
                    height: 3.5,
                    borderRadius: '0 999px 999px 0',
                    visibility: index === STAGES.length - 1 ? 'hidden' : 'visible',
                    ...(rightConnectorSkipped
                      ? {
                          backgroundImage:
                            'repeating-linear-gradient(to right, #cbd5e1 0 6px, transparent 6px 12px)',
                          bgcolor: 'transparent',
                        }
                      : {
                          bgcolor: rightConnectorDone ? '#10b981' : '#e2e8f0',
                          boxShadow: rightConnectorDone ? '0 0 6px rgba(16, 185, 129, 0.3)' : 'none',
                        }),
                    transition: 'all 0.3s ease',
                  }}
                />
              </Box>

              {/* Label — Centered Under Node */}
              <Box
                sx={{
                  textAlign: 'center',
                  mt: 1.5,
                  px: 0.5,
                  width: '100%',
                  maxWidth: 145,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    fontWeight: isActive ? 800 : isDone ? 700 : 600,
                    fontSize: { xs: 11.5, sm: 12.5 },
                    lineHeight: 1.3,
                    color: isActive
                      ? '#2563eb'
                      : isDone
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
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontStyle: 'italic',
                      fontSize: 10,
                      mt: 0.25,
                    }}
                  >
                    Skipped — In Stock
                  </Typography>
                )}
                {renderStageExtra && (
                  <Box sx={{ mt: 1 }}>{renderStageExtra(stage.key)}</Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

