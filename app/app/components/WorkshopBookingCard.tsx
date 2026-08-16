'use client';

import React from 'react';
import { Card, Typography, Box, Button } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

// EventBookingCard Component
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
}

const EventBookingCard: React.FC<EventBookingCardProps> = ({
  title,
  startDateTime,
  endDateTime,
  location,
  professorName,
  faculty,
  price = 100,
  currency = 'USD',
  onBookNow
}) => {
  const formatDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit'
    });
  };

  const formatTime = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDateTimeDisplay = (): string => {
    if (!startDateTime || isNaN(startDateTime.getTime())) {
      return 'Date TBA';
    }

    const startDay = startDateTime.getDate();
    const startMonth = startDateTime.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const startTime = formatTime(startDateTime);
    
    if (endDateTime && !isNaN(endDateTime.getTime())) {
      const endDay = endDateTime.getDate();
      const endMonth = endDateTime.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const endTime = formatTime(endDateTime);
      
      // Check if same month
      if (startMonth === endMonth) {
        return `${startDay}-${endDay} ${startMonth} | ${startTime} - ${endTime}`;
      } else {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} | ${startTime} - ${endTime}`;
      }
    }
    
    return `${startDay} ${startMonth} | ${startTime}`;
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        borderRadius: '16px',
        overflow: 'hidden',
        bgcolor: '#ffffff',
        width: '100%',
        maxWidth: 850,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        mx: 'auto',
        my: 3,
        border: '1px solid #e5e7eb',
      }}
    >
      {/* LEFT - Main Content */}
      <Box sx={{ flex: 1, p: 3, minWidth: 0 }}>
        {/* Title */}
        <Typography
          sx={{
            fontSize: { xs: 24, md: 28 },
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#000',
            mb: 2,
          }}
        >
          {title}
        </Typography>

        {/* Date and Time with icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CalendarTodayIcon 
            sx={{ 
              mr: 1, 
              fontSize: 18,
              color: '#000'
            }} 
          />
          <Typography
            sx={{
              fontSize: 14,
              color: '#6b7280',
            }}
          >
            {getDateTimeDisplay()}
          </Typography>
        </Box>

        {/* Book Now Button */}
        <Button
          variant="contained"
          onClick={onBookNow}
          sx={{
            bgcolor: '#000',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            py: 1.25,
            px: 4,
            borderRadius: '8px',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#1f2937',
            },
          }}
        >
          Book Now
        </Button>
      </Box>

      {/* RIGHT - Price and Details */}
      <Box
        sx={{
          width: { xs: '100%', md: 280 },
          bgcolor: '#fafafa',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderLeft: { xs: 'none', md: '1px solid #e5e7eb' },
          borderTop: { xs: '1px solid #e5e7eb', md: 'none' },
        }}
      >
        {/* Price */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 600,
              color: '#9ca3af',
              letterSpacing: '0.05em',
              mb: 0.5,
              textTransform: 'uppercase',
            }}
          >
            Ticket Price
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography
              sx={{
                fontSize: 36,
                fontWeight: 700,
                color: '#000',
                lineHeight: 1,
              }}
            >
              ${price}
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                color: '#6b7280',
                fontWeight: 500,
              }}
            >
              {currency}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 11,
              color: '#6b7280',
              mt: 0.5,
            }}
          >
            ✓ All fees included
          </Typography>
        </Box>

        {/* Organizer Details */}
        <Box>
          <Box sx={{ mb: 2.5 }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 600,
                color: '#9ca3af',
                letterSpacing: '0.05em',
                mb: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Organized by
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: '#1f2937',
              }}
            >
              {professorName}
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 600,
                color: '#9ca3af',
                letterSpacing: '0.05em',
                mb: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Faculty Responsible
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: '#1f2937',
              }}
            >
              {faculty}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

// EventInfoCard Component
interface EventInfoCardProps {
  registrationDeadline: Date;
  capacity: number;
  placesLeft: number;
}

const EventInfoCard: React.FC<EventInfoCardProps> = ({
  registrationDeadline,
  capacity,
  placesLeft
}) => {
  const formatDeadline = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return 'TBA';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getPlacesLeftColor = (): string => {
    const percentage = (placesLeft / capacity) * 100;
    if (percentage <= 20) return '#dc2626'; // Red
    if (percentage <= 50) return '#f59e0b'; // Orange
    return '#16a34a'; // Green
  };

  return (
    <Card
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        bgcolor: '#ffffff',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        mx: 'auto',
        my: 3,
        border: '1px solid #e5e7eb',
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Registration Deadline */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <EventAvailableIcon 
              sx={{ 
                mr: 1, 
                fontSize: 18,
                color: '#000'
              }} 
            />
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: '#9ca3af',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Registration Deadline
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: '#000',
              ml: 3.5,
            }}
          >
            {formatDeadline(registrationDeadline)}
          </Typography>
        </Box>

        {/* Capacity */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PeopleIcon 
              sx={{ 
                mr: 1, 
                fontSize: 18,
                color: '#000'
              }} 
            />
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: '#9ca3af',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Capacity
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: '#000',
              ml: 3.5,
            }}
          >
            {capacity} people
          </Typography>
        </Box>

        {/* Places Left */}
        <Box
          sx={{
            bgcolor: '#fafafa',
            p: 2.5,
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: '#9ca3af',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              mb: 1,
            }}
          >
            Places Left
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography
              sx={{
                fontSize: 36,
                fontWeight: 700,
                color: getPlacesLeftColor(),
                lineHeight: 1,
              }}
            >
              {placesLeft}
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                color: '#6b7280',
                fontWeight: 500,
              }}
            >
              / {capacity}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

// Events Page Component
const EventsPage: React.FC = () => {
  const handleBooking = (eventTitle: string) => {
    alert(`Booking: ${eventTitle}`);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)',
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          bgcolor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Box
          sx={{
            maxWidth: '1280px',
            mx: 'auto',
            px: 2,
            py: 3,
          }}
        >
          <Typography
            sx={{
              fontSize: 30,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            Upcoming Events
          </Typography>
          <Typography
            sx={{
              color: '#4b5563',
              mt: 1,
            }}
          >
            Book your spot for exclusive events
          </Typography>
        </Box>
      </Box>

      {/* Events List */}
      <Box
        component="main"
        sx={{
          maxWidth: '1280px',
          mx: 'auto',
          px: 2,
          py: 4,
        }}
      >
        {/* First Event - Side by Side */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 3,
            mb: 3,
          }}
        >
          <EventBookingCard
            title="Fatma Said"
            startDateTime={new Date('2024-12-05T21:00:00')}
            location="Grand Egyptian Museum"
            professorName="Professor Name"
            faculty="Dummy"
            price={100}
            currency="USD"
            onBookNow={() => handleBooking('Fatma Said')}
          />
          <EventInfoCard
            registrationDeadline={new Date('2024-12-01T23:59:59')}
            capacity={100}
            placesLeft={25}
          />
        </Box>

        {/* Second Event - Side by Side */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 3,
            mb: 3,
          }}
        >
          <EventBookingCard
            title="Workshop on Ancient Egypt"
            startDateTime={new Date('2024-12-10T14:00:00')}
            endDateTime={new Date('2024-12-10T17:00:00')}
            location="Cairo University"
            professorName="Dr. Ahmed Hassan"
            faculty="Archaeology Department"
            price={150}
            currency="USD"
            onBookNow={() => handleBooking('Workshop on Ancient Egypt')}
          />
          <EventInfoCard
            registrationDeadline={new Date('2024-12-08T23:59:59')}
            capacity={50}
            placesLeft={5}
          />
        </Box>

        {/* Third Event - Side by Side */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 3,
          }}
        >
          <EventBookingCard
            title="Modern Architecture Lecture"
            startDateTime={new Date('2024-12-15T10:00:00')}
            endDateTime={new Date('2024-12-15T12:00:00')}
            location="Engineering Faculty"
            professorName="Dr. Sara Mohamed"
            faculty="Architecture Department"
            price={75}
            currency="USD"
            onBookNow={() => handleBooking('Modern Architecture Lecture')}
          />
          <EventInfoCard
            registrationDeadline={new Date('2024-12-13T23:59:59')}
            capacity={80}
            placesLeft={60}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default EventsPage;