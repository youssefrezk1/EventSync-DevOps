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
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Divider,
  alpha,
} from "@mui/material";
import {
  Search,
  Event as EventIcon,
  School,
  Store,
  Flight,
  Storefront,
  Group,
  LocationOn,
  AccessTime,
  People,
  AttachMoney,
  Delete,
} from "@mui/icons-material";
import { RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import CloseIcon from "@mui/icons-material/Close";
import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart";
import { LocalOffer } from "@mui/icons-material";
import { useEvents, Event, SearchFilters } from "../../../shared/services";
import WorkshopView from "./components/WorkshopView";
import TripView from "./components/TripView";
import BazaarView from "./components/BazaarView";
import ConferenceView from "./components/ConferenceView";
import BoothView from "./components/BoothView";
import { useTheme } from "@mui/material/styles";
import { CalendarToday } from "@mui/icons-material";
import { api } from '@/api';
import Link from "next/link";
import BoothDetailsDialog from '../../../shared/components/BoothDetailsDialog';

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/admin" },
  { text: "Staff Verification", icon: <HomeIcon />, href: "/dashboards/admin/roles" },
  { text: "Vendor Requests", icon: <BusinessIcon />, href: "/dashboards/admin/vendorRequests" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/admin/events" },
  { text: "Admins", icon: <HomeIcon />, href: "/dashboards/admin/admins" },
  { text: "Event Office", icon: <WorkIcon />, href: "/dashboards/admin/eventoffice" },
  { text: "All Users", icon: <HomeIcon />, href: "/dashboards/admin/all-users" },
  { text: "All Vendors", icon: <BusinessIcon />, href: "/dashboards/admin/vendors" },
    { text: "Restaurants", href: "/dashboards/admin/restraunts" },
  { text: "Reports", icon: <BarChartIcon />, href: "/dashboards/admin/reports" },
  { text: "Loyalty Program", icon: <LocalOffer />, href: "/dashboards/admin/loyaltyProgram" },
];

const eventTypes = [
  { value: "all", label: "All Events", icon: <EventIcon /> },
  { value: "workshops", label: "Workshops", icon: <School /> },
  { value: "trips", label: "Trips", icon: <Flight /> },
  { value: "bazaars", label: "Bazaars", icon: <Store /> },
  { value: "conferences", label: "Conferences", icon: <Group /> },
  { value: "booths", label: "Booths", icon: <Storefront /> },
];

function EventPageContent() {
  const theme = useTheme();
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    location: "",
    date: "",
    type: "",
    faculty: "",
    sortBy: "start",
    sortOrder: "asc",
  });
  const [displayedEventsCount, setDisplayedEventsCount] = useState(6);

   const searchParams = useSearchParams();

  const { events, loading, error, fetchEvents } = useEvents(
    selectedEventType === "all" ? undefined : selectedEventType
  );
    useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      // Set the selected event type based on URL parameter
      setSelectedEventType(typeParam);
      // Also update the filters to include the type
      setFilters(prev => ({ ...prev, type: typeParam }));
    }
  }, [searchParams]);

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
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoadMore = () => {
    setDisplayedEventsCount((prev) => prev + 6);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  // View details dialog state
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleOpenDetails = (event: Event) => {
    setDetailsEvent(event);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setDetailsEvent(null);
  };

  const handleOpenDelete = (event: Event) => {
    console.log('Delete button clicked!', event); // ADD THIS
  console.log('Event type:', event.eventType); // ADD THIS
    setEventToDelete(event);
    setDeleteError('');
    setDeleteDialogOpen(true);
    console.log('Dialog should open now'); // ADD THIS
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
    setEventToDelete(null);
    setDeleteError('');
  };

  const getEventTypeColor = (eventType: string) => {
    const colors = {
      trip: "primary",
      workshop: "secondary",
      bazaar: "success",
      conference: "warning",
      booth: "info",
    };
    return colors[eventType as keyof typeof colors] || "default";
  };

  const isEventPast = (event: Event) => {
    const now = new Date();
    const endCandidate = (event as any).end || (event as any).endDate || (event as any).EndDate || event.start;
    if (!endCandidate) return false;
    const d = new Date(endCandidate);
    return !isNaN(d.getTime()) && d < now;
  };

  const eventTypePlural = (et: string) => {
    const map: Record<string, string> = {
      workshop: 'workshops',
      trip: 'trips',
      bazaar: 'bazaars',
      conference: 'conferences',
      booth: 'booths'
    };
    return map[et] || et;
  };

  const handleArchive = async (eventItem: Event) => {
    if (!isEventPast(eventItem)) {
      alert('Only past events can be archived.');
      return;
    }

    const confirm = window.confirm(`Archive "${eventItem.name}"? This will mark it as archived.`);
    if (!confirm) return;

    try {
      const type = eventTypePlural(eventItem.eventType);
      const response = await api.post(`/api/events/${type}/${eventItem._id}/archive`);
      fetchEvents(filters);
      alert('Event archived successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to archive event');
    }
  };

  const handleUnarchive = async (eventItem: Event) => {
    const confirm = window.confirm(`Unarchive "${eventItem.name}"? This will restore it to active events.`);
    if (!confirm) return;

    try {
      const type = eventTypePlural(eventItem.eventType);
      const response = await api.post(`/api/events/${type}/${eventItem._id}/unarchive`);
      fetchEvents(filters);
      alert('Event unarchived successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to unarchive event');
    }
  };

  const handleDeleteEvent = async () => {
  if (!eventToDelete) return;
  
  try {
    setDeleteLoading(true);
    setDeleteError('');
    
    let response;
    
    // Handle different event types
    if (eventToDelete.eventType === 'trip') {
      response = await api.delete(`/api/trips/${eventToDelete._id}`);
    } else if (eventToDelete.eventType === 'workshop') {
      response = await api.delete(`/api/workshops/${eventToDelete._id}`);
    } else if (eventToDelete.eventType === 'bazaar') {
      response = await api.delete(`/bazaarbyid/${eventToDelete._id}`);
    } else if (eventToDelete.eventType === 'conference') {
      response = await api.delete(`/api/conferences/${eventToDelete._id}`);
    } else {
      setDeleteError(`Delete functionality not available for ${eventToDelete.eventType} events`);
      setDeleteLoading(false);
      return;
    }
    
    // Handle response with specific error messages
    if (response.status === 200) {
      await fetchEvents(filters);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  } catch (err: any) {
    // Handle specific HTTP error codes
    if (err.response) {
      switch (err.response.status) {
        case 404:
          setDeleteError('Event not found. It may have already been deleted.');
          break;
        case 400:
          setDeleteError(err.response.data?.error || 'Cannot delete this event. Please check if there are dependencies.');
          break;
        case 500:
          setDeleteError('Server error occurred. Please try again later.');
          break;
        default:
          setDeleteError(err.response.data?.error || err.response.data?.message || 'Failed to delete event');
      }
    } else if (err.request) {
      setDeleteError('Network error. Please check your connection.');
    } else {
      setDeleteError(err.message || 'An unexpected error occurred');
    }
  } finally {
    setDeleteLoading(false);
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
    background:
      "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1610465299996-30f240ac2b1c?w=1600&auto=format&fit=crop')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "320px",
    display: "flex",
    alignItems: "center",
    mb: 4,
    borderRadius: 3,
    overflow: "hidden",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background:
        "linear-gradient(135deg, rgba(147, 199, 193, 0.1) 0%, rgba(0, 61, 82, 0.2) 100%)",
    },
  }}
>
  <Box sx={{ position: "relative", zIndex: 1, px: 4, py: 6, width: "100%" }}>
    <Box display={"flex"} gap={0.5} alignItems="center" mb={1.5}>
      <Box
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(10px)",
          p: 1.5,
          height: 50,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        <CalendarToday sx={{ fontSize: 32, color: "white" }} />
      </Box>
      <Box>
        <Typography
          variant="h3"
          sx={{
            color: "white",
            fontWeight: 700,
            mb: 0,
            fontSize: { xs: "2rem", md: "2.5rem" },
          }}
        >
          Manage Events
        </Typography>
      </Box>
    </Box>

    <Typography
      variant="body1"
      sx={{
        color: "rgba(255, 255, 255, 0.9)",
        mb: 2,
        maxWidth: "700px",
        fontSize: "1rem",
        lineHeight: 1.6,
      }}
    >
      Track and manage all workshops, trips, conferences, bazaars, and booths in one convenient admin panel.
    </Typography>

    {/* Stats and Refresh Button in same row */}
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end", // Align items to bottom
        gap: 4,
        flexWrap: "wrap",
      }}
    >
      {/* Stats Section */}
      <Box sx={{ display: "flex", gap: 4 }}>
        <Box>
          <Typography
            variant="h2"
            fontWeight={700}
            color="white"
            sx={{ lineHeight: 1, mb: 0.5 }}
          >
            {events.length}
          </Typography>
          <Typography
            variant="body2"
            sx={{ 
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "0.875rem" 
            }}
          >
            Total Events
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="h2"
            fontWeight={700}
            color="white"
            sx={{ lineHeight: 1, mb: 0.5 }}
          >
            5
          </Typography>
          <Typography
            variant="body2"
            sx={{ 
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "0.875rem" 
            }}
          >
            Categories
          </Typography>
        </Box>
      </Box>

      {/* Refresh Button - Beside stats */}
      <Button
        variant="outlined"
        startIcon={<RefreshCw size={18} />}
        onClick={fetchEvents}
        disabled={loading}
        sx={{
          px: 3,
          py: 1.25,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9375rem",
          borderColor: "rgba(255, 255, 255, 0.5)",
          color: "white",
          height: "fit-content", // Adjust height to match stats
          "&:hover": {
            borderColor: "white",
            bgcolor: "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        Refresh
      </Button>
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

            {/* Event Cards Grid */}
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

                            {/* Spacer to push buttons to bottom */}
                            <Box sx={{ flexGrow: 1 }} />

                            {/* Buttons - Bottom with Fixed Size */}
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              {/* View Details Button */}
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
                                View Details
                              </Button>
                              </Link>
                              
                              {/* Delete Button */}
                              {event.eventType !== 'booth' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleOpenDelete(event)}
                                sx={{
                                  height: 30,
                                  minWidth: 'auto',
                                  textTransform: "none",
                                  fontWeight: 600,
                                  borderRadius: 3,
                                }}
                              >
                                Delete
                              </Button>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Load More Button */}
                {hasMoreEvents && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                  >
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

      {selectedEventType === "workshops" && <WorkshopView />}
      {selectedEventType === "trips" && <TripView />}
      {selectedEventType === "bazaars" && <BazaarView />}
      {selectedEventType === "conferences" && <ConferenceView />}
      {selectedEventType === "booths" && <BoothView />}

      {/* View Details Dialog */}
      <BoothDetailsDialog
              open={openDetails}
              onClose={handleCloseDetails}
              event={detailsEvent}
            />

      {/* Delete Confirmation Dialog */}
<Dialog
  open={deleteDialogOpen}
  onClose={() => { 
    setDeleteDialogOpen(false); 
    setEventToDelete(null); 
    setDeleteError(''); 
  }}
>
  <DialogTitle>Delete Event</DialogTitle>
  <DialogContent>
    <Typography>
      {eventToDelete
        ? `Are you sure you want to delete the ${eventToDelete.eventType} "${eventToDelete.name || 'Unknown'}"?`
        : 'Are you sure you want to delete this event?'}
    </Typography>

    {deleteError && (
      <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>
    )}
  </DialogContent>
  <DialogActions>
    <Button 
      onClick={() => { 
        setDeleteDialogOpen(false); 
        setEventToDelete(null); 
        setDeleteError(''); 
      }} 
      disabled={deleteLoading}
    >
      Cancel
    </Button>
    <Button
      onClick={handleDeleteEvent}
      variant="contained"
      color="error"
      disabled={deleteLoading}
    >
      {deleteLoading ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
    </Button>
  </DialogActions>
</Dialog>
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
