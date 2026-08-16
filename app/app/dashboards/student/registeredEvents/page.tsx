"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  InputAdornment,
  Chip,
  Divider,
} from "@mui/material";
import { EventAvailable, LocalOffer, Search } from "@mui/icons-material";
import axios from "axios";
import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { SportsFootball } from "@mui/icons-material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { EventCard } from "@/components/ui/registeredEventCard";
import { EventDetailsDialog } from "@/components/ui/eventDetailsDialog";
import { Vote } from "lucide-react";
import { CalendarToday } from "@mui/icons-material";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/student" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/student/events" },
  {
    text: "Registered events",
    icon: <EventAvailable />,
    href: "/dashboards/student/registeredEvents",
  },
  {
    text: "Courts",
    icon: <SportsFootball />,
    href: "/dashboards/student/courts",
  },
    {
      text: "Tournaments",
      icon: <FitnessCenterIcon />,
      href: "/dashboards/student/tournaments",
    },
  { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/student/gym" },

  {
    text: "Loyalty Program",
    icon: <LocalOffer />,
    href: "/dashboards/student/loyaltyProgram",
  },
  { text: "Restaurants", icon: <RestaurantIcon />, href: "/dashboards/student/restaurants" },
];

export default function RegisteredEventsPage() {
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    date: "",
    status: "all", // Added status filter: "all", "past", "upcoming"
    sortBy: "start",
    sortOrder: "asc",
  });
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const apiUrl = "http://localhost:4000/api/my-registrations";

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found — user must log in first");
          setLoading(false);
          return;
        }

        const res = await axios.get(apiUrl, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        setRegistrations(res.data.registrations || []);
      } catch (err: any) {
        console.error("Error fetching registrations:", err);
        setError("Failed to load registrations");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvent(null);
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      location: "",
      date: "",
      status: "all",
      sortBy: "start",
      sortOrder: "asc",
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter and sort logic (client-side)
  const filteredEvents = registrations
    .filter((r) => {
      const matchesSearch =
        !filters.search ||
        r.name.toLowerCase().includes(filters.search.toLowerCase());

      const matchesLocation =
        !filters.location ||
        r.location.toLowerCase().includes(filters.location.toLowerCase());

      const matchesDate =
        !filters.date ||
        new Date(r.start).toISOString().split("T")[0] === filters.date;

      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "past" && r.registrationStatus === "Past") ||
        (filters.status === "upcoming" && r.registrationStatus === "Upcoming");

      return matchesSearch && matchesLocation && matchesDate && matchesStatus;
    })
    .sort((a, b) => {
      let compareValue = 0;

      switch (filters.sortBy) {
        case "start":
          compareValue = new Date(a.start).getTime() - new Date(b.start).getTime();
          break;
        case "name":
          compareValue = a.name.localeCompare(b.name);
          break;
        case "location":
          compareValue = a.location.localeCompare(b.location);
          break;
        case "type":
          compareValue = a.type.localeCompare(b.type);
          break;
        default:
          compareValue = new Date(a.start).getTime() - new Date(b.start).getTime();
      }

      return filters.sortOrder === "asc" ? compareValue : -compareValue;
    });

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
                  My Registered Events
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
              Track your registered workshops, trips, conferences, and
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
            {/* Left Column - Workshop (Large) */}
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

              {/* Conference Image */}
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

      {/* Main Content with Sidebar */}
      <Box sx={{ display: "flex", gap: 3, p: 3 }}>
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
              onClick={handleResetFilters}
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
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="location">Location</MenuItem>
                <MenuItem value="type">Event Type</MenuItem>
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
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
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
          {/* Search Bar with Chips and Count */}
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
                placeholder="Search registered events..."
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

            {/* Status Chips - Moved next to search bar */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip
                label="All"
                size="medium"
                variant={filters.status === "all" ? "filled" : "outlined"}
                color={filters.status === "all" ? "primary" : "default"}
                onClick={() => handleFilterChange("status", "all")}
                sx={{
                  cursor: "pointer",
                  fontWeight: 600,
                  px: 1.5,
                  py: 1.5
                }}
              />
              <Chip
                label="Upcoming"
                size="medium"
                variant={filters.status === "upcoming" ? "filled" : "outlined"}
                color={filters.status === "upcoming" ? "primary" : "default"}
                onClick={() => handleFilterChange("status", "upcoming")}
                sx={{
                  cursor: "pointer",
                  fontWeight: 600,
                  px: 1.5,
                  py: 1.5
                }}
              />
              <Chip
                label="Past"
                size="medium"
                variant={filters.status === "past" ? "filled" : "outlined"}
                color={filters.status === "past" ? "primary" : "default"}
                onClick={() => handleFilterChange("status", "past")}
                sx={{
                  cursor: "pointer",
                  fontWeight: 600,
                  px: 1.5,
                  py: 1.5
                }}
              />
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: "nowrap", minWidth: "140px" }}
            >
              ({filteredEvents.length} of {registrations.length} events)
            </Typography>
          </Box>

          {/* Loading / Error */}
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" p={8}>
              <CircularProgress size={48} />
            </Box>
          )}

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "error.light",
              }}
            >
              {error}
            </Alert>
          )}

          {/* Events List */}
          {!loading && !error && filteredEvents.length > 0 && (
            <Grid container spacing={3}>
              {filteredEvents.map((event) => (
                <Grid size={{xs: 12, md: 6, lg: 4}} key={event.registrationId}>
                  <EventCard
                    event={event}
                    onViewDetails={handleViewDetails}
                    // Pass status to EventCard for styling
                    status={event.registrationStatus}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {!loading && !error && filteredEvents.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "white",
              }}
            >
              <EventAvailable
                sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
              />
              <Typography
                variant="h6"
                fontWeight={600}
                color="error.main"
                mb={1}
              >
                No registered events found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filters.status !== "all"
                  ? `No ${filters.status} events found. Try adjusting your filters.`
                  : "Try adjusting your filters or register for new events"}
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        open={openDialog}
        event={selectedEvent}
        onClose={handleCloseDialog}
      />
    </BasicLayout>
  );
}