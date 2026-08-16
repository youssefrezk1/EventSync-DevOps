'use client';

import React from 'react';
import { Card, Typography, Box, LinearProgress, Divider } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

interface EventInfoCardProps {
  registrationDeadline: Date;
  capacity: number;
  placesLeft: number;
}

const EventInfoCard: React.FC<EventInfoCardProps> = ({
  registrationDeadline,
  capacity,
  placesLeft,
}) => {
  const formatDeadline = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return 'TBA';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const getPlacesLeftColor = (): string => {
    const percentage = (placesLeft / capacity) * 100;
    if (percentage <= 20) return '#dc2626';
    if (percentage <= 50) return '#f59e0b';
    return '#16a34a';
  };

  const getPercentageFilled = (): number => {
    return ((capacity - placesLeft) / capacity) * 100;
  };

  return (
    <Card
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        bgcolor: 'white',
        width: '100%',
        maxWidth: 400,
        border: '1px solid #e2e8f0',
        boxShadow: 'none',
        mx: 'auto',
      }}
    >
      <Box sx={{ p: 4 }}>
        {/* Registration Deadline */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e2e8f0',
              }}
            >
              <EventAvailableIcon sx={{ color: '#64748b', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Registration Deadline
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#0f172a',
                  mt: 0.5,
                }}
              >
                {formatDeadline(registrationDeadline)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Capacity */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e2e8f0',
              }}
            >
              <PeopleIcon sx={{ color: '#64748b', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Total Capacity
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#0f172a',
                  mt: 0.5,
                }}
              >
                {capacity} People
              </Typography>
            </Box>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
                {capacity - placesLeft} Registered
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
                {Math.round(getPercentageFilled())}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getPercentageFilled()}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#f1f5f9',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#475569',
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Places Left */}
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 2,
            }}
          >
            Places Available
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2 }}>
            <Typography
              sx={{
                fontSize: 48,
                fontWeight: 700,
                color: getPlacesLeftColor(),
                lineHeight: 1,
                letterSpacing: '-2px',
              }}
            >
              {placesLeft}
            </Typography>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 500,
                color: '#94a3b8',
              }}
            >
              / {capacity}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: getPlacesLeftColor(),
              }}
            />
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: '#64748b',
              }}
            >
              {placesLeft === 0
                ? 'Fully Booked'
                : placesLeft <= capacity * 0.2
                ? 'Filling Fast'
                : placesLeft <= capacity * 0.5
                ? 'Limited Spots'
                : 'Open for Registration'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default EventInfoCard;