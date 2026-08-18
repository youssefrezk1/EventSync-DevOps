"use client";

import { useState, useEffect, Suspense } from "react";
import { 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Divider,
  Grid
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Event as EventIcon, 
  School, 
  Store, 
  Flight, 
  Storefront,
  CalendarToday,
  LocationOn,
  AccessTime,
  People,
  AttachMoney,
  Group
} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { SportsFootball, EventAvailable, LocalOffer } from "@mui/icons-material";
import { useEvents, Event, SearchFilters } from "../../../shared/services";
import WorkshopView from "../../../shared/components/WorkshopView";
import TripView from "../../../shared/components/TripView";
import BazaarView from "../../../shared/components/BazaarView";
import ConferenceView from "../../../shared/components/ConferenceView";
import BoothView from "../../../shared/components/BoothView";
import { Vote } from "lucide-react";
import Link from "next/link";
import BoothDetailsDialog from '../../../shared/components/BoothDetailsDialog';
import { FavoriteButton } from "../../../shared/components/FavoriteButton";
import { useFavorites } from "../../../shared/hooks/useFavorites";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/staff" },
  {
    text: "Events",
    icon: <EventIcon />,
    href: "/dashboards/staff/events",
  },
  {
    text: "Registered events",
    icon: <EventAvailable />,
    href: "/dashboards/staff/registeredEvents",
  },
  {
    text: "Gym",
    icon: <FitnessCenterIcon />,
    href: "/dashboards/staff/gym",
  },
  {text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/staff/loyaltyProgram"},
];

const eventTypes = [
  { value: 'all', label: 'All Events', icon: <EventIcon /> },
  { value: 'workshops', label: 'Workshops', icon: <School /> },
  { value: 'trips', label: 'Trips', icon: <Flight /> },
  { value: 'bazaars', label: 'Bazaars', icon: <Store /> },
  { value: 'conferences', label: 'Conferences', icon: <Group /> },
  { value: 'booths', label: 'Booths', icon: <Storefront /> },
];

function EventPageContent() {
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    location: '',
    date: '',
    type: '',
    faculty:'',
    sortBy: 'start',
    sortOrder: 'asc'
  });
  const [displayedEventsCount, setDisplayedEventsCount] = useState(6);
  const searchParams = useSearchParams();

  // Handle URL parameters
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setSelectedEventType(typeParam);
      setFilters(prev => ({ ...prev, type: typeParam }));
    }
  }, [searchParams]);

  const { events, loading, error, fetchEvents } = useEvents(
    selectedEventType === 'all' ? undefined : selectedEventType
  );

  useEffect(() => {
    fetchEvents(filters);
    setDisplayedEventsCount(6);
  }, [selectedEventType, filters]);

  const handleEventTypeChange = (value: string) => {
    setSelectedEventType(value);
    
    // Update URL to reflect the current filter
    const url = new URL(window.location.href);
    if (value === 'all') {
      url.searchParams.delete('type');
    } else {
      url.searchParams.set('type', value);
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleLoadMore = () => {
    setDisplayedEventsCount((prev) => prev + 6);
  };

  // Add these after your other useState declarations
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null);
  
  // Add these handler functions
  const handleOpenDetails = (event: Event) => {
    setDetailsEvent(event);
    setOpenDetails(true);
  };
  
  const handleCloseDetails = () => {
    setOpenDetails(false);
    setDetailsEvent(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getEventIcon = (eventType: string) => {
    const iconMap = {
      trip: <Flight />,
      trips: <Flight />,
      workshop: <School />,
      workshops: <School />,
      bazaar: <Store />,
      bazaars: <Store />,
      conference: <Group />,
      conferences: <Group />,
      booth: <Storefront />,
      booths: <Storefront />,
    };
    return iconMap[eventType as keyof typeof iconMap] || <EventIcon />;
  };

  // Registration dialog state
  const [openRegister, setOpenRegister] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({ Name: '', Email: '', StudentID: '' });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('');

  const { isFavorited, toggleFavorite } = useFavorites();

  const handleOpenRegister = (event: Event, type: 'workshop' | 'trip') => {
    setSelectedEvent(event);
    setFormData({ Name: '', Email: '', StudentID: '' });
    setStatusMsg({ type: '', text: '' });
    setOpenRegister(true);

    // Set the correct API endpoint
    setApiEndpoint(
      type === 'workshop'
        ? `/api/workshops/${event._id}/register`
        : `/api/trips/${event._id}/register`
    );
  };

  const handleCloseRegister = () => {
    setOpenRegister(false);
    setSelectedEvent(null);
    setStatusMsg({ type: '', text: '' });
  };

  const handleSubmitRegister = async () => {
    if (!selectedEvent) return;
    setSubmitting(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      setStatusMsg({ type: 'success', text: 'Registered successfully!' });
      setTimeout(() => {
        handleCloseRegister();
        fetchEvents(filters);
      }, 1500);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const displayedEvents = events.slice(0, displayedEventsCount);
  const hasMoreEvents = displayedEventsCount < events.length;

  return (
    <BasicLayout menuItems={menuItems}>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          mb: 4,
          backgroundColor: "rgba(249, 247, 243, 1)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
            height: 400,
          }}
        >
          {/* Left Content Section */}
          <Box
            sx={{
              flex: "0 0 45%",
              px: 6,
              py: 5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box display={"flex"} gap={0.5}>
              <Box>
                <Typography
                  variant="h1"
                  fontWeight={800}
                  color="primary.main"
                  sx={{
                    mb: 2,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  Upcoming Events
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="body1"
              color="primary.main"
              sx={{
                mb: 4,
                fontWeight: 400,
                lineHeight: 1.7,
                maxWidth: 440,
              }}
            >
              Track and manage your upcoming workshops, trips, conferences, and
              bazaars all in one convenient place.
            </Typography>

            {/* Stats Row */}
            <Box
              sx={{
                display: "flex",
                gap: 4,
                mb: 4,
              }}
            >
              <Box>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color="primary.main"
                  sx={{ lineHeight: 1, mb: 0.5 }}
                >
                  {events.length}
                </Typography>
                <Typography
                  variant="body2"
                  color="primary.main"
                  sx={{ fontSize: "0.875rem" }}
                >
                  Total Events
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color="primary.main"
                  sx={{ lineHeight: 1, mb: 0.5 }}
                >
                  5
                </Typography>
                <Typography
                  variant="body2"
                  color="primary.main"
                  sx={{ fontSize: "0.875rem" }}
                >
                  Categories
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right Image Grid Section */}
          <Box
            sx={{
              flex: "0 0 55%",
              display: "flex",
              gap: 2,
              p: 3,
              alignItems: "stretch",
            }}
          >
            {/* Left Column - Conference (Large) */}
            <Box
              sx={{
                flex: "0 0 48%",
                position: "relative",
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              }}
            >
              <Box
                component="img"
                src="/images/conference.jpg"
                alt="Conference"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 2.5,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                }}
              >
                <Typography variant="subtitle1" color="white" fontWeight={600}>
                  Conferences
                </Typography>
              </Box>
            </Box>

            {/* Right Column - 3 Images Stacked */}
            <Box
              sx={{
                flex: "0 0 48%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {/* Trip Image */}
              <Box
                sx={{
                  flex: 1,
                  position: "relative",
                  borderRadius: 3,
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                }}
              >
                <Box
                  component="img"
                  src="/images/trip.webp"
                  alt="Trip"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 1.5,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                  }}
                >
                  <Typography variant="body2" color="white" fontWeight={600}>
                    Trips
                  </Typography>
                </Box>
              </Box>

              {/* Workshop Image */}
              <Box
                sx={{
                  flex: 1,
                  position: "relative",
                  borderRadius: 3,
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                }}
              >
                <Box
                  component="img"
                  src="/images/workshop.jpeg"
                  alt="workshop"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 1.5,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                  }}
                >
                  <Typography variant="body2" color="white" fontWeight={600}>
                    Workshops
                  </Typography>
                </Box>
              </Box>

              {/* Bazaar Image */}
              <Box
                sx={{
                  flex: 1,
                  position: "relative",
                  borderRadius: 3,
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                }}
              >
                <Box
                  component="img"
                  src="/images/bazaar.jpg"
                  alt="Bazaar"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 1.5,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                  }}
                >
                  <Typography variant="body2" color="white" fontWeight={600}>
                    Bazaars
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Tabs Section - Full Width */}
      <Box
        sx={{
          backgroundColor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          mb: 3,
          mt: 3,
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 0,
            width: "100%",
            justifyContent: "center",
            overflowX: "auto",
            "&::-webkit-scrollbar": {
              height: 6,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: 3,
            },
          }}
        >
          {eventTypes.map((type) => (
            <Button
              key={type.value}
              onClick={() => handleEventTypeChange(type.value)}
              sx={{
                py: 1.5,
                px: 3,
                flex: 1,
                borderRadius: 0,
                borderBottom: 3,
                borderColor:
                  selectedEventType === type.value
                    ? "primary.main"
                    : "transparent",
                color:
                  selectedEventType === type.value
                    ? "primary.main"
                    : "text.secondary",
                fontWeight: selectedEventType === type.value ? 600 : 400,
                textTransform: "none",
                fontSize: "0.9rem",
                transition: "all 0.3s",
                "&:hover": {
                  backgroundColor: "action.hover",
                  borderColor:
                    selectedEventType === type.value
                      ? "primary.main"
                      : "action.hover",
                },
                display: "flex",
                gap: 0.8,
                alignItems: "center",
              }}
            >
              {type.icon}
              {type.label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Filters Sidebar and Content */}
      {selectedEventType === "all" && (
        <Box sx={{ display: "flex", gap: 3 }}>
          {/* Left Sidebar - Filters */}
          <Paper
            sx={{
              width: 280,
              flexShrink: 0,
              p: 3,
              borderRadius: 2,
              height: "fit-content",
              position: "sticky",
              top: 20,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Filters
              </Typography>
              <Button
                size="small"
                onClick={() =>
                  setFilters({
                    search: "",
                    location: "",
                    date: "",
                    type: "",
                    faculty: "",
                    sortBy: "start",
                    sortOrder: "asc",
                  })
                }
                sx={{ textTransform: "none", fontSize: "0.85rem" }}
              >
                Clear All
              </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Location */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} mb={2}>
                Location
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter location"
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Date */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} mb={2}>
                Date
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Sort By */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} mb={2}>
                Sort By
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="start">Date</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Sort Order */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={2}>
                Order
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.sortOrder}
                  onChange={(e) =>
                    handleFilterChange("sortOrder", e.target.value)
                  }
                  displayEmpty
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Right Content Area */}
          <Box sx={{ flex: 1 }}>
            {/* Search Bar and Count */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Paper
                sx={{
                  flex: 1,
                  borderRadius: 8,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Search events..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search
                          sx={{
                            color: "text.secondary",
                            fontSize: "1.2rem",
                            ml: 0.5,
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 8,
                      height: 42,
                      "& fieldset": {
                        border: "none",
                      },
                      "& input": {
                        padding: "0",
                        fontSize: "0.9rem",
                      },
                    },
                  }}
                />
              </Paper>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "nowrap" }}
              >
                ({events.length} events)
              </Typography>
            </Box>

            {/* Loading, Error, Empty States */}
            {loading && (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                mt={5}
              >
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {!loading && !error && events.length === 0 && (
              <Typography color="text.secondary" mt={3} textAlign="center">
                No events available.
              </Typography>
            )}

            {!loading && !error && events.length > 0 && (
              <>
                <Grid container spacing={3}>
                  {displayedEvents.map((event) => {
                    const eventTypeColor =
                      {
                        trip: "#eabfbfff",
                        workshop: "#dbbbe2ff",
                        bazaar: "#7d90c2ff",
                        conference: "#e1daceff",
                        booth: "#ace6d7ff",
                      }[event.eventType] || "#757575";

                    return (
                      <Grid size={{xs: 12, sm: 12, md: 6}} key={event._id}>
                        <Card
                          sx={{
                            width: 360,
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
                                <Chip
                                  label={
                                    event.eventType.charAt(0).toUpperCase() +
                                    event.eventType.slice(1)
                                  }
                                  size="small"
                                  sx={{
                                    backgroundColor: `${eventTypeColor}12`,
                                    color: "black",
                                    fontWeight: 600,
                                    fontSize: "0.7rem",
                                    height: 22,
                                    borderRadius: 2,
                                    mb: 0.5,
                                  }}
                                />
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
                                  {event.name}
                                </Typography>
                              </Box>

                              {/* Icon - Top Right */}
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: "50%",
                                  backgroundColor: `${eventTypeColor}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  flexShrink: 0,
                                  fontSize: "1.3rem",
                                }}
                              >
                                {getEventIcon(event.eventType)}
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
                                {event.location}
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
                                <EventIcon
                                  sx={{
                                    fontSize: "1rem",
                                    color: "text.secondary",
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {formatDate(event.start)}
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
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {formatTime(event.time)}
                                </Typography>
                              </Box>

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
                                  <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    color={eventTypeColor}
                                  >
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
                                  {event.ProfCreator.firstName.charAt(0)}
                                  {event.ProfCreator.lastName.charAt(0)}
                                </Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {event.ProfCreator.firstName}{" "}
                                  {event.ProfCreator.lastName}
                                </Typography>
                              </Box>
                            )}

                            {/* Spacer to push button to bottom */}
                            <Box sx={{ flexGrow: 1 }} />

                            {/* Button - Bottom Right with Fixed Size */}
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                              }}
                            >
                              <FavoriteButton
                                eventId={event._id}
                                eventType={event.eventType}
                                isFavorited={isFavorited(event._id)}
                                onToggle={toggleFavorite}
                                size="small"
                              />
                              <Link 
                                href={
                                  event.eventType === 'workshop' ? `/workshop/${event._id}` :
                                  event.eventType === 'trip' ? `/trip/${event._id}` :
                                  event.eventType === 'bazaar' ? `/bazaar/${event._id}` :
                                  event.eventType === 'conference' ? `/confrence/${event._id}` :
                                  event.eventType === 'booth' ? '#' :
                                  '#'
                                }
                                onClick={(e) => { if (event.eventType === 'booth') {e.preventDefault();}}}
                                style={{ textDecoration: 'none', flex: 1,...(event.eventType === 'booth' && { cursor: 'default' }) }}
                              >
                                <Button
                                  onClick={event.eventType === 'booth' ? () => handleOpenDetails(event) : undefined}
                                  variant="outlined"
                                  fullWidth
                                  sx={{
                                    bgcolor: eventTypeColor,
                                    height: 30,
                                    textTransform: "none",
                                    fontWeight: 600,
                                    borderRadius: 3,
                                    "&:hover": {
                                      borderColor: eventTypeColor,
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
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Load More Button */}
                {hasMoreEvents && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleLoadMore}
                      sx={{
                        px: 4,
                        py: 1,
                        textTransform: "none",
                        borderRadius: 2,
                        fontWeight: 500,
                      }}
                    >
                      Load More
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      )}

      {/* Registration Dialog */}
      <Dialog open={openRegister} onClose={handleCloseRegister} maxWidth="xs" fullWidth>
        <DialogTitle>
          Register for {selectedEvent?.name}
          <IconButton
            onClick={handleCloseRegister}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={formData.Name}
              onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={formData.Email}
              onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Student ID"
              value={formData.StudentID}
              onChange={(e) => setFormData({ ...formData, StudentID: e.target.value })}
              fullWidth
            />
            {statusMsg.text && <Alert severity={statusMsg.type as any}>{statusMsg.text}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRegister}>Cancel</Button>
          <Button
            onClick={handleSubmitRegister}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Register'}
          </Button>
        </DialogActions>
      </Dialog>

      {selectedEventType === "workshops" && <WorkshopView />}
      {selectedEventType === "trips" && <TripView />}
      {selectedEventType === "bazaars" && <BazaarView />}
      {selectedEventType === "conferences" && <ConferenceView />}
      {selectedEventType === "booths" && <BoothView />}
      
      <BoothDetailsDialog
        open={openDetails}
        onClose={handleCloseDetails}
        event={detailsEvent}
      />
    </BasicLayout>
  );
}

export default function EventPage() {
  return (
    <Suspense fallback={null}>
      <EventPageContent />
    </Suspense>
  );
}
