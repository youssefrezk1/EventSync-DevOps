'use client';

import React from 'react';
import { Card, Typography, Box, Button, Avatar, Divider } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';

interface EventBookingCardProps {
  title: string;
  startDateTime: Date;
  endDateTime?: Date;
  location: string;
  professorName: string;
  faculty: string;
  price?: number;
  currency?: string;
  onBookNow?: () => void;
  disabled?: boolean;
  buttonText?: string;
}

const EventBookingCard: React.FC<EventBookingCardProps> = ({
  title,
  startDateTime,
  endDateTime,
  location,
  professorName,
  faculty,
  price,
  currency = 'USD',
  onBookNow,
  disabled = false,
  buttonText = 'Book Now',
}) => {
  const formatTime = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDateTimeDisplay = (): string => {
    if (!startDateTime || isNaN(startDateTime.getTime())) {
      return 'Date TBA';
    }

    const startDay = startDateTime.getDate();
    const startMonth = startDateTime
      .toLocaleDateString('en-US', { month: 'short' })
      .toUpperCase();
    const startTime = formatTime(startDateTime);

    if (endDateTime && !isNaN(endDateTime.getTime())) {
      const endDay = endDateTime.getDate();
      const endMonth = endDateTime
        .toLocaleDateString('en-US', { month: 'short' })
        .toUpperCase();
      const endTime = formatTime(endDateTime);

      if (startMonth === endMonth && startDay === endDay) {
        return `${startDay} ${startMonth} | ${startTime} - ${endTime}`;
      } else if (startMonth === endMonth) {
        return `${startDay}-${endDay} ${startMonth} | ${startTime} - ${endTime}`;
      } else {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} | ${startTime} - ${endTime}`;
      }
    }

    return `${startDay} ${startMonth} | ${startTime}`;
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        bgcolor: 'white',
        width: '100%',
        maxWidth: 850,
        border: '1px solid #e2e8f0',
        boxShadow: 'none',
        mx: 'auto',
      }}
    >
      <Box sx={{ p: 4 }}>
        {/* Title */}
        <Typography
          sx={{
            fontSize: { xs: 24, md: 28 },
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#0f172a',
            mb: 3,
            letterSpacing: '-0.5px',
          }}
        >
          {title}
        </Typography>

        {/* Date & Location */}
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
              <CalendarTodayIcon sx={{ color: '#64748b', fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#475569' }}>
              {getDateTimeDisplay()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              <LocationOnIcon sx={{ color: '#64748b', fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#475569' }}>
              {location}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Organizer & Faculty */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: '#64748b',
                mb: 1.5,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Organized by
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: '#1e293b',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {getInitials(professorName)}
              </Avatar>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                {professorName}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: '#64748b',
                mb: 1.5,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Faculty
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #e2e8f0',
                }}
              >
                <SchoolIcon sx={{ color: '#64748b', fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                {faculty}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Budget (if provided) */}
        {price !== undefined && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#64748b',
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Budget
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: '#0f172a',
                      lineHeight: 1,
                    }}
                  >
                    ${price}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#64748b',
                    }}
                  >
                    {currency}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}

        {/* Button */}
        {onBookNow && (
          <Button
            variant="contained"
            onClick={onBookNow}
            disabled={disabled}
            fullWidth
            sx={{
              py: 2,
              borderRadius: 2,
              fontSize: 15,
              fontWeight: 600,
              textTransform: 'none',
              bgcolor: !disabled ? '#1e293b' : '#e2e8f0',
              color: !disabled ? 'white' : '#94a3b8',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: !disabled ? '#0f172a' : '#e2e8f0',
                boxShadow: 'none',
              },
              '&:disabled': {
                bgcolor: '#e2e8f0',
                color: '#94a3b8',
              },
            }}
          >
            {buttonText}
          </Button>
        )}
      </Box>
    </Card>
  );
};

export default EventBookingCard;