"use client";

import { useState, useEffect, Suspense } from "react";
import { Vote, RefreshCw } from "lucide-react";
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
  Menu,
  Stack,
  Snackbar // Add Snackbar import
} from "@mui/material";
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
  MoreVert,
  Visibility
} from "@mui/icons-material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CloseIcon from "@mui/icons-material/Close";
import BasicLayout from "@/components/layouts/basicLayout2";
import { api } from '@/api';
import HomeIcon from "@mui/icons-material/Home";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { SportsFootball, EventAvailable, LocalOffer } from "@mui/icons-material";
import { useEvents, Event, SearchFilters } from "../../../shared/services";
import WorkshopView from "./components/WorkshopView";
import TripView from "./components/TripView";
import BazaarView from "./components/BazaarView";
import ConferenceView from "./components/ConferenceView";
import BoothView from "./components/BoothView";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart"; 
import BoothDetailsDialog from '../../../shared/components/BoothDetailsDialog';
import {
  // ... other imports
  EmojiEvents, // Add this import
} from "@mui/icons-material";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/eventOffice" },
  {
    text: "Events",
    icon: <EventIcon />,
    href: "/dashboards/eventOffice/events",
  },
  { text: "Tournaments", icon: <EmojiEvents />, href: "/dashboards/eventOffice/tournaments" }, // Add this line
  {
    text: "Gym",
    icon: <FitnessCenterIcon />,
    href: "/dashboards/eventOffice/gym",
  },
  {
    text: "Workshop Requests",
    icon: <WorkIcon />,
    href: "/dashboards/eventOffice/workshopRequests",
  },
  {
    text: "Vendor Requests",
    icon: <BusinessIcon />,
    href: "/dashboards/eventOffice/vendorRequests",
  },
  {
     text: "Reports", 
     icon: <BarChartIcon />, 
     href: "/dashboards/eventOffice/reports" 
  }, {
    text: "Overlapping Booths",
    icon: <HomeIcon />,
    href: "/dashboards/eventOffice/overlappingBooths",
  },
  { text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/eventOffice/loyaltyProgram"},
];

const eventTypes = [
  { value: 'all', label: 'All Events', icon: <EventIcon /> },
  { value: 'workshops', label: 'Workshops', icon: <School /> },
  { value: 'trips', label: 'Trips', icon: <Flight /> },
  { value: 'bazaars', label: 'Bazaars', icon: <Store /> },
  { value: 'conferences', label: 'Conferences', icon: <EventIcon /> },
  { value: 'booths', label: 'Booths', icon: <Storefront /> }
];

function EventPageContent() {
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    location: '',
    date: '',
    type: '',
    faculty: '',
    sortBy: 'start',
    sortOrder: 'asc'
  });
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null);
  
  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("success");
  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      const tabIndex = eventTypes.findIndex(type => type.value === typeParam);
      if (tabIndex !== -1) {
        setActiveTab(tabIndex);
        setFilters(prev => ({ ...prev, type: typeParam }));
      }
    }
  }, [searchParams]);
  
  const { events, loading, error, fetchEvents } = useEvents(
    activeTab === 0 ? undefined : eventTypes[activeTab].value
  );
  
  useEffect(() => {
    fetchEvents(filters);
  }, [activeTab, filters]);
  
  // Menu state for three-dot actions
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
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

  const isEventPast = (event: Event) => {
    const now = new Date();
    const endCandidate = (event as any).end || (event as any).endDate || event.start;
    if (!endCandidate) return false;
    const d = new Date(endCandidate);
    return !isNaN(d.getTime()) && d < now;
  };

  const eventTypePlural = (et: string) => {
    const map: Record<string,string> = {
      trip: 'trips',
      workshop: 'workshops',
      bazaar: 'bazaars',
      conference: 'conferences',
      booth: 'booths'
    };
    return map[et] || et;
  };

  const handleArchive = async (eventItem: Event) => {
    if (!isEventPast(eventItem)) {
      setSnackbarMessage('Only past events can be archived.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      const type = eventTypePlural(eventItem.eventType);
      console.log('Archiving event:', { type, id: eventItem._id, eventType: eventItem.eventType });
      const response = await api.post(`/api/events/${type}/${eventItem._id}/archive`);
      console.log('Archive response:', response);
      fetchEvents(filters);
      setSnackbarMessage('Event archived successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error('Archive error:', err);
      console.error('Error response:', err.response);
      setSnackbarMessage(err.response?.data?.message || err.message || 'Failed to archive event');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleUnarchive = async (eventItem: Event) => {
    try {
      const type = eventTypePlural(eventItem.eventType);
      console.log('Unarchiving event:', { type, id: eventItem._id, eventType: eventItem.eventType });
      const response = await api.post(`/api/events/${type}/${eventItem._id}/unarchive`);
      console.log('Unarchive response:', response);
      fetchEvents(filters);
      setSnackbarMessage('Event unarchived successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error('Unarchive error:', err);
      console.error('Error response:', err.response);
      setSnackbarMessage(err.response?.data?.message || err.message || 'Failed to unarchive event');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const getEventIcon = (eventType: string) => {
    const type = eventTypes.find(t => t.value === eventType);
    return type?.icon || <EventIcon />;
  };

  // Menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, eventItem: Event) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedEvent(eventItem);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedEvent(null);
  };

  // Booth details handlers
  const handleOpenDetails = (eventItem: Event) => {
    setDetailsEvent(eventItem);
    setOpenDetails(true);
    handleCloseMenu();
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setDetailsEvent(null);
  };

  // Delete handlers
  const handleOpenDeleteDialog = (eventItem: Event) => {
    setSelectedEvent(eventItem);
    setDeleteError('');
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedEvent(null);
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    
    try {
      setDeleteLoading(true);
      setDeleteError('');
      const type = eventTypePlural(selectedEvent.eventType);
      await api.delete(`/api/events/${type}/${selectedEvent._id}`);
      fetchEvents(filters);
      handleCloseDeleteDialog();
      setSnackbarMessage('Event deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete event');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getEventTypeColor = (eventType: string) => {
    const colors = {
      trip: "#eabfbfff",
      workshop: "#dbbbe2ff",
      bazaar: "#7d90c2ff",
      conference: "#e1daceff",
      booth: "#ace6d7ff"
    };
    return colors[eventType as keyof typeof colors] || "#757575";
  };

  // Snackbar close handler
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <BasicLayout menuItems={menuItems}>
     {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          background:
            "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('/images/trip.webp')",
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
            background: "linear-gradient(135deg, rgba(147, 199, 193, 0.1) 0%, rgba(0, 61, 82, 0.2) 100%)" 
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
            height: 320,
          }}
        >
          {/* Left Content Section */}
          <Box
            sx={{
              flex: "100%",
              px: 6,
              py: 5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h1"
              fontWeight={700}
              color="white"
              sx={{
                mb: 2,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              Upcoming Events
            </Typography>

            <Typography
              variant="body1"
              color="white"
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
                  color="white"
                  sx={{ lineHeight: 1, mb: 0.5 }}
                >
                  {events.length}
                </Typography>
                <Typography
                  variant="body2"
                  color="white"
                  sx={{ fontSize: "0.875rem" }}
                >
                  Total Events
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color="white"
                  sx={{ lineHeight: 1, mb: 0.5 }}
                >
                  4
                </Typography>
                <Typography
                  variant="body2"
                  color="white"
                  sx={{ fontSize: "0.875rem" }}
                >
                  Categories
                </Typography>
              </Box>
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
          {eventTypes.map((type, index) => (
            <Button
              key={type.value}
              onClick={() => setActiveTab(index)}
              sx={{
                py: 1.5,
                px: 3,
                flex: 1,
                borderRadius: 0,
                borderBottom: 3,
                borderColor:
                  activeTab === index
                    ? "primary.main"
                    : "transparent",
                color:
                  activeTab === index
                    ? "primary.main"
                    : "text.secondary",
                fontWeight: activeTab === index ? 600 : 400,
                textTransform: "none",
                fontSize: "0.9rem",
                transition: "all 0.3s",
                "&:hover": {
                  backgroundColor: "action.hover",
                  borderColor:
                    activeTab === index
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
      {activeTab === 0 && (
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

            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }} />

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

            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }} />

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

            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }} />

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

            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }} />

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
              <Grid container spacing={3}>
                {events.map((event) => {
                  const eventTypeColor = getEventTypeColor(event.eventType);

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
                              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 0.5 }}>
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
                                  }}
                                />
                                {(event as any).isArchived && (
                                  <Chip
                                    label="Archived"
                                    size="small"
                                    sx={{
                                      backgroundColor: "grey.300",
                                      color: "black",
                                      fontWeight: 600,
                                      fontSize: "0.7rem",
                                      height: 22,
                                      borderRadius: 2,
                                    }}
                                  />
                                )}
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
                                {event.name}
                              </Typography>
                            </Box>

                            {/* Icon with 3 buttons - Top Right */}
                            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
                              {/* Icon */}
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
                                {getEventIcon(event.eventType)}
                              </Box>

                             {/* {/* Three-dot menu 
                              <IconButton
                                size="small"
                                onClick={(e) => handleOpenMenu(e, event)}
                                sx={{
                                  color: "black",
                                  '&:hover': { backgroundColor: 'action.hover' },
                                  width: 32,
                                  height: 32
                                }}
                              >
                                <MoreVert />
                              </IconButton> */}
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

                          {/* Event Details - Updated to show date/name if booth */}
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
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {event.eventType === 'booth' 
                                  ? `${formatDate(event.start)} `
                                  : formatDate(event.start)
                                }
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

                          {/* Spacer */}
                          <Box sx={{ flexGrow: 1 }} />

                          {/* Action Buttons */}
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
                              onClick={(e) => { 
                                if (event.eventType === 'booth') {
                                  e.preventDefault();
                                  handleOpenDetails(event);
                                }
                              }}
                              style={{ 
                                textDecoration: 'none', 
                                flex: 1,
                                ...(event.eventType === 'booth' && { cursor: 'pointer' }) 
                              }}
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
            )}
          </Box>
        </Box>
      )}

      {/* Three-dot Menu for ALL EVENT TYPES */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 140,
          }
        }}
      >
        <MenuItem onClick={() => selectedEvent && handleOpenDetails(selectedEvent)}>
          View Details
        </MenuItem>
        
        <MenuItem onClick={handleCloseMenu}>
          Edit
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            if (selectedEvent) {
              (selectedEvent as any).isArchived 
                ? handleUnarchive(selectedEvent) 
                : handleArchive(selectedEvent);
            }
            handleCloseMenu();
          }}
        >
          {(selectedEvent as any)?.isArchived ? 'Unarchive' : 'Archive'}
        </MenuItem>
        
        <MenuItem 
          onClick={() => selectedEvent && handleOpenDeleteDialog(selectedEvent)} 
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete "{selectedEvent?.name}"?</Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained" 
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

     
      {activeTab === 1 && <WorkshopView />}
      {activeTab === 2 && <TripView />}
      {activeTab === 3 && <BazaarView />}
      {activeTab === 4 && <ConferenceView />}
      {activeTab === 5 && <BoothView />}

      <BoothDetailsDialog
        open={openDetails}
        onClose={handleCloseDetails}
        event={detailsEvent}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
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
