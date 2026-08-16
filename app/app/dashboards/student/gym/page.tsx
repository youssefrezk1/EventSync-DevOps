"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Button,
  ThemeProvider,
  Snackbar,
  Alert,
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Grid,
} from "@mui/material";
import {
  CalendarMonth,
  Schedule,
  People,
  FitnessCenter,
  HowToReg,
  WaterDrop,
  RestaurantMenu,
  Bedtime,
  Timer,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  RestartAlt,
} from "@mui/icons-material";
import { api } from "../../../../api";
import theme from "@/lib/theme";

import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import LocalOffer from "@mui/icons-material/Event";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { SportsFootball, EventAvailable } from "@mui/icons-material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { Vote } from "lucide-react";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/student" },
  {
    text: "Events",
    icon: <EventIcon />,
    href: "/dashboards/student/events",
  },
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
  {
    text: "Gym",
    icon: <FitnessCenterIcon />,
    href: "/dashboards/student/gym",
  },

  {
     text: "Loyalty Program",
    href: "/dashboards/student/loyaltyProgram",
  },
  { text: "Restaurants", icon: <RestaurantIcon />, href: "/dashboards/student/restaurants" },
];

interface GymClass {
  _id: string;
  date: string;
  time: string;
  duration: string;
  type:
  | "yoga"
  | "pilates"
  | "aerobics"
  | "Zumba"
  | "cross circuit"
  | "kick-boxing";
  maxParticipants: number;
  counter: number;
  studentParticipants?: string[];
  staffParticipants?: string[];
  createdAt: string;
  updatedAt: string;
  instructor?: string;
}

// Color mapping for different class types
const classColors: Record<string, string> = {
  yoga: "#cde6e2ff",
  pilates: "#d5d7dfff",
  aerobics: "#fbf0e2ff",
  Zumba: "#fbe0d9ff",
  "cross circuit": "#e3f8dfff",
  "kick-boxing": "#f7dedeff",
};

const classTypes = ["yoga", "Zumba", "kick-boxing", "pilates", "aerobics", "cross circuit"];

// Gym tips data
const gymTips = [
  {
    icon: <WaterDrop sx={{ fontSize: 40, color: "primary.main" }} />,
    title: "Stay Hydrated",
    description:
      "Drink water before, during, and after your workout. Aim for at least 8 glasses daily to maintain optimal performance.",
  },
  {
    icon: <RestaurantMenu sx={{ fontSize: 40, color: "primary.main" }} />,
    title: "Fuel Your Body",
    description:
      "Eat a balanced meal 2-3 hours before exercising. Include protein and complex carbs for sustained energy.",
  },
  {
    icon: <Bedtime sx={{ fontSize: 40, color: "primary.main" }} />,
    title: "Rest & Recovery",
    description:
      "Give your muscles time to recover. Get 7-9 hours of sleep and take rest days to prevent injury and burnout.",
  },
  {
    icon: <Timer sx={{ fontSize: 40, color: "primary.main" }} />,
    title: "Warm Up & Cool Down",
    description:
      "Always start with 5-10 minutes of light cardio and stretching. End with cooldown exercises to prevent soreness.",
  },
];

export default function GymPage() {
  const [gymClasses, setGymClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Current user ID (get this from your auth context/session)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string[]>([]);

  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    setMounted(true);
    // TODO: Get current user ID from your auth context/session
    // Example: setCurrentUserId(user._id);
  }, []);

  useEffect(() => {
    fetchGymClasses();
  }, []);

  const fetchGymClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/eventOffice/gym");
      setGymClasses(res.data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (classId: string) => {
    try {
      const res = await api.post(`/eventOffice/gym/register/${classId}`);
      setSnackbarMessage("✅ Successfully registered for the class!");
      setSnackbarSeverity("success");
      // Refresh gym classes to update capacity
      fetchGymClasses();
    } catch (err: any) {
      console.error(err);
      let message = "❌ Failed to register. Please try again.";

      if (err?.response?.status === 409) {
        message = "⚠️ You are already registered for this class.";
      }
      if (err?.response?.status === 404) {
        message = "❌ Full Class";
      }

      setSnackbarMessage(message);
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleTimeToggle = (event: React.MouseEvent<HTMLElement>, newTimes: string[]) => {
    setSelectedTimeOfDay(newTimes);
  };

  const handleResetFilters = () => {
    setSelectedTypes([]);
    setSelectedTimeOfDay([]);
  };

  // Get count of classes by type
  const getClassCountByType = (type: string) => {
    return gymClasses.filter((cls) => cls.type === type).length;
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedDateString = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const filteredClasses = gymClasses.filter((cls) => {
    const clsDate = new Date(cls.date);
    const matchesDate =
      clsDate.getDate() === selectedDate.getDate() &&
      clsDate.getMonth() === selectedDate.getMonth() &&
      clsDate.getFullYear() === selectedDate.getFullYear();

    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(cls.type);

    const hour = parseInt(cls.time.split(":")[0]);
    const matchesTime =
      selectedTimeOfDay.length === 0 ||
      (selectedTimeOfDay.includes("morning") && hour >= 5 && hour < 12) ||
      (selectedTimeOfDay.includes("afternoon") && hour >= 12 && hour < 17) ||
      (selectedTimeOfDay.includes("evening") && hour >= 17 && hour < 24);

    return matchesDate && matchesType && matchesTime;
  });

  // Get dates with classes (considering filters)
  const getDatesWithClasses = () => {
    const datesMap = new Map<number, string[]>();

    gymClasses.forEach((cls) => {
      const clsDate = new Date(cls.date);
      if (clsDate.getMonth() !== currentDate.getMonth() ||
        clsDate.getFullYear() !== currentDate.getFullYear()) {
        return;
      }

      const day = clsDate.getDate();
      const hour = parseInt(cls.time.split(":")[0]);

      // Check if class matches filters
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(cls.type);
      const matchesTime =
        selectedTimeOfDay.length === 0 ||
        (selectedTimeOfDay.includes("morning") && hour >= 5 && hour < 12) ||
        (selectedTimeOfDay.includes("afternoon") && hour >= 12 && hour < 17) ||
        (selectedTimeOfDay.includes("evening") && hour >= 17 && hour < 24);

      if (matchesType && matchesTime) {
        if (!datesMap.has(day)) {
          datesMap.set(day, []);
        }
        datesMap.get(day)!.push(cls.type);
      }
    });

    return datesMap;
  };

  const datesWithClasses = getDatesWithClasses();

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <BasicLayout menuItems={menuItems}>
        <ThemeProvider theme={theme}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "80vh",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress
                size={64}
                sx={{ mb: 2, color: "primary.main" }}
              />
              <Typography variant="h6" color="text.secondary">
                Loading gym classes...
              </Typography>
            </Box>
          </Box>
        </ThemeProvider>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout menuItems={menuItems}>
      <ThemeProvider theme={theme}>
        {/* Hero Section */}
        <Box
          sx={{
            position: "relative",
            borderRadius: 3,
            overflow: "hidden",
            height: 400,
            mb: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `url('/images/gym2.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "brightness(0.5)",
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              px: 2,
            }}
          >
            <Typography
              variant="h3"
              fontWeight={700}
              color="white"
              sx={{ mb: 1 }}
            >
              Gym Classes
            </Typography>
            <Typography
              variant="body1"
              color="rgba(255,255,255,0.9)"
              sx={{ mb: 2 }}
            >
              Seize the opportunity to register to our gym classes.
            </Typography>
          </Box>
        </Box>

        {/* Tips & Tricks Section */}
        <Box
          sx={{
            bgcolor: "background.default",
            py: 4,
            px: { xs: 2, sm: 3, lg: 4 },
            mb: 2,
            borderRadius: 3,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Typography
                variant="h5"
                fontWeight={700}
                color="primary.main"
                sx={{ mb: 0.5 }}
              >
                Tips for a Successful Gym Journey
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Follow these essential tips to maximize your workout results
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                alignItems: "stretch",
                flexWrap: "nowrap",
                overflowX: "auto",
                pb: 1,
              }}
            >
              {gymTips.map((tip, index) => (
                <Paper
                  key={index}
                  elevation={2}
                  sx={{
                    p: 2,
                    width: 220,
                    minWidth: 220,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    transition: "all 0.3s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <Box sx={{ mb: 1 }}>{tip.icon}</Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    color="text.primary"
                    sx={{ mb: 1 }}
                  >
                    {tip.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ lineHeight: 1.5, fontSize: "0.75rem" }}
                  >
                    {tip.description}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Container>
        </Box>

        {/* NEW CALENDAR SECTION */}
        <Box
          sx={{
            bgcolor: "background.default",
            minHeight: "100vh",
            width: "100%",
            mx: -3,
            mb: -3,
            pb: 3,
            px: { xs: 2, sm: 3, lg: 4 },
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: "flex", gap: 3, mt: 3 }}>
              {/* Left Sidebar - Filters */}
              <Paper
                elevation={0}
                sx={{
                  width: 280,
                  p: 3,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  height: "fit-content",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Typography variant="h6" color="#6d6b6bff" fontWeight={600}>
                    Filters
                  </Typography>
                  {(selectedTypes.length > 0 || selectedTimeOfDay.length > 0) && (
                    <IconButton
                      size="small"
                      onClick={handleResetFilters}
                      sx={{ color: "primary.main" }}
                    >
                      <RestartAlt fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {/* Class Type Filter */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Class Type
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {classTypes.map((type) => (
                      <Chip
                        key={type}
                        label={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>

                            {/* push count to the right */}
                            <span style={{ marginLeft: "auto", fontWeight: 300 }}>
                              {getClassCountByType(type)}
                            </span>
                          </Box>
                        }
                        onClick={() => handleTypeToggle(type)}
                        sx={{
                          bgcolor: selectedTypes.includes(type)
                            ? classColors[type]
                            : "transparent",
                          border: "1px solid",
                          borderColor: selectedTypes.includes(type)
                            ? classColors[type]
                            : "divider",

                          // add spacing on the right side of the chip label
                          "& .MuiChip-label": {
                            width: "100%",
                            pr: 2,   // <--- 1 = 8px (right gap)
                            color: "grey"
                          },
                        }}
                      />
                    ))}
                  </Box>

                </Box>

                {/* Time of Day Filter */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Time of Day
                  </Typography>
                  <ToggleButtonGroup
                    value={selectedTimeOfDay}
                    onChange={handleTimeToggle}
                    orientation="vertical"
                    fullWidth
                    sx={{ gap: 1 }}
                  >
                    <ToggleButton
                      value="morning"
                      sx={{
                        textTransform: "none",
                        justifyContent: "flex-start",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      🌅 Morning
                    </ToggleButton>
                    <ToggleButton
                      value="afternoon"
                      sx={{
                        textTransform: "none",
                        justifyContent: "flex-start",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      ☀️ Afternoon
                    </ToggleButton>
                    <ToggleButton
                      value="evening"
                      sx={{
                        textTransform: "none",
                        justifyContent: "flex-start",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      🌙 Evening
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Paper>

              {/* Center - Calendar */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 3,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                {/* Calendar Header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 3,
                  }}
                >
                  <Typography variant="h5" fontWeight={600}>
                    {monthName}
                  </Typography>
                  <Box>
                    <IconButton onClick={handlePrevMonth} size="small">
                      <ChevronLeft />
                    </IconButton>
                    <IconButton onClick={handleNextMonth} size="small">
                      <ChevronRight />
                    </IconButton>
                  </Box>
                </Box>

                {/* Calendar Grid */}
                <Box>
                  {/* Day Headers */}
                  <Grid container spacing={1} sx={{ mb: 1 }}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <Grid size={{xs: 12 / 7}} key={day}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ textAlign: "center", fontWeight: 600, display: "block" }}
                        >
                          {day}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Calendar Days */}
                  <Grid container spacing={1}>
                    {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                      <Grid size={{xs: 12 / 7}} key={`empty-${index}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, index) => {
                      const day = index + 1;
                      const date = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        day
                      );
                      const isSelected =
                        date.getDate() === selectedDate.getDate() &&
                        date.getMonth() === selectedDate.getMonth();
                      const classTypes = datesWithClasses.get(day) || [];
                      const hasClasses = classTypes.length > 0;

                      // Get background color based on class types
                      let bgColor = "transparent";
                      if (hasClasses && selectedTypes.length > 0) {
                        // Use the color of the first matching class type
                        const matchingType = classTypes.find(type => selectedTypes.includes(type));
                        if (matchingType) {
                          bgColor = classColors[matchingType];
                        }
                      }

                      return (
                        <Grid size={{xs: 12 / 7}} key={day}>
                          <Button
                            onClick={() => setSelectedDate(date)}
                            sx={{
                              width: "100%",
                              minHeight: 60,
                              borderRadius: 2,
                              bgcolor: isSelected ? "primary.main" : bgColor,
                              color: isSelected ? "white" : "text.primary",
                              border: "1px solid",
                              borderColor: isSelected ? "primary.main" : "divider",
                              "&:hover": {
                                bgcolor: isSelected ? "primary.dark" : bgColor !== "transparent" ? bgColor : "action.hover",
                              },
                              flexDirection: "column",
                              gap: 0.5,
                            }}
                          >
                            <Typography variant="body2" fontWeight={500}>
                              {day}
                            </Typography>
                            {hasClasses && (
                              <Box
                                sx={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: "50%",
                                  bgcolor: isSelected ? "white" : "primary.main",
                                }}
                              />
                            )}
                          </Button>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>

                {/* Class Type Legend */}
                <Box sx={{ mt: 3, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {classTypes.map((type) => (
                    <Chip
                      key={type}
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                      size="small"
                      onClick={() => handleTypeToggle(type)}
                      sx={{
                        bgcolor: classColors[type],
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        border: selectedTypes.includes(type) ? "2px solid" : "none",
                        borderColor: "primary.main",
                        "&:hover": {
                          opacity: 0.8,
                        },
                      }}
                    />
                  ))}
                </Box>
              </Paper>

              {/* Right Sidebar - Classes */}
              <Paper
                elevation={0}
                sx={{
                  width: 320,
                  p: 3,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  maxHeight: 600,
                  overflow: "auto",
                }}
              >
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  {selectedDateString}
                </Typography>

                {filteredClasses.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", mt: 4 }}
                  >
                    No classes scheduled for this day
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {filteredClasses.map((cls) => {
                      const currentParticipants = cls.counter || 0;
                      const capacityPercentage = (currentParticipants / cls.maxParticipants) * 100;

                      // Check if user is already registered
                      const isRegistered = currentUserId && (
                        cls.studentParticipants?.includes(currentUserId) ||
                        cls.staffParticipants?.includes(currentUserId)
                      );

                      return (
                        <Card
                          key={cls._id}
                          sx={{
                            bgcolor: classColors[cls.type],
                            borderRadius: 2,
                            border: "none",
                          }}
                        >
                          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                              {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              {cls.time} • {cls.duration}
                            </Typography>
                            {cls.instructor && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {cls.instructor}
                              </Typography>
                            )}

                            {/* Capacity Bar */}
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Capacity
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {currentParticipants}/{cls.maxParticipants}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  width: "100%",
                                  height: 8,
                                  bgcolor: "rgba(255,255,255,0.4)",
                                  borderRadius: 1,
                                  overflow: "hidden",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${capacityPercentage}%`,
                                    height: "100%",
                                    bgcolor: capacityPercentage >= 90 ? "#ff8886ff" : capacityPercentage >= 70 ? "#eebe84ff" : "#73a675ff",
                                    transition: "width 0.3s",
                                  }}
                                />
                              </Box>
                            </Box>

                            <Button
                              fullWidth
                              variant="contained"
                              size="small"
                              startIcon={isRegistered ? <CheckCircle /> : <HowToReg />}
                              onClick={() => handleRegister(cls._id)}
                              disabled={Boolean(currentParticipants >= cls.maxParticipants || isRegistered)}
                              sx={{
                                bgcolor: isRegistered ? "#73a675ff" : "white",
                                color: isRegistered ? "white" : "text.primary",
                                "&:hover": {
                                  bgcolor: isRegistered ? "#73a675ff" : "grey.100",
                                },
                                "&.Mui-disabled": {
                                  bgcolor: isRegistered ? "#73a675ff" : "grey.300",
                                  color: isRegistered ? "white" : "grey.600",
                                },
                              }}
                            >
                              {isRegistered ? "Registered" : currentParticipants >= cls.maxParticipants ? "Full" : "Register"}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                )}
              </Paper>
            </Box>
          </Container>

          {/* Snackbar Notification */}
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
        </Box>
      </ThemeProvider>
    </BasicLayout>
  );
}