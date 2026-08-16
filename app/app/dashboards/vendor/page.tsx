"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Container,
  Grid,
  Card,
  CardContent,
  Paper,
  Stack,
  Chip,
  alpha,
  Fade,
  CardActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { FactCheck, Rule } from "@mui/icons-material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EastIcon from "@mui/icons-material/East";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import { api } from "@/api";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/vendor" },
  {
    text: "Bazaars",
    icon: <StorefrontIcon />,
    href: "/dashboards/vendor/bazaars",
  },
  {
    text: "Booth Registration",
    icon: <FactCheck />,
    href: "/dashboards/vendor/boothRegistration",
  },
  {
    text: "Request Status",
    icon: <Rule />,
    href: "/dashboards/vendor/requestStatus",
  },
  
  {
    text: "Tournaments",
    icon: <EmojiEventsIcon />,
    href: "/dashboards/vendor/tournaments",
  },
];

// Feature Card Component (Compact)
const FeatureCardCompact = ({ icon, title, description, badge, features, href }: any) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: 320,
        width:360,
        borderRadius: 2,
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.08),
        bgcolor: "white",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
          borderColor: theme.palette.primary.light,
          "& .arrow-icon": {
            transform: "translateX(4px)",
          },
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1.5,
            }}
          >
            {icon}
          </Box>

          <Stack direction="row" spacing={0.5} alignItems="center" mb={1} flexWrap="wrap">
            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ fontSize: "1rem" }}>
              {title}
            </Typography>
            <Chip
              label={badge}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: "primary.main",
                fontWeight: 700,
                fontSize: "0.6rem",
                height: 18,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            />
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.5, mb: 2, fontSize: "0.8rem" }}
          >
            {description}
          </Typography>
        </Box>

        <Stack spacing={1} mb={2}>
          {features.map((feature: string, idx: number) => (
            <Box
              key={idx}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <CheckCircleOutlineIcon
                sx={{ fontSize: 14, color: "primary.main" }}
              />
              <Typography variant="body2" color="text.primary" fontWeight={500} sx={{ fontSize: "0.75rem" }}>
                {feature}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Button
          variant="text"
          endIcon={<EastIcon className="arrow-icon" sx={{ fontSize: 16 }} />}
          href={href}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "primary.main",
            px: 0,
            fontSize: "0.8rem",
            "& .arrow-icon": {
              transition: "transform 0.3s ease",
            },
            "&:hover": {
              bgcolor: "transparent",
            },
          }}
        >
          Explore {title}
        </Button>
      </CardContent>
    </Card>
  );
};

// Bazaar Card Component
const BazaarCard = ({ bazaar, index }: any) => {
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Fade in timeout={400 + index * 100}>
      <Card
        elevation={0}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.08),
          bgcolor: "white",
          position: "relative",
          overflow: "visible",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-8px)",
            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.12)}`,
            borderColor: theme.palette.primary.light,
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Box sx={{ mb: 2.5 }}>
            <Box justifySelf={"right"}>
              <Chip
                label="BAZAAR"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: "primary.main",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  letterSpacing: "0.5px",
                  height: 24,
                  mb: 1.5,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              />
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: "1.1rem",
                lineHeight: 1.3,
                color: "text.primary",
                mb: 1,
                minHeight: 20,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {bazaar.name}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: "0.875rem",
                lineHeight: 1.6,
                minHeight: 40,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {bazaar.shortDescription ||
                "Join us for an exciting bazaar event filled with opportunities."}
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Box
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderRadius: 1.5,
                  p: 0.8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 18, color: "primary.main" }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  display="block"
                  sx={{ mb: 0.3 }}
                >
                  Event Dates
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.primary"
                  sx={{ fontSize: "0.8rem" }}
                >
                  {formatDate(bazaar.start)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Box
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderRadius: 1.5,
                  p: 0.8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LocationOnIcon sx={{ fontSize: 18, color: "primary.main" }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  display="block"
                  sx={{ mb: 0.3 }}
                >
                  Location
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.primary"
                  sx={{ fontSize: "0.8rem" }}
                >
                  {bazaar.location}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Box
                sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.08),
                  borderRadius: 1.5,
                  p: 0.8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <EventBusyIcon sx={{ fontSize: 18, color: "warning.main" }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  color="warning.main"
                  fontWeight={700}
                  display="block"
                  sx={{ mb: 0.3 }}
                >
                  Registration Deadline
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color="warning.main"
                  sx={{ fontSize: "0.8rem" }}
                >
                  {formatDate(bazaar.registrationDeadline)}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0, gap: 0.5 }}>
          <Button
            variant="outlined"
            fullWidth
            disabled={bazaar.hasApplied}
            href="/dashboards/vendor/bazaars"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              py: 0.8,
              borderWidth: 1.5,
              borderColor: alpha(theme.palette.primary.main, 0.3),
              color: "primary.main",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderWidth: 1.5,
              },
            }}
          >
            {bazaar.hasApplied ? "Already Applied" : "Register Now"}
          </Button>
        </CardActions>
      </Card>
    </Fade>
  );
};

// Stats Card Component
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
  const [loading, setLoading] = useState(true);
  const [hasApplication, setHasApplication] = useState(false);
  const [wirId, setWirId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bazaars, setBazaars] = useState<any[]>([]);
  const [loadingBazaars, setLoadingBazaars] = useState(true);
  const [applicationData, setApplicationData] = useState<any>(null);

  const [discountRate, setDiscountRate] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  useEffect(() => {
    checkApplication();
    fetchBazaars();
  }, []);

  const fetchBazaars = async () => {
    try {
      setLoadingBazaars(true);
      const res = await api.get("/api/vendorOne/upcoming-bazaars");
      // Get only the first 3 bazaars
      setBazaars(res.data.slice(0, 3));
    } catch (err) {
      console.error("Error fetching bazaars:", err);
    } finally {
      setLoadingBazaars(false);
    }
  };

  const checkApplication = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/wir/my-application");
      setHasApplication(res.data.hasApplication);
      if (res.data.wir) {
        setWirId(res.data.wir._id);
        setApplicationData(res.data.wir);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setHasApplication(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!discountRate || !promoCode || !termsAndConditions) {
      setSnackbarMessage("❌ Please fill in all fields");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const rate = parseFloat(discountRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setSnackbarMessage("❌ Discount rate must be between 0 and 100");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/api/wir", {
        discountRate: rate,
        promoCode,
        termsAndConditions,
      });

      setSnackbarMessage("✅ Application submitted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setOpenDialog(false);
      setDiscountRate("");
      setPromoCode("");
      setTermsAndConditions("");
      
      await checkApplication();
    } catch (err: any) {
      setSnackbarMessage(`❌ ${err?.response?.data?.message || "Failed to submit"}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    if (!wirId) return;
    setOpenCancelDialog(true);
  };

  const handleViewApplication = () => {
    setOpenViewDialog(true);
  };

  const handleCancelConfirm = async () => {
    try {
      setSubmitting(true);
      setOpenCancelDialog(false);
      await api.delete(`/api/wir/${wirId}`);
      
      setSnackbarMessage("✅ Application cancelled successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
      await checkApplication();
    } catch (err: any) {
      setSnackbarMessage(`❌ ${err?.response?.data?.message || "Failed to cancel"}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    {
      icon: <StorefrontIcon sx={{ fontSize: 24, color: "primary.main" }} />,
      title: "Bazaars",
      badge: "DISCOVER",
      description:
        "Explore upcoming bazaar events and discover new opportunities to showcase your products to a wider audience.",
      features: [
        "Browse available bazaar events",
        "View detailed event information",
        "Apply to participate in bazaars",
      ],
      href: "/dashboards/vendor/bazaars",
    },
    {
      icon: <FactCheck sx={{ fontSize: 24, color: "primary.main" }} />,
      title: "Booth Registration",
      badge: "REGISTER",
      description:
        "Secure your booth space at our premium locations. Choose your preferred size, location, and duration.",
      features: [
        "Select booth size and location",
        "Register multiple attendees",
        "Upload required documentation",
      ],
      href: "/dashboards/vendor/boothRegistration",
    },
    {
      icon: <EmojiEventsIcon sx={{ fontSize: 24, color: "primary.main" }} />,
      title: "Tournaments",
      badge: "SPONSOR",
      description:
        "Sponsor exciting sports tournaments and boost your brand visibility with students and staff.",
      features: [
        "Browse available tournaments",
        "Apply for sponsorship",
        "Track sponsorship applications",
      ],
      href: "/dashboards/vendor/tournaments",
    },
    {
      icon: <Rule sx={{ fontSize: 24, color: "primary.main" }} />,
      title: "Request Status",
      badge: "TRACK",
      description:
        "Monitor your application status and track upcoming events where you've been accepted to participate.",
      features: [
        "View application statuses",
        "Track upcoming events",
        "Manage event attendees",
      ],
      href: "/dashboards/vendor/requestStatus",
    },
  ];

  const stats = [
    {
      value: "12+",
      label: "Active Bazaars",
      icon: <StorefrontIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main,
    },
    {
      value: "500+",
      label: "Vendors",
      icon: <TrendingUpIcon sx={{ fontSize: 28, color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
    },
    {
      value: "24/7",
      label: "Support Available",
      icon: <CalendarTodayIcon sx={{ fontSize: 28, color: theme.palette.warning.main }} />,
      color: theme.palette.warning.main,
    },
  ];

  return (
    <BasicLayout menuItems={menuItems}>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
          height: { xs: 500, md: 600 },
          mb: 4,
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
            backgroundImage: `url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "brightness(0.4)",
            zIndex: 1,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.dark,
              0.4
            )} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
            zIndex: 2,
          }}
        />

        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 3,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            py: 6,
          }}
        >
          <Box sx={{ maxWidth: 700 }}>
            <Chip
              label="VENDOR PORTAL"
              sx={{
                bgcolor: alpha("#fff", 0.2),
                backdropFilter: "blur(10px)",
                color: "white",
                fontWeight: 700,
                fontSize: "0.75rem",
                letterSpacing: 2,
                mb: 3,
                height: 32,
                border: `1px solid ${alpha("#fff", 0.3)}`,
              }}
            />

            <Typography
              variant="h2"
              fontWeight={800}
              color="white"
              sx={{
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                letterSpacing: "-1px",
                mb: 3,
                lineHeight: 1.2,
              }}
            >
              Welcome to Your
              <br />
              Vendor Dashboard
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: alpha("#fff", 0.95),
                fontWeight: 400,
                fontSize: { xs: "1rem", md: "1.25rem" },
                lineHeight: 1.7,
                mb: 4,
              }}
            >
              Manage your booth registrations, explore bazaar opportunities, and
              track your applications all in one place. Start growing your
              business today.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                endIcon={<EastIcon />}
                href="/dashboards/vendor/bazaars"
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "1rem",
                  bgcolor: "white",
                  color: "primary.main",
                  boxShadow: `0 6px 20px ${alpha("#000", 0.15)}`,
                  "&:hover": {
                    bgcolor: alpha("#fff", 0.95),
                    boxShadow: `0 8px 24px ${alpha("#000", 0.2)}`,
                  },
                }}
              >
                Explore Bazaars
              </Button>
              <Button
                variant="outlined"
                size="large"
                href="/dashboards/vendor/boothRegistration"
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "1rem",
                  borderColor: "white",
                  color: "white",
                  borderWidth: 2,
                  "&:hover": {
                    borderWidth: 2,
                    bgcolor: alpha("#fff", 0.1),
                    backdropFilter: "blur(10px)",
                  },
                }}
              >
                Register Booth
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Grid container spacing={3} justifySelf={"center"}>
          {stats.map((stat, index) => (
            <Grid size={{xs: 12, sm: 4}} key={index}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Loyalty Program Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
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
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, flexWrap: "wrap" }}>
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
                <LoyaltyIcon sx={{ fontSize: 36, color: "secondary.dark" }} />
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={2} flexWrap="wrap">
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    GUC Loyalty Program
                  </Typography>
                  <Chip
                    label="EXCLUSIVE"
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.secondary.main, 0.2),
                      color: "secondary.dark",
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      height: 22,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                    }}
                  />
                </Stack>

                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3, lineHeight: 1.7 }}
                >
                  Join our exclusive loyalty program to offer special discounts to GUC community members and grow your customer base.
                </Typography>

                <Stack spacing={1.5} mb={3}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckCircleOutlineIcon
                      sx={{ fontSize: 18, color: "secondary.dark" }}
                    />
                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                      Set your own discount rates
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckCircleOutlineIcon
                      sx={{ fontSize: 18, color: "secondary.dark" }}
                    />
                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                      Create custom promo codes
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckCircleOutlineIcon
                      sx={{ fontSize: 18, color: "secondary.dark" }}
                    />
                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                      Reach GUC community members
                    </Typography>
                  </Box>
                </Stack>

                {loading ? (
                  <Button variant="contained" disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading...
                  </Button>
                ) : hasApplication ? (
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<RemoveRedEyeIcon />}
                      onClick={handleViewApplication}
                      sx={{
                        borderRadius: 2,
                        bgcolor: "secondary.dark",
                        "&:hover": { bgcolor: "secondary.main" },
                      }}
                    >
                      View Application
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCancelClick}
                      disabled={submitting}
                      sx={{
                        borderRadius: 2,
                        borderWidth: 1.5,
                        "&:hover": { borderWidth: 1.5 },
                      }}
                    >
                      {submitting && <CircularProgress size={20} sx={{ mr: 1 }} />}
                      Cancel Application
                    </Button>
                  </Stack>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => setOpenDialog(true)}
                    sx={{
                      borderRadius: 2,
                      bgcolor: "secondary.dark",
                      "&:hover": { bgcolor: "secondary.main" },
                    }}
                  >
                    Join Program
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Upcoming Bazaars Section */}
      <Container maxWidth="lg" sx={{ mb: 4 }} >
        <Box sx={{ mb: 4 }} >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: "primary.main",
                  fontWeight: 700,
                  letterSpacing: 2,
                  fontSize: "0.875rem",
                }}
              >
                OPPORTUNITIES
              </Typography>
              <Typography
                variant="h3"
                fontWeight={800}
                color="text.primary"
                sx={{
                  fontSize: { xs: "1.75rem", md: "2.25rem" },
                  letterSpacing: "-0.5px",
                }}
              >
                Some of the Upcoming Bazaars
              </Typography>
            </Box>
            <Button
              variant="text"
              endIcon={<EastIcon />}
              href="/dashboards/vendor/bazaars"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "primary.main",
                display: { xs: "none", md: "flex" },
              }}
            >
              View All
            </Button>
          </Stack>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Discover exciting bazaar events and register to showcase your products
          </Typography>
        </Box>

        {loadingBazaars ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={48} thickness={4} />
          </Box>
        ) : bazaars.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 3,
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.15)}`,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <StorefrontIcon
              sx={{
                fontSize: 60,
                color: alpha(theme.palette.primary.main, 0.3),
                mb: 2,
              }}
            />
            <Typography variant="h6" fontWeight={600} color="text.primary" mb={1}>
              No Bazaars Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back soon for exciting new bazaar opportunities
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={4}>
              {bazaars.map((bazaar, index) => (
                <Grid size={{xs: 12, md: 4}} key={bazaar._id || index} >
                  <BazaarCard bazaar={bazaar} index={index} />
                </Grid>
              ))}
            </Grid>
           
          </>
        )}
      </Container>

      {/* Quick Access Section */}
      <Container maxWidth="lg" sx={{ pb: 10 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="overline"
            sx={{
              color: "primary.main",
              fontWeight: 700,
              letterSpacing: 2,
              fontSize: "0.875rem",
            }}
          >
            QUICK ACCESS
          </Typography>
          <Typography
            variant="h4"
            fontWeight={700}
            color="text.primary"
            sx={{
              fontSize: { xs: "1.5rem", md: "1.75rem" },
              letterSpacing: "-0.5px",
              mt: 1,
            }}
          >
            Navigate Your Dashboard
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid size={{xs: 12, sm: 4}} key={index}>
              <FeatureCardCompact {...feature} />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Dialog for Loyalty Program Application */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 60px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            Apply to GUC Loyalty Program
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Fill in the details to join our exclusive program
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 2 }}>
            <TextField
              label="Discount Rate (%)"
              type="number"
              value={discountRate}
              onChange={(e) => setDiscountRate(e.target.value)}
              fullWidth
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              label="Promo Code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              fullWidth
              placeholder="e.g., GUC2024"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              label="Terms and Conditions"
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Enter your terms and conditions..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)} 
            disabled={submitting}
            sx={{ 
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "secondary.dark",
              "&:hover": { bgcolor: "secondary.main" },
            }}
          >
            {submitting && <CircularProgress size={20} sx={{ mr: 1 }} />}
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog 
        open={openCancelDialog} 
        onClose={() => setOpenCancelDialog(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 60px ${alpha(theme.palette.error.main, 0.2)}`,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight={700} color="error">
            Cancel Application?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to cancel your loyalty program application? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setOpenCancelDialog(false)} 
            disabled={submitting}
            sx={{ 
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Keep Application
          </Button>
          <Button 
            onClick={handleCancelConfirm} 
            variant="contained" 
            color="error"
            disabled={submitting}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {submitting && <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />}
            Yes, Cancel It
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 60px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.secondary.main, 0.15),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LoyaltyIcon sx={{ fontSize: 24, color: "secondary.dark" }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Your Application Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                GUC Loyalty Program
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stack spacing={3}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  display="block"
                  sx={{ mb: 0.5 }}
                >
                  Discount Rate
                </Typography>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {applicationData?.discountRate}%
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  display="block"
                  sx={{ mb: 1 }}
                >
                  Promo Code
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    border: `2px dashed ${alpha(theme.palette.secondary.main, 0.3)}`,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="secondary.dark"
                    sx={{ letterSpacing: 2 }}
                  >
                    {applicationData?.promoCode}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  display="block"
                  sx={{ mb: 1 }}
                >
                  Terms and Conditions
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.grey[500], 0.04),
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.1)}`,
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}
                  >
                    {applicationData?.termsAndConditions}
                  </Typography>
                </Paper>
              </Box>

              {applicationData?.status && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    display="block"
                    sx={{ mb: 1 }}
                  >
                    Application Status
                  </Typography>
                  <Chip
                    label={applicationData.status.toUpperCase()}
                    sx={{
                      bgcolor: alpha(
                        applicationData.status === "approved"
                          ? theme.palette.success.main
                          : applicationData.status === "pending"
                          ? theme.palette.warning.main
                          : theme.palette.error.main,
                        0.15
                      ),
                      color:
                        applicationData.status === "approved"
                          ? "success.dark"
                          : applicationData.status === "pending"
                          ? "warning.dark"
                          : "error.dark",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      height: 28,
                      border: `1px solid ${alpha(
                        applicationData.status === "approved"
                          ? theme.palette.success.main
                          : applicationData.status === "pending"
                          ? theme.palette.warning.main
                          : theme.palette.error.main,
                        0.3
                      )}`,
                    }}
                  />
                </Box>
              )}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setOpenViewDialog(false)} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "secondary.dark",
              "&:hover": { bgcolor: "secondary.main" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </BasicLayout>
  );
}