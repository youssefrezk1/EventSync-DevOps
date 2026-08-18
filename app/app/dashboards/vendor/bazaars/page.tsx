"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Chip,
  Stack,
  Container,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { FactCheck, Rule } from "@mui/icons-material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BasicLayout from "@/components/layouts/basicLayout2";
import ApplyToBazaarDialog from "@/components/ApplyToBazaarDialog";
import Grid from "@mui/material/Grid";
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

// BazaarCard Component
const BazaarCard = ({ bazaar, onViewDetails }: any) => {
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateRange = (start: string, end: string) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <Card
      elevation={0}
      onClick={() => onViewDetails(bazaar)}
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
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.12)}`,
          borderColor: theme.palette.primary.light,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header Section */}
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
              "Join us for an exciting bazaar event filled with opportunities to showcase your products and connect with customers."}
          </Typography>
        </Box>

        <Divider
          sx={{ my: 1, borderColor: alpha(theme.palette.primary.main, 0.06) }}
        />

        {/* Info Grid */}
        <Stack spacing={1.5}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 0.5,
            }}
          >
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
                {formatDateRange(bazaar.start, bazaar.endDate || bazaar.start)}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
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

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
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
    </Card>
  );
};

// Main Component
export default function BazaarsPage() {
  const theme = useTheme();
  const [bazaars, setBazaars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedBazaar, setSelectedBazaar] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    const fetchBazaars = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found. Please log in.");
        return;
      }

      setLoading(true);
      try {
        const res = await axios.get(
          "/api/vendorOne/upcoming-bazaars",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBazaars(res.data);
      } catch (err) {
        console.error("Error fetching bazaars:", err);
        setSnackbar({
          open: true,
          message: "Failed to load bazaars",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBazaars();
  }, []);

  const handleOpenApply = (bazaar: any) => {
    if (bazaar.hasApplied) return;
    setSelectedBazaar(bazaar);
    setApplyDialogOpen(true);
  };

  const handleCloseApply = () => {
    setApplyDialogOpen(false);
    setSelectedBazaar(null);
  };

  const handleOpenDetails = (bazaar: any) => {
    setSelectedBazaar(bazaar);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedBazaar(null);
  };

  const handleSubmitApplication = async (formData: any) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setSnackbar({
        open: true,
        message: "You must be logged in to apply",
        severity: "error",
      });
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("BazaarName", selectedBazaar._id);
      formDataToSend.append("Attendees", JSON.stringify(formData.Attendees));
      formDataToSend.append("BoothSize", formData.boothSize);
      formData.PhotoIDs.forEach((file: File, index: number) => {
        formDataToSend.append("PhotoIDs", file);
      });

      const res = await api.post(
        "api/vendorOne/apply-to-bazaar",
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setBazaars((prevBazaars) =>
        prevBazaars.map((bazaar) =>
          bazaar._id === selectedBazaar._id
            ? { ...bazaar, hasApplied: true }
            : bazaar
        )
      );

      setSnackbar({
        open: true,
        message: "Application submitted successfully!",
        severity: "success",
      });

      handleCloseApply();
    } catch (error: any) {
      console.error("Error applying to bazaar:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error applying to bazaar",
        severity: "error",
      });
    }
  };

  const handleLoadMore = () => setVisibleCount((prev) => prev + 8);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <BasicLayout menuItems={menuItems}>
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
            backgroundImage: `url('/images/bazaar.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "brightness(0.4)",
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
          <Container
            maxWidth="lg"
            sx={{
              position: "relative",
              zIndex: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Box
                sx={{
                  mt: 4,
                  bgcolor: alpha("#fff", 0.2),
                  backdropFilter: "blur(10px)",
                  p: 1.5,
                  borderRadius: 2,
                  display: "flex",
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    color: alpha("#fff", 0.9),
                    fontWeight: 700,
                    letterSpacing: 2,
                    fontSize: "0.75rem",
                  }}
                >
                  VENDOR OPPORTUNITIES
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={800}
                  color="white"
                  sx={{
                    fontSize: { xs: "2rem", md: "2.5rem" },
                    letterSpacing: "-0.5px",
                  }}
                >
                  Upcoming Bazaars
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: alpha("#fff", 0.95),
                fontWeight: 400,
                maxWidth: 600,
                fontSize: "1.1rem",
                lineHeight: 1.6,
              }}
            >
              Discover exciting opportunities to showcase your products and grow
              your business at our premium bazaar events.
            </Typography>
          </Container>
        </Box>
      </Box>

      {/* Content Section */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={10}
          >
            <CircularProgress size={48} thickness={4} />
          </Box>
        ) : bazaars.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: "center",
              borderRadius: 4,
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.15)}`,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <StorefrontIcon
              sx={{
                fontSize: 80,
                color: alpha(theme.palette.primary.main, 0.3),
                mb: 2,
              }}
            />
            <Typography
              variant="h5"
              fontWeight={700}
              color="text.primary"
              mb={1}
            >
              No Bazaars Available
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Check back soon for exciting new bazaar opportunities
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={4}>
              {bazaars.slice(0, visibleCount).map((bazaar) => (
                <Grid size={{xs: 12, sm: 6, md: 4}} key={bazaar._id}>
                  <BazaarCard
                    bazaar={bazaar}
                    onViewDetails={handleOpenDetails}
                  />
                </Grid>
              ))}
            </Grid>

            {visibleCount < bazaars.length && (
              <Box display="flex" justifyContent="center" mt={6}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleLoadMore}
                  sx={{
                    borderRadius: 3,
                    px: 5,
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "1rem",
                    boxShadow: `0 6px 20px ${alpha(
                      theme.palette.primary.main,
                      0.3
                    )}`,
                    "&:hover": {
                      boxShadow: `0 8px 24px ${alpha(
                        theme.palette.primary.main,
                        0.4
                      )}`,
                    },
                  }}
                >
                  Load More Bazaars
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Apply Dialog */}
     <ApplyToBazaarDialog
  open={applyDialogOpen}
  onClose={handleCloseApply}
  onSubmit={handleSubmitApplication}
  bazaarLocation={selectedBazaar?.location} // Pass the bazaar location
/>
      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: `0 24px 60px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
        }}
      >
        {selectedBazaar && (
          <>
            <Box
              sx={{
                bgcolor: "primary.main",
                p: 4,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: -30,
                  right: -30,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  bgcolor: alpha("#fff", 0.1),
                  filter: "blur(40px)",
                }}
              />

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                position="relative"
                zIndex={1}
              >
                <Box flex={1}>
                  <Stack direction="row" spacing={1} mb={2}>
                    <Chip
                      label="BAZAAR"
                      size="small"
                      sx={{
                        bgcolor: alpha("#fff", 0.2),
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        letterSpacing: "0.5px",
                        backdropFilter: "blur(10px)",
                      }}
                    />
                    {selectedBazaar.hasApplied && (
                      <Chip
                        icon={
                          <CheckCircleIcon
                            sx={{ fontSize: 14, color: "white !important" }}
                          />
                        }
                        label="APPLIED"
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.success.main, 0.9),
                          color: "white",
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          letterSpacing: "0.5px",
                        }}
                      />
                    )}
                  </Stack>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    color="white"
                    sx={{ letterSpacing: "-0.5px" }}
                  >
                    {selectedBazaar.name}
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleCloseDetails}
                  sx={{
                    color: "white",
                    bgcolor: alpha("#fff", 0.15),
                    "&:hover": { bgcolor: alpha("#fff", 0.25) },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            <DialogContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="overline"
                    fontWeight={700}
                    color="primary.main"
                    sx={{
                      fontSize: "0.75rem",
                      letterSpacing: 1.5,
                      mb: 2,
                      display: "block",
                    }}
                  >
                    EVENT DETAILS
                  </Typography>
                  <Stack spacing={2.5}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      }}
                    >
                      <Box
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          borderRadius: 2,
                          p: 1.5,
                          display: "flex",
                        }}
                      >
                        <CalendarTodayIcon
                          sx={{ color: "primary.main", fontSize: 24 }}
                        />
                      </Box>
                      <Box flex={1}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                          display="block"
                          sx={{
                            mb: 0.5,
                            fontSize: "0.7rem",
                            letterSpacing: 0.5,
                          }}
                        >
                          EVENT DATES
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatDateTime(selectedBazaar.start)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          to{" "}
                          {formatDateTime(
                            selectedBazaar.endDate || selectedBazaar.start
                          )}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.warning.main, 0.04),
                        border: `1px solid ${alpha(
                          theme.palette.warning.main,
                          0.2
                        )}`,
                      }}
                    >
                      <Box
                        sx={{
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          borderRadius: 2,
                          p: 1.5,
                          display: "flex",
                        }}
                      >
                        <EventBusyIcon
                          sx={{ color: "warning.main", fontSize: 24 }}
                        />
                      </Box>
                      <Box flex={1}>
                        <Typography
                          variant="caption"
                          color="warning.main"
                          fontWeight={700}
                          display="block"
                          sx={{
                            mb: 0.5,
                            fontSize: "0.7rem",
                            letterSpacing: 0.5,
                          }}
                        >
                          REGISTRATION DEADLINE
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight={700}
                          color="warning.main"
                        >
                          {formatDateTime(selectedBazaar.registrationDeadline)}
                        </Typography>
                      </Box>
                    </Box>

                    <Stack direction="row" spacing={2}>
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${alpha(
                            theme.palette.primary.main,
                            0.1
                          )}`,
                        }}
                      >
                        <AccessTimeIcon
                          sx={{ color: "primary.main", fontSize: 22 }}
                        />
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            display="block"
                            sx={{ fontSize: "0.65rem" }}
                          >
                            TIME
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {selectedBazaar.time}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${alpha(
                            theme.palette.primary.main,
                            0.1
                          )}`,
                        }}
                      >
                        <LocationOnIcon
                          sx={{ color: "primary.main", fontSize: 22 }}
                        />
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            display="block"
                            sx={{ fontSize: "0.65rem" }}
                          >
                            LOCATION
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {selectedBazaar.location}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="overline"
                    fontWeight={700}
                    color="primary.main"
                    sx={{
                      fontSize: "0.75rem",
                      letterSpacing: 1.5,
                      mb: 2,
                      display: "block",
                    }}
                  >
                    ABOUT THIS BAZAAR
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{ lineHeight: 1.8 }}
                  >
                    {selectedBazaar.shortDescription ||
                      "Join us for an exciting bazaar event filled with opportunities to showcase your products and connect with customers."}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>

            <Box
              sx={{
                p: 3,
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                borderTop: `1px solid ${alpha(
                  theme.palette.primary.main,
                  0.08
                )}`,
              }}
            >
              <Button
                onClick={handleCloseDetails}
                variant="outlined"
                size="large"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 4,
                  borderWidth: 1.5,
                  "&:hover": { borderWidth: 1.5 },
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  handleCloseDetails();
                  handleOpenApply(selectedBazaar);
                }}
                variant="contained"
                size="large"
                disabled={selectedBazaar.hasApplied}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 4,
                  boxShadow: `0 4px 14px ${alpha(
                    theme.palette.primary.main,
                    0.3
                  )}`,
                  "&:hover": {
                    boxShadow: `0 6px 18px ${alpha(
                      theme.palette.primary.main,
                      0.4
                    )}`,
                  },
                }}
              >
                {selectedBazaar.hasApplied ? "Already Applied" : "Apply Now"}
              </Button>
            </Box>
          </>
        )}
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </BasicLayout>
  );}