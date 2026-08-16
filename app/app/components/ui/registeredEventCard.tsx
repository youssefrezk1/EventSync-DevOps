"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  Typography,
} from "@mui/material";
import {
  CalendarToday,
  LocationOn,
  AccessTime,
  People,
  AttachMoney,
  Event as EventIcon,
  School,
  Store,
  Flight,
  Storefront,
  Group,
  CheckCircle,
  Schedule,
} from "@mui/icons-material";
import Link from "next/link";
import type { ReactElement } from "react";

interface EventCardProps {
  event: any;
  status?: "Past" | "Upcoming";
  onViewDetails?: (event: any) => void;
}

const eventTypeColors: Record<string, string> = {
  workshop: "#dbbbe2ff",
  workshops: "#dbbbe2ff",
  bazaar: "#7d90c2ff",
  bazaars: "#7d90c2ff",
  trip: "#eabfbfff",
  trips: "#eabfbfff",
  conference: "#e1daceff",
  conferences: "#e1daceff",
  booth: "#ace6d7ff",
  booths: "#ace6d7ff",
};

const eventTypeIcons: Record<string, ReactElement> = {
  workshop: <School />,
  workshops: <School />,
  bazaar: <Store />,
  bazaars: <Store />,
  trip: <Flight />,
  trips: <Flight />,
  conference: <Group />,
  conferences: <Group />,
  booth: <Storefront />,
  booths: <Storefront />,
};

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  status = "Upcoming",
  onViewDetails
}) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatTimeRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const formatTime = (date: Date) => {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
      
      return minutes === 0 ? `${hours} ${ampm}` : `${hours}:${minutesStr} ${ampm}`;
    };

    return `${formatTime(startDate)} - ${formatTime(endDate)}`;
  };

  const timeDisplay = event.start && event.end 
    ? formatTimeRange(event.start, event.end)
    : event.time || "Time not specified";

  const eventTypeColor = eventTypeColors[event.type?.toLowerCase()] || "#757575";
  const eventIcon = eventTypeIcons[event.type?.toLowerCase()] || <EventIcon />;

  // Determine the correct route based on event type
  const getEventRoute = () => {
    console.log(event);
    const type = event.type?.toLowerCase();
    return `/${type}/${event.eventID}`;
  };

  return (
    <Card
      sx={{
        width: 350,
        height: 280,
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s",
        "&:hover": {
          boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          transform: "translateY(-4px)",
        },
        overflow: "hidden",
        position: "relative",
        background: "white",
        border: "2px dashed",
        borderColor: "divider",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "6px",
          background: eventTypeColor,
        },
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          p: 2.5,
          pb: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header with Badge and Icon */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Chip
                label={
                  event.type?.charAt(0).toUpperCase() + event.type?.slice(1) || "Event"
                }
                size="small"
                sx={{
                  backgroundColor: `${eventTypeColor}12`,
                  color: "black",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  height: 22,
                  borderRadius: 2,
                }}
              />
            </Box>
            <Typography
              variant="h6"
              fontWeight={700}
              color="#000000"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                fontSize: "1.05rem",
                lineHeight: 1.3,
              }}
            >
              {event.name || "Event Name"}
            </Typography>
          </Box>

          {/* Icon - Top Right */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: eventTypeColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              flexShrink: 0,
              fontSize: "1.3rem",
            }}
          >
            {eventIcon}
          </Box>
        </Box>

        {/* Location */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1.5,
            p: 1.2,
            backgroundColor: "grey.50",
            borderRadius: 2,
          }}
        >
          <LocationOn
            sx={{
              fontSize: "1.1rem",
              color: eventTypeColor,
            }}
          />
          <Typography
            variant="body2"
            color="text.primary"
            fontWeight={500}
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {event.location || "Location not specified"}
          </Typography>
        </Box>

        {/* Event Details */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
            mb: 1.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <CalendarToday
              sx={{
                fontSize: "1rem",
                color: "text.secondary",
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {event.start ? formatDate(event.start) : "Date not specified"}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <AccessTime
              sx={{
                fontSize: "1rem",
                color: "text.secondary",
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {timeDisplay}
            </Typography>
          </Box>

          {event.capacity && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <People
                sx={{
                  fontSize: "1rem",
                  color: "text.secondary",
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {event.capacity} spots
              </Typography>
            </Box>
          )}

          {event.price && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <AttachMoney
                sx={{
                  fontSize: "1rem",
                  color: eventTypeColor,
                }}
              />
              <Typography variant="body2" fontWeight={700} color={eventTypeColor}>
                {event.price}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Organizer */}
        {event.ProfCreator && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: `${eventTypeColor}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: eventTypeColor,
              }}
            >
              {event.ProfCreator.firstName?.charAt(0) || "F"}
              {event.ProfCreator.lastName?.charAt(0) || "L"}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {event.ProfCreator.firstName || "First"} {event.ProfCreator.lastName || "Last"}
            </Typography>
          </Box>
        )}

        {/* Spacer to push button to bottom */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Button - Bottom Right with Link */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Link
            href={getEventRoute()}
            style={{ textDecoration: "none", width: "100%" }}
          >
            <Button
              variant="outlined"
              fullWidth
              sx={{
                bgcolor: eventTypeColor,
                
                height: 30,
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 3,
                "&:hover": {
                  backgroundColor: `${eventTypeColor}cc`,
                  color: "black",
                },
              }}
            >
             Ticket Details
            </Button>
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};