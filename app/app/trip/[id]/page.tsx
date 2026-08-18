"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";

import {
  Box,
  Container,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Paper,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EventNoteIcon from "@mui/icons-material/EventNote";

import { api } from "@/api";
import BasicLayout from "@/components/layouts/basicLayout2";
import { getMenuItemsByRole } from "@/shared/components/getMenuItemsByRole";
import TripMainContent from "@/shared/components/TripMainContent";
import FavoriteButton from "@/components/FavoriteButton";
import { useUser } from "../../shared/services";
import EventComments from "../../shared/components/Eventcomments";
import MultiStepRegistrationDialog from "../../shared/components/MultiStepRegistrationDialog";
import AddCommentAndRating from "../../shared/components/AddCommentAndRating";
import TripBreadcrumb from "../../shared/components/tripBreadCrum";

interface DecodedToken {
  role?: string;
  staffRole?: string;
}

interface ItineraryItem {
  _id: string;
  type: "attraction" | "travel";
  date: string;
  name?: string;
  from?: string;
  to?: string;
  imageUrl?: string;
  fromLocation?: string;
  toLocation?: string;
  time?: string;
}

interface Trip {
  _id: string;
  name: string;
  location: string;
  start: string;
  end: string;
  time: string;
  shortDescription: string;
  capacity: number;
  registrationDeadline: string;
  registeredCount: number;
  price: number;
  itinerary?: ItineraryItem[];
}

export default function TripDetailPage() {
  const user = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  
    const handleFeedbackSuccess = () => {
    setRefreshKey(prev => prev + 1); // This will force EventComments to refresh
    };
  const params = useParams();
  const tripId = params.id as string;

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // Add state for the multi-step dialog - EXACTLY like WorkshopDetailPage
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const decoded = jwtDecode<DecodedToken>(token);
      const items = getMenuItemsByRole(decoded.role, decoded.staffRole);
      setMenuItems(items);

      if (decoded.role === "TA") {
        setUserRole("TA");
      } else if (decoded.role === "Staff" && decoded.staffRole === "Professor") {
        setUserRole("Professor");
      } else {
        setUserRole(decoded.role);
      }
    } catch (err) {
      console.error("Failed to decode token", err);
    }
  }, []);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/trips/trip/${tripId}`);
      setTrip(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load trip");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  // UPDATED: Handle registration - EXACTLY like WorkshopDetailPage
  const handleRegister = () => {
    setShowRegistrationDialog(true);
  };

  // UPDATED: Handle registration success - EXACTLY like WorkshopDetailPage
  const handleRegistrationSuccess = () => {
    // Refresh trip data
    fetchTrip();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const formatTimeFromString = (time?: string) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour % 12 || 12;
    return `${display}:${m} ${ampm}`;
  };

  const getDateTimeDisplay = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = startDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const endMonth = endDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const startTime = formatTime(start);
    const endTime = formatTime(end);

    if (startMonth === endMonth && startDay === endDay) {
      return `${startDay} ${startMonth} | ${startTime} - ${endTime}`;
    } else if (startMonth === endMonth) {
      return `${startDay}-${endDay} ${startMonth} | ${startTime} - ${endTime}`;
    } else {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} | ${startTime} - ${endTime}`;
    }
  };

  // Calculate total days between start and end
  const getTotalDays = () => {
    if (!trip) return 0;
    const start = new Date(trip.start);
    const end = new Date(trip.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  // Group itinerary by day
  const groupByDay = () => {
    const totalDays = getTotalDays();
    const grouped: { [key: number]: ItineraryItem[] } = {};
    
    // Initialize all days with empty arrays
    for (let i = 1; i <= totalDays; i++) {
      grouped[i] = [];
    }

    if (!trip?.itinerary || trip.itinerary.length === 0) return grouped;

    const startDate = new Date(trip.start);

    trip.itinerary.forEach((item) => {
      const itemDate = new Date(item.date);
      const diffTime = itemDate.getTime() - startDate.getTime();
      const dayNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (dayNumber >= 1 && dayNumber <= totalDays) {
        grouped[dayNumber].push(item);
      }
    });

    Object.keys(grouped).forEach((day) => {
      grouped[parseInt(day)].sort((a, b) => {
        const timeA = a.time || a.from || "00:00";
        const timeB = b.time || b.from || "00:00";
        return timeA.localeCompare(timeB);
      });
    });

    return grouped;
  };

  if (loading) {
    return (
      <BasicLayout menuItems={menuItems}>
        <Box
          sx={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={60} />
        </Box>
      </BasicLayout>
    );
  }

  if (error || !trip) {
    return (
      <BasicLayout menuItems={menuItems}>
        <Box
          sx={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Alert severity="error">{error || "Trip not found"}</Alert>
        </Box>
      </BasicLayout>
    );
  }

  const spotsLeft = trip.capacity - trip.registeredCount;
  const dayGroups = groupByDay();
  const totalDays = getTotalDays();
  const currentDayItems = dayGroups[selectedDay] || [];

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
         <TripBreadcrumb tripId={tripId} />
        {/* HERO SECTION */}
        <Box
  sx={{
    position: "relative",
    height: "500px",
    backgroundImage:
      "url(https://images.unsplash.com/photo-1532236204992-f5e85c024202?q=80&w=1195&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    mb: 6,
    borderRadius: "32px",
    overflow: "hidden",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))",
    },
  }}
>
           
          <Container maxWidth="lg" sx={{ position: "relative", height: "100%", zIndex: 1 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
                py: 3,
              }}
            >
              <Box sx={{ height: 40 }} />

              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 36, md: 52 },
                    fontWeight: 800,
                    color: "white",
                    mb: 2,
                    letterSpacing: "-1px",
                  }}
                >
                  {trip.name}
                </Typography>

                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                    bgcolor: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <CalendarTodayIcon sx={{ color: "white", fontSize: 20 }} />
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: "white" }}>
                    {getDateTimeDisplay(trip.start, trip.end)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  <Chip
                    icon={<LocationOnIcon />}
                    label={trip.location}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.15)",
                      color: "white",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg">
          {/* Deadline + Favorites */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 3,
              mb: 4,
            }}
          >
            {/* Deadline Card */}
            <Box
              sx={{
                bgcolor: "white",
                borderRadius: 3,
                p: 3,
                border: "1px solid #e2e8f0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <EventAvailableIcon sx={{ color: "#475569", fontSize: 32 }} />
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Registration Deadline
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                    {formatDate(trip.registrationDeadline)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Favorite Button */}
            <FavoriteButton eventId={trip._id} eventType="trip" />
          </Box>

          {/* MAIN CONTENT */}
          <TripMainContent
            trip={trip}
            registering={registering}
            onRegister={handleRegister}
            userId={user?.id}
            role={userRole}
          />

          {/* ITINERARY SECTION */}
          {totalDays > 0 && (
            <Box sx={{ mt: 6, mb: 6 }}>
              <Box sx={{ display: "flex", gap: 4 }}>
                {/* LEFT PANEL - Attractions List (45%) */}
                <Box sx={{ width: "45%" }}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 4,
                      borderRadius: 4,
                      bgcolor: "#e8e5d3ff",
                      color: "white",
                      position: "sticky",
                      top: 20,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 32,
                        fontWeight: 800,
                        mb: 3,
                        letterSpacing: "-0.5px",
                      }}
                    >
                      Day&apos;s Attractions
                    </Typography>

                    {currentDayItems.filter((item) => item.type === "attraction").length > 0 ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {currentDayItems
                          .filter((item) => item.type === "attraction")
                          .map((item, index) => (
                            <Paper
                              key={item._id}
                              elevation={6}
                              sx={{
                                p: 2.5,
                                borderRadius: 3,
                                bgcolor: "white",
                                transition: "all 0.3s ease",
                                cursor: "pointer",
                                "&:hover": {
                                  transform: "translateY(-6px)",
                                  boxShadow: "0 12px 24px rgba(0,0,0,0.2)",
                                },
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                                <Avatar
                                  src={item.imageUrl}
                                  variant="rounded"
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 2,
                                    flexShrink: 0,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                  }}
                                >
                                  <LocationOnIcon sx={{ fontSize: 36, color: "#cbd5e1" }} />
                                </Avatar>

                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    sx={{
                                      fontSize: 20,
                                      fontWeight: 700,
                                      color: "#1F2937",
                                      mb: 1,
                                    }}
                                  >
                                    {item.name}
                                  </Typography>
                                  <Chip
                                    label="Iconic"
                                    size="small"
                                    sx={{
                                      bgcolor: "#1e293b",
                                      color: "white",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      height: 24,
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Paper>
                          ))}
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          py: 6,
                          textAlign: "center",
                          bgcolor: "rgba(255,255,255,0.05)",
                          borderRadius: 3,
                          border: "2px dashed rgba(255,255,255,0.2)",
                        }}
                      >
                        <EventNoteIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography sx={{ fontSize: 16, fontWeight: 600, opacity: 0.9 }}>
                          No attractions planned for this day
                        </Typography>
                        <Typography sx={{ fontSize: 14, mt: 1, opacity: 0.7 }}>
                          Check other days for activities
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>

                {/* RIGHT PANEL - Timeline (55%) */}
                <Box sx={{ flex: 1 }}>
                  {/* Day Tabs */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      flexWrap: "wrap",
                      bgcolor: "white",
                      p: 1.5,
                      borderRadius: 3,
                      mb: 4,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                      const hasItems = dayGroups[day] && dayGroups[day].length > 0;
                      return (
                        <Box
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          sx={{
                            px: 3,
                            py: 1.5,
                            borderRadius: 2.5,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            bgcolor: selectedDay === day 
                              ? "#1e293b"
                              : hasItems 
                                ? "#f1f5f9"
                                : "transparent",
                            color: selectedDay === day ? "white" : hasItems ? "#334155" : "#94a3b8",
                            fontWeight: selectedDay === day ? 700 : 600,
                            fontSize: 14,
                            border: hasItems ? "none" : "1px dashed #cbd5e1",
                            boxShadow: selectedDay === day ? "0 4px 12px rgba(30, 41, 59, 0.3)" : "none",
                            "&:hover": {
                              bgcolor: selectedDay === day 
                                ? "#1e293b"
                                : "#e2e8f0",
                            },
                          }}
                        >
                          Day {day}
                        </Box>
                      );
                    })}
                  </Box>

                  {/* Timeline Content */}
                  {currentDayItems.length > 0 ? (
                    <Box sx={{ position: "relative" }}>
                      {currentDayItems.map((item, index) => {
                        const isLast = index === currentDayItems.length - 1;
                        const isTravel = item.type === "travel";

                        return (
                          <Box key={item._id} sx={{ position: "relative", mb: isLast ? 0 : 0 }}>
                            <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
                              {/* Timeline Dot */}
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  pt: 2,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: "50%",
                                    bgcolor: "#334155",
                                    border: "3px solid white",
                                    boxShadow: "0 0 0 3px rgba(51, 65, 85, 0.2)",
                                    zIndex: 2,
                                  }}
                                />
                                {!isLast && (
                                  <Box
                                    sx={{
                                      width: 2,
                                      height: "100%",
                                      minHeight: 80,
                                      bgcolor: "#cbd5e1",
                                      mt: 1,
                                    }}
                                  />
                                )}
                              </Box>

                              {/* Content */}
                              <Box sx={{ flex: 1, pb: 3 }}>
                                <Paper
                                  elevation={2}
                                  sx={{
                                    p: 2.5,
                                    borderRadius: 2.5,
                                    bgcolor: "white",
                                    border: "1px solid #e5e7eb",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                                      transform: "translateX(4px)",
                                    },
                                  }}
                                >
                                  {!isTravel ? (
                                    <Box>
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                                        <Typography
                                          sx={{
                                            fontSize: 24,
                                            fontWeight: 800,
                                            color: "#1F2937",
                                          }}
                                        >
                                          {formatTimeFromString(item.from)}
                                        </Typography>
                                        <Box
                                          sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            bgcolor: "#334155",
                                          }}
                                        />
                                        <Typography
                                          sx={{
                                            fontSize: 22,
                                            fontWeight: 700,
                                            color: "#1F2937",
                                          }}
                                        >
                                          {item.name}
                                        </Typography>
                                        <Box
                                          sx={{
                                            ml: "auto",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                          }}
                                        >
                                          <LocationOnIcon
                                            sx={{ color: "#475569", fontSize: 20 }}
                                          />
                                          <Chip
                                            label="Arrive"
                                            sx={{
                                              bgcolor: "#f1f5f9",
                                              color: "#334155",
                                              fontWeight: 700,
                                              fontSize: 11,
                                              height: 24,
                                            }}
                                          />
                                          {isLast && (
                                            <Chip
                                              label="End"
                                              sx={{
                                                bgcolor: "#FEE2E2",
                                                color: "#DC2626",
                                                fontWeight: 700,
                                                fontSize: 11,
                                                height: 24,
                                              }}
                                            />
                                          )}
                                        </Box>
                                      </Box>

                                      <Typography
                                        sx={{
                                          fontSize: 13,
                                          color: "#6B7280",
                                          mt: 1,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                        }}
                                      >
                                        <AccessTimeIcon sx={{ fontSize: 16 }} />
                                        Duration: {formatTimeFromString(item.from)} - {formatTimeFromString(item.to)}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                      <Avatar
                                        sx={{
                                          width: 44,
                                          height: 44,
                                          bgcolor: "#f1f5f9",
                                        }}
                                      >
                                        <DirectionsCarIcon
                                          sx={{ color: "#475569", fontSize: 24 }}
                                        />
                                      </Avatar>
                                      <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                                          <Typography
                                            sx={{
                                              fontSize: 15,
                                              fontWeight: 700,
                                              color: "#1F2937",
                                            }}
                                          >
                                            {item.fromLocation}
                                          </Typography>
                                          <ArrowForwardIcon
                                            sx={{ color: "#475569", fontSize: 18 }}
                                          />
                                          <Typography
                                            sx={{
                                              fontSize: 15,
                                              fontWeight: 700,
                                              color: "#1F2937",
                                            }}
                                          >
                                            {item.toLocation}
                                          </Typography>
                                        </Box>
                                        <Typography
                                          sx={{
                                            fontSize: 12,
                                            color: "#6B7280",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                          }}
                                        >
                                          <AccessTimeIcon sx={{ fontSize: 14 }} />
                                          Departure at {formatTimeFromString(item.time)}
                                        </Typography>
                                      </Box>
                                      <Chip
                                        label="Travel"
                                        sx={{
                                          bgcolor: "#f1f5f9",
                                          color: "#334155",
                                          fontWeight: 700,
                                          fontSize: 11,
                                          height: 24,
                                        }}
                                      />
                                    </Box>
                                  )}
                                </Paper>
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 6,
                        textAlign: "center",
                        bgcolor: "#fafafa",
                        borderRadius: 3,
                        border: "2px dashed #e0e0e0",
                      }}
                    >
                      <EventNoteIcon sx={{ fontSize: 56, color: "#bdbdbd", mb: 2 }} />
                      <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#757575", mb: 1 }}>
                        No activities scheduled
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: "#9e9e9e" }}>
                        This day is currently free with no planned itinerary
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Box>
            </Box>
          )}
          <Box sx={{ mb: 0 }}>
            <EventComments
              key={refreshKey}
              eventType="trip"
              eventId={trip._id}
              eventName={trip.name}
              onSuccess={handleFeedbackSuccess}
              userRole={user?.role}
              userId={user?.id}
            />
          </Box>
      
        </Container>
      </Box>

      {/* Multi-Step Registration Dialog - EXACTLY like WorkshopDetailPage */}
      <MultiStepRegistrationDialog
        open={showRegistrationDialog}
        onClose={() => setShowRegistrationDialog(false)}
        tripId={tripId}
        itemName={trip.name}
        itemType="trip"
        onRegistrationSuccess={handleRegistrationSuccess}
      />
    </BasicLayout>
  );
}