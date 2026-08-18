"use client";

import {
  Box,
  Typography,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  alpha,
  Paper,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTheme } from "@mui/material/styles";
import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import {
  SportsFootball,
  LocalOffer,
  EventAvailable,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import PollCarouselSection from "@/shared/components/pollCarousel";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EastIcon from "@mui/icons-material/East";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InvitationDialog from '../../shared/components/InvitationDialog';

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
  { text: "Tournaments", icon: <FitnessCenterIcon />, href: "/dashboards/student/tournaments" },
  { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/student/gym" },
  {
    text: "Loyalty Program",
    icon: <LocalOffer />,
    href: "/dashboards/student/loyaltyProgram",
  },
   { text: "Restaurants", href: "/dashboards/student/restaurants" },

];

const slideshowImages = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&fit=crop",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&fit=crop",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&fit=crop",
  "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1600&fit=crop",
];

const faqs = [
  {
    question: "How do I register for an event?",
    answer:
      "Navigate to the Events page, browse available events, and click the 'Register' button on any event you're interested in.",
  },
  {
    question: "How can I book a court?",
    answer:
      "Go to the Courts section, select your preferred court and time slot, then confirm your booking. You'll receive a confirmation email.",
  },
  {
    question: "What are the gym operating hours?",
    answer:
      "The gym is open from 6 AM to 10 PM on weekdays and 8 AM to 8 PM on weekends. Check the Gym page for holiday schedules.",
  },
  {
    question: "Can I cancel my event registration?",
    answer:
      "Yes, you can cancel your registration up to 24 hours before the event starts from your Registered Events page.",
  },
];

const StatCard = ({ value, label, icon, color }: any) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        bgcolor: "white",
        display: "flex",
        alignItems: "center",
        gap: 2,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
        },
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 2,
          bgcolor: alpha(color, 0.08),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={700} color="text.primary">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
};

export default function HomePage() {
  const theme = useTheme();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // 🔔 NOTIFICATION PREFERENCES STATE
  const [selectedGymClasses, setSelectedGymClasses] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // 🔔 LOADING & ALERT STATES
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });

  // Slideshow effect
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  // 🔔 FETCH PREFERENCES ON MOUNT
  useEffect(() => {
    fetchPreferences();
  }, []);

  // 🔔 FETCH USER'S NOTIFICATION PREFERENCES
  const fetchPreferences = async () => {
    try {
      setPreferencesLoading(true);
      
      // Get auth token from localStorage or your auth context
      const token = localStorage.getItem("token"); // ⚠️ ADJUST THIS based on your auth implementation
      
      const response = await fetch("/api/notification-preferences", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }

      const data = await response.json();
      
      // Update state with fetched data
      setSelectedGymClasses(data.selectedGymClasses || []);
      setSelectedEventTypes(data.selectedEventTypes || []);
      setNotificationsEnabled(data.notificationsEnabled || false);
      
    } catch (error: any) {
      console.error("Error fetching preferences:", error);
      showSnackbar("Could not load notification preferences", "info");
    } finally {
      setPreferencesLoading(false);
    }
  };

  // 🔔 SAVE PREFERENCES TO BACKEND
  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      
      const token = localStorage.getItem("token"); // ⚠️ ADJUST THIS
      
      const response = await fetch("/api/notification-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          notificationsEnabled,
          selectedGymClasses,
          selectedEventTypes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save preferences");
      }

      const data = await response.json();
      showSnackbar("✅ Notification preferences saved successfully!", "success");
      
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      showSnackbar(
        "❌ " + (error.message || "Failed to save preferences. Please try again."),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // 🔔 TOGGLE GYM CLASS SELECTION
  const handleGymClassToggle = (gymClass: string) => {
    setSelectedGymClasses((prev) =>
      prev.includes(gymClass)
        ? prev.filter((c) => c !== gymClass)
        : [...prev, gymClass]
    );
  };

  // 🔔 TOGGLE EVENT TYPE SELECTION
  const handleEventTypeToggle = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType)
        ? prev.filter((t) => t !== eventType)
        : [...prev, eventType]
    );
  };

  // 🔔 TOGGLE NOTIFICATIONS ON/OFF
  const handleToggleNotifications = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotificationsEnabled(event.target.checked);
  };

  // 🔔 SHOW SNACKBAR MESSAGE
  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // 🔔 CLOSE SNACKBAR
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const statistics = [
    {
      value: "5",
      label: "Courts Available",
      icon: (
        <SportsFootball
          sx={{ fontSize: 28, color: theme.palette.primary.main }}
        />
      ),
      color: theme.palette.primary.main,
    },
    {
      value: "6",
      label: "Gym Classes",
      icon: (
        <HomeIcon sx={{ fontSize: 28, color: theme.palette.success.main }} />
      ),
      color: theme.palette.success.main,
    },
    {
      value: "100+",
      label: "Monthly Events",
      icon: (
        <EventIcon sx={{ fontSize: 28, color: theme.palette.secondary.dark }} />
      ),
      color: theme.palette.secondary.dark,
    },
  ];

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ width: "100%", overflow: "hidden" }}>
        {/* 🔔 SNACKBAR FOR NOTIFICATIONS */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%", boxShadow: 3 }}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* ===== HERO SECTION ===== */}
        <Box
          sx={{
            position: "relative",
            height: "600px",
            overflow: "hidden",
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            mb: 4,
          }}
        >
          {slideshowImages.map((image, index) => (
            <Box
              key={index}
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${image})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                opacity: currentSlide === index ? 1 : 0,
                transition: "opacity 1.5s ease-in-out",
              }}
            />
          ))}

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%)",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              top: "20%",
              left: "10%",
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              background: `${theme.palette.primary.main}20`,
              animation: "float 6s ease-in-out infinite",
              "@keyframes float": {
                "0%, 100%": { transform: "translateY(0px)" },
                "50%": { transform: "translateY(-30px)" },
              },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: "15%",
              right: "15%",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: `${theme.palette.primary.dark}15`,
              animation: "float 8s ease-in-out infinite",
              animationDelay: "1s",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: "40%",
              right: "25%",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: `${theme.palette.primary.main}25`,
              animation: "float 7s ease-in-out infinite",
              animationDelay: "2s",
            }}
          />

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              px: 4,
            }}
          >
            <Typography
              variant="h1"
              sx={{
                color: "white",
                fontWeight: 800,
                textShadow: "3px 3px 8px rgba(0,0,0,0.6)",
                letterSpacing: "2px",
                fontSize: { xs: "3rem", md: "5rem" },
                mb: 3,
              }}
            >
              Your Campus. Your Life.
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color: "rgba(255,255,255,0.95)",
                fontWeight: 400,
                textShadow: "2px 2px 6px rgba(0,0,0,0.5)",
                maxWidth: "800px",
                lineHeight: 1.5,
                mb: 4,
              }}
            >
              Unleash your potential through sports, fitness, and unforgettable
              campus experiences
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: 2,
              }}
            >
              <Box
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                }}
              >
                1500+ Active Students
              </Box>
              <Box
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                }}
              >
                100+ Events Monthly
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ===== STATISTICS ===== */}
        <Container maxWidth="lg" sx={{ mb: 6 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {statistics.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </Box>
        </Container>

        {/* 🔔🔔🔔 ===== NOTIFICATION PREFERENCES SECTION ===== 🔔🔔🔔 */}
        <Container maxWidth="lg" sx={{ mb: 6 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.02
              )} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              overflow: "hidden",
              position: "relative",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              minHeight: preferencesLoading ? "400px" : "auto",
            }}
          >
            {/* LEFT SECTION */}
            <Box
              sx={{
                flex: 1,
                p: 3,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent sx={{ p: 0, flex: 1 }}>
                {/* Header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 3,
                    flexWrap: "wrap",
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <EventIcon sx={{ fontSize: 32, color: "white" }} />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 300 }}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      mb={1.5}
                      flexWrap="wrap"
                    >
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        color="text.primary"
                      >
                        Notification Preferences
                      </Typography>
                      <Chip
                        label="STAY UPDATED"
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                          color: "primary.dark",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          height: 22,
                        }}
                      />
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      Get notified via email when new events or gym classes
                      matching your interests are posted.
                    </Typography>
                  </Box>
                </Box>

                {/* 🔔 LOADING STATE */}
                {preferencesLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: 300,
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <CircularProgress size={50} />
                    <Typography variant="body2" color="text.secondary">
                      Loading your preferences...
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* 🔔 GYM CLASSES */}
                    <Box
                      sx={{
                        mb: 3,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        mb={2}
                      >
                        <Typography variant="subtitle1" fontWeight={600}>
                          Gym Classes
                        </Typography>
                        <Chip
                          label={`${selectedGymClasses.length} selected`}
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: "primary.dark",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
                      </Stack>

                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {[
                          "Yoga",
                          "Zumba",
                          "Kick-boxing",
                          "Pilates",
                          "Aerobics",
                          "Cross Circuit",
                        ].map((gymClass) => (
                          <Chip
                            key={gymClass}
                            label={gymClass}
                            clickable
                            onClick={() => handleGymClassToggle(gymClass)}
                            sx={{
                              px: 1,
                              py: 1,
                              fontSize: "0.85rem",
                              fontWeight: 500,
                              borderRadius: 2,
                              border: `2px solid ${alpha(
                                theme.palette.primary.main,
                                selectedGymClasses.includes(gymClass) ? 1 : 0.2
                              )}`,
                              bgcolor: selectedGymClasses.includes(gymClass)
                                ? theme.palette.primary.main
                                : "white",
                              color: selectedGymClasses.includes(gymClass)
                                ? "white"
                                : "text.primary",
                              transition: "all 0.2s ease",
                              cursor: "pointer",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: 2,
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* 🔔 EVENT TYPES */}
                    <Box
                      sx={{
                        mb: 3,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.secondary.main, 0.03),
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        mb={2}
                      >
                        <Typography variant="subtitle1" fontWeight={600}>
                          Event Types
                        </Typography>
                        <Chip
                          label={`${selectedEventTypes.length} selected`}
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                            color: "secondary.dark",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
                      </Stack>

                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {[
                          "Workshops",
                          "Trips",
                          "Bazaars",
                          "Conferences",
                          "Booths",
                        ].map((eventType) => (
                          <Chip
                            key={eventType}
                            label={eventType}
                            clickable
                            onClick={() => handleEventTypeToggle(eventType)}
                            sx={{
                              px: 1,
                              py: 1,
                              fontSize: "0.85rem",
                              fontWeight: 500,
                              borderRadius: 2,
                              border: `2px solid ${alpha(
                                theme.palette.secondary.main,
                                selectedEventTypes.includes(eventType) ? 1 : 0.2
                              )}`,
                              bgcolor: selectedEventTypes.includes(eventType)
                                ? theme.palette.secondary.main
                                : "white",
                              color: selectedEventTypes.includes(eventType)
                                ? "white"
                                : "text.primary",
                              transition: "all 0.2s ease",
                              cursor: "pointer",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: 2,
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* 🔔 ACTION BUTTONS */}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        alignItems: "center",
                        mt: 4,
                      }}
                    >
                      <Button
                        variant="contained"
                        onClick={handleSavePreferences}
                        disabled={saving}
                        sx={{
                          px: 4,
                          py: 1.5,
                          fontWeight: 600,
                          minWidth: 180,
                          boxShadow: 2,
                          "&:hover": {
                            boxShadow: 4,
                          },
                        }}
                      >
                        {saving ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CircularProgress size={20} color="inherit" />
                            <span>Saving...</span>
                          </Box>
                        ) : (
                          "Save Preferences"
                        )}
                      </Button>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationsEnabled}
                            onChange={handleToggleNotifications}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2" fontWeight={500}>
                            {notificationsEnabled
                              ? "✅ Email Notifications: Enabled"
                              : "❌ Email Notifications: Disabled"}
                          </Typography>
                        }
                      />
                    </Box>
                  </>
                )}
              </CardContent>
            </Box>

            {/* RIGHT SIDE IMAGE */}
            <Box
              sx={{
                width: { xs: "100%", md: 400 },
                height: { xs: 300, md: 500 },
                display: { xs: "none", md: "flex" },
                flexShrink: 0,
              }}
            >
              <Box
                component="img"
                src="/images/notification2.jpg"
                alt="Notifications"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
          </Card>
        </Container>

        {/* ===== SCROLLING TEXT ===== */}
        <Box sx={{ py: 4, px: 3, position: "relative", overflow: "hidden" }}>
          <Box
            sx={{
              display: "flex",
              whiteSpace: "nowrap",
              animation: "scroll 30s linear infinite",
              "@keyframes scroll": {
                "0%": { transform: "translateX(0)" },
                "100%": { transform: "translateX(-50%)" },
              },
            }}
          >
            <Typography
              component="span"
              sx={{
                display: "inline-block",
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                fontWeight: 800,
                color: "primary.main",
                px: 3,
              }}
            >
              Building Tomorrow&apos;s Leaders Through Today&apos;s Activities.
            </Typography>
            <Typography
              component="span"
              sx={{
                display: "inline-block",
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                fontWeight: 800,
                color: "primary.main",
                px: 4,
              }}
            >
              Building Tomorrow&apos;s Leaders Through Today&apos;s Activities.
            </Typography>
          </Box>
        </Box>
{/* Add invitation ticket here */}
<Container maxWidth="lg" sx={{ mb: 6, textAlign: 'center' }}>
  <Box sx={{ display: 'inline-block', position: 'relative', padding: '16px' }}>
    <Box
      onClick={() => setInviteDialogOpen(true)}
      sx={{
        position: 'relative',
        bgcolor: '#d4a5a5',
        borderRadius: '18px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        p: 4,
        textAlign: 'left',
        width: '1140px',
        height: '280px',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        maskImage: `
          radial-gradient(circle 8px at 0% 15%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 0% 30%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 0% 45%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 0% 60%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 0% 75%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 0% 90%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 100% 15%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 100% 30%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 100% 45%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 100% 60%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 100% 75%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 100% 90%, transparent 0, transparent 8px, black 8px),
          linear-gradient(black, black)
        `,
        maskComposite: 'intersect',
        WebkitMaskImage: `
          radial-gradient(circle 8px at 0% 15%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 0% 30%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 0% 45%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 0% 60%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 0% 75%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 0% 90%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 100% 15%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 100% 30%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 100% 45%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 100% 60%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 100% 75%, transparent 0, transparent 8px, black 8px),
          radial-gradient(circle 8px at 100% 90%, transparent 0, transparent 8px, black 8px),
          linear-gradient(black, black)
        `,
        WebkitMaskComposite: 'source-in',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
        },
        '&:active': {
          transform: 'translateY(-2px)',
        }
      }}
    >
      {/* Left section with decorative bar */}
      <Box
        sx={{
          width: '260px',
          height: '100%',
          bgcolor: 'transparent',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            width: 8,
            height: 8,
            bgcolor: '#93c7c1',
            borderRadius: '50%',
            opacity: 0.6
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            width: 6,
            height: 6,
            bgcolor: '#CFF6F0',
            transform: 'rotate(45deg)',
            opacity: 0.6
          }}
        />
        
        <PersonAddIcon sx={{ fontSize: 80, color: '#336879', mb: 1 }} />
        <Typography
          sx={{
            color: '#336879',
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            mt: 1
          }}
        >
          Guest Pass
        </Typography>
      </Box>

      {/* Dashed separator line */}
      <Box
        sx={{
          width: '2px',
          height: '80%',
          background: 'repeating-linear-gradient(to bottom, #336879 0, #336879 8px, transparent 8px, transparent 16px)',
          opacity: 0.5,
          mx: 2
        }}
      />

      {/* Main content section */}
      <Box sx={{ flex: 1, py: 2 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            mb: 1,
            color: '#336879',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontSize: '2.2rem'
          }}
        >
          INVITE A GUEST
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#336879',
            mb: 2,
            fontSize: '1.2rem',
            opacity: 0.8
          }}
        >
          Bring someone special to campus<br />
          Let&apos;s show them around!
        </Typography>

        <Box
          sx={{
            display: 'inline-block',
            border: '2px solid #336879',
            borderRadius: '8px',
            px: 2,
            py: 0.5,
            bgcolor: 'rgba(255,255,255,0.3)'
          }}
        >
          <Typography
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#336879'
            }}
          >
            Click here to start
          </Typography>
        </Box>
      </Box>
    </Box>
  </Box>
</Container>

{/* At the very end, before final </Box>, add the dialog */}
<InvitationDialog
  open={inviteDialogOpen}
  onClose={() => setInviteDialogOpen(false)}
/>

        {/* ===== POLL SECTION ===== */}
        <PollCarouselSection />

        {/* ===== LOYALTY PROGRAM SECTION ===== */}
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              bgcolor: alpha(theme.palette.secondary.main, 0.04),
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 3,
                  flexWrap: "wrap",
                }}
              >
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LocalOffer sx={{ fontSize: 36, color: "secondary.dark" }} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mb={2}
                    flexWrap="wrap"
                  >
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="text.primary"
                    >
                      GUC Loyalty Program
                    </Typography>
                    <Chip
                      label="EXCLUSIVE DISCOUNTS"
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.secondary.main, 0.2),
                        color: "secondary.dark",
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        height: 22,
                        border: `1px solid ${alpha(
                          theme.palette.secondary.main,
                          0.3
                        )}`,
                      }}
                    />
                  </Stack>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 3, lineHeight: 1.7 }}
                  >
                    Access exclusive discounts from participating vendors across
                    campus and enjoy special offers tailored for GUC students.
                  </Typography>

                  <Stack spacing={1.5} mb={3}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <CheckCircleOutlineIcon
                        sx={{ fontSize: 18, color: "secondary.dark" }}
                      />
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight={500}
                      >
                        Exclusive student discounts
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <CheckCircleOutlineIcon
                        sx={{ fontSize: 18, color: "secondary.dark" }}
                      />
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight={500}
                      >
                        Multiple participating vendors
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <CheckCircleOutlineIcon
                        sx={{ fontSize: 18, color: "secondary.dark" }}
                      />
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight={500}
                      >
                        Easy redemption with promo codes
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    variant="contained"
                    endIcon={<EastIcon />}
                    href="/dashboards/student/loyaltyProgram"
                    sx={{
                      borderRadius: 2,
                      bgcolor: "secondary.dark",
                      textTransform: "none",
                      fontWeight: 700,
                      "&:hover": { bgcolor: "secondary.main" },
                    }}
                  >
                    View Offers
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Container>

        {/* ===== FAQ ===== */}
        <Container maxWidth="lg" sx={{ py: 6, pb: 8 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              mb: 5,
              textAlign: "center",
            }}
          >
            Frequently Asked Questions
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
              gap: 3,
            }}
          >
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                sx={{
                  background: theme.palette.background.paper,
                  borderRadius: "24px !important",
                  border: `1px solid ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )}`,
                  "&:before": { display: "none" },
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: `0 8px 32px ${alpha(
                      theme.palette.primary.main,
                      0.12
                    )}`,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: "primary.main" }} />}
                  sx={{
                    borderRadius: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "primary.main",
                    }}
                  >
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>
    </BasicLayout>
  );
}