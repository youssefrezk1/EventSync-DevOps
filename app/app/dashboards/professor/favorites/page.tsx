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
  Card,
  CardContent,
  Avatar,
} from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
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
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import EventIconMui from "@mui/icons-material/Event";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import {
  SportsFootball,
  LocalOffer,
  EventAvailable,
} from "@mui/icons-material";
import { Vote } from "lucide-react";
import { useFavorites } from "@/shared/hooks/useFavorites";
import BoothDetailsDialog from "@/shared/components/BoothDetailsDialog";
import { FavoriteButton } from "@/shared/components/FavoriteButton";
import { Work } from "@mui/icons-material";
const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/professor" },
  {
    text: "Events",
    icon: <EventIcon />,
    href: "/dashboards/professor/events",
  },
  {
    text: "Registered events",
    icon: <EventAvailable />,
    href: "/dashboards/professor/registeredEvents",
  },
  {
    text: "Gym",
    icon: <FitnessCenterIcon />,
    href: "/dashboards/professor/gym",
  },
  {
    text: "Workshops",
    icon: <Work />,
    href: "/dashboards/professor/workshops",
  },
    {text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/professor/loyaltyProgram"}
];

export default function FavoritesPage() {
  const { favorites, loading, toggleFavorite, isFavorited } = useFavorites();
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    date: "",
    eventType: "all",
    status: "all",
    sortBy: "start",
    sortOrder: "asc",
  });
  const [openBoothDialog, setOpenBoothDialog] = useState(false);
  const [selectedBoothEvent, setSelectedBoothEvent] = useState<any>(null);
  const router = useRouter();

  // Map favorites to match the event card format from events page
  const validFavorites = favorites
    .filter((event: any) => event && event._id)
    .map((event: any) => {
      const eventType = event.eventType || event.type || "event";
      const now = new Date();
      const eventEnd = event.endDate
        ? new Date(event.endDate)
        : event.end
        ? new Date(event.end)
        : now;
      const isPast = eventEnd < now;

      return {
        ...event,
        id: event._id,
        _id: event._id,
        name: event.name || event.title || "Event",
        type: eventType,
        location: event.location || "Location not specified",
        start: event.startDate || event.start || new Date().toISOString(),
        end: event.endDate || event.end || new Date().toISOString(),
        time: event.time || "00:00",
        description: event.description || "No description available",
        image: event.imageUrl || event.image || "/images/default-event.jpg",
        registrationStatus: isPast ? "Past" : "Upcoming",
        eventType: eventType,
        price: event.price || event.fee || "Free",
        ProfCreator: event.ProfCreator || event.organizer || null,
        isFavorited: true,
      };
    });

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenBoothDetails = (event: any) => {
    setSelectedBoothEvent(event);
    setOpenBoothDialog(true);
  };

  const handleCloseBoothDialog = () => {
    setOpenBoothDialog(false);
    setSelectedBoothEvent(null);
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      location: "",
      date: "",
      eventType: "all",
      status: "all",
      sortBy: "start",
      sortOrder: "asc",
    });
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

  const getEventTypeColor = (eventType: string) => {
    return (
      {
        trip: "#eabfbfff",
        workshop: "#dbbbe2ff",
        bazaar: "#7d90c2ff",
        conference: "#e1daceff",
        booth: "#ace6d7ff",
      }[eventType] || "#757575"
    );
  };

  // Filter and sort logic
  const filteredFavorites = validFavorites
    .filter((event) => {
      // Search filter
      const matchesSearch =
        !filters.search ||
        event.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.description?.toLowerCase().includes(filters.search.toLowerCase());

      // Location filter
      const matchesLocation =
        !filters.location ||
        event.location.toLowerCase().includes(filters.location.toLowerCase());

      // Date filter
      const matchesDate =
        !filters.date ||
        new Date(event.start).toISOString().split("T")[0] === filters.date;

      // Event type filter
      const matchesEventType =
        filters.eventType === "all" ||
        event.eventType === filters.eventType ||
        event.type === filters.eventType;

      // Status filter (upcoming/past)
      let matchesStatus = true;
      if (filters.status === "upcoming") {
        matchesStatus = event.registrationStatus === "Upcoming";
      } else if (filters.status === "past") {
        matchesStatus = event.registrationStatus === "Past";
      }

      return (
        matchesSearch &&
        matchesLocation &&
        matchesDate &&
        matchesEventType &&
        matchesStatus
      );
    })
    .sort((a, b) => {
      let compareValue = 0;

      switch (filters.sortBy) {
        case "start":
          compareValue =
            new Date(a.start).getTime() - new Date(b.start).getTime();
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
          compareValue =
            new Date(a.start).getTime() - new Date(b.start).getTime();
      }

      return filters.sortOrder === "asc" ? compareValue : -compareValue;
    });

  // Count events by type
  const eventCounts = validFavorites.reduce((acc: any, event: any) => {
    const type = event.eventType || event.type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return (
    <BasicLayout menuItems={menuItems}>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          mb: 4,
          backgroundColor: "#dab0b0ff",
          boxShadow: "primary.main",
          filter: "brightness(0.8)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
            height: 200,
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
            <Box display={"flex"} gap={0.5} alignContent={"center"}>
              <Box>
                  <FavoriteBorder sx={{color:"primary.main",width:30,height:30}}></FavoriteBorder>
              </Box>
              <Box>
                <Typography
                  variant="h3"
                  fontWeight={600}
                  color="primary.main"
                  sx={{
                    mb: 2,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  My Favorite Events
                </Typography>
              </Box>
            </Box>

            {/* Stats Row */}
            <Box
              sx={{
                display: "flex",
                gap: 4,
                mb: 4,
              }}
            >
              <Box>
                <Typography variant="h3" fontWeight={700} color="primary.main">
                  {validFavorites.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Favorites
                </Typography>
              </Box>
              <Box>
                <Typography variant="h3" fontWeight={700} color="primary.main">
                  {Object.keys(eventCounts).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Categories
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Content with Sidebar */}
      <Box sx={{ display: "flex", gap: 3, p: 2 }}>
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

          {/* Event Type Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              Event Type
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.eventType}
                onChange={(e) =>
                  handleFilterChange("eventType", e.target.value)
                }
                displayEmpty
              >
                <MenuItem value="all">All Types</MenuItem>
                {eventCounts.workshop > 0 && (
                  <MenuItem value="workshop">
                    Workshop ({eventCounts.workshop})
                  </MenuItem>
                )}
                {eventCounts.trip > 0 && (
                  <MenuItem value="trip">Trip ({eventCounts.trip})</MenuItem>
                )}
                {eventCounts.bazaar > 0 && (
                  <MenuItem value="bazaar">
                    Bazaar ({eventCounts.bazaar})
                  </MenuItem>
                )}
                {eventCounts.conference > 0 && (
                  <MenuItem value="conference">
                    Conference ({eventCounts.conference})
                  </MenuItem>
                )}
                {eventCounts.booth > 0 && (
                  <MenuItem value="booth">Booth ({eventCounts.booth})</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          {/* Location Filter */}
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

          {/* Date Filter */}
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
              InputLabelProps={{
                shrink: true,
              }}
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
                <MenuItem value="start">Event Date</MenuItem>
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
                placeholder="Search favorite events..."
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
                  py: 1.5,
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
                  py: 1.5,
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
                  py: 1.5,
                }}
              />
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: "nowrap", minWidth: "140px" }}
            >
              ({filteredFavorites.length} of {validFavorites.length} favorites)
            </Typography>
          </Box>

          {/* Loading State */}
          {loading && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              p={8}
            >
              <CircularProgress size={48} />
            </Box>
          )}

          {/* Events List */}
          {!loading && filteredFavorites.length > 0 && (
            <Grid container spacing={3}>
              {filteredFavorites.map((event) => {
                const eventTypeColor = getEventTypeColor(event.eventType);

                return (
                  <Grid size={{xs: 12, md: 6, lg: 4}} key={event.id}>
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

                        {/* Event Details - UPDATED: Date and Time on same line */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.8,
                            mb: 1.5,
                          }}
                        >
                          {/* Date and Time on same line */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.8,
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
                                sx={{ whiteSpace: "nowrap" }}
                              >
                                {formatDate(event.start)}
                              </Typography>
                            </Box>

                            {/* Divider between date and time */}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mx: 0.5 }}
                            >
                              •
                            </Typography>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.8,
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
                                sx={{ whiteSpace: "nowrap" }}
                              >
                                {formatTime(event.time)}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Price on separate line */}
                          {event.price && event.price !== "Free" && (
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
                              {event.ProfCreator.firstName?.charAt(0)}
                              {event.ProfCreator.lastName?.charAt(0)}
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
                            gap: 1,
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
                              event.eventType === "workshop"
                                ? `/workshop/${event._id}`
                                : event.eventType === "trip"
                                ? `/trip/${event._id}`
                                : event.eventType === "bazaar"
                                ? `/bazaar/${event._id}`
                                : event.eventType === "conference"
                                ? `/confrence/${event._id}`
                                : event.eventType === "booth"
                                ? "#"
                                : "#"
                            }
                            onClick={(e) => {
                              if (event.eventType === "booth") {
                                e.preventDefault();
                                handleOpenBoothDetails(event);
                              }
                            }}
                            style={{
                              textDecoration: "none",
                              flex: 1,
                              ...(event.eventType === "booth" && {
                                cursor: "pointer",
                              }),
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

          {/* Empty State - No favorites at all */}
          {!loading && validFavorites.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 8,
                textAlign: "center",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "white",
              }}
            >
              <FavoriteBorder
                sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
              />
              <Typography
                variant="h6"
                fontWeight={600}
                color="error.main"
                mb={1}
              >
                No favorite events yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start exploring events and click the heart icon to add them to
                your favorites.
              </Typography>
              <Button
                variant="contained"
                href="/dashboards/student/events"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 4,
                  py: 1,
                }}
              >
                Browse Events
              </Button>
            </Paper>
          )}

          {/* No Results for Filter */}
          {!loading &&
            validFavorites.length > 0 &&
            filteredFavorites.length === 0 && (
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
                <Favorite
                  sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                />
                <Typography
                  variant="h6"
                  fontWeight={600}
                  color="text.secondary"
                  mb={1}
                >
                  No matching favorites found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filters.eventType !== "all" ||
                  filters.status !== "all" ||
                  filters.search ||
                  filters.location ||
                  filters.date
                    ? "Try adjusting your filters or search terms"
                    : "No favorites found for the selected criteria"}
                </Typography>
              </Paper>
            )}
        </Box>
      </Box>

      {/* Booth Details Dialog */}
      <BoothDetailsDialog
        open={openBoothDialog}
        onClose={handleCloseBoothDialog}
        event={selectedBoothEvent}
      />
    </BasicLayout>
  );
}
