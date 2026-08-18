"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Fade,
  Container,
  alpha,
  Chip,
  Stack,
  CircularProgress,
  Paper,
  Divider,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  DialogActions,
  DialogTitle,
  DialogContentText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  HourglassEmpty,
  CheckCircle,
  Cancel,
  Pending,
  TrendingUp,
  LocationOn,
  CalendarToday,
  People,
  Close,
  Payment,
  ArrowForward,
  AttachMoney,
} from "@mui/icons-material";
import HomeIcon from "@mui/icons-material/Home";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { FactCheck, Rule } from "@mui/icons-material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BasicLayout from "@/components/layouts/basicLayout2";
import { api } from "@/api";
import AttendeesListPopup from "@/shared/components/AttendeesListPopup";
import { useRouter } from "next/navigation";

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

// Price calculation functions
const calculateBoothPrice = (
  boothSize: string,
  setupDuration: string
): number => {
  const basePrice = boothSize === "2x2" ? 100 : 200;
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

  const weeks = parseInt(setupDuration.split(" ")[0]); // e.g., "2 weeks" → 2
  return basePrice * weeks;
};

const calculateBazaarPrice = (boothSize: string, location: string): number => {
  let basePrice = 0;

  if (boothSize === "2x2") {
    basePrice = 100;
  } else if (boothSize === "4x4") {
    basePrice = 200;
  }

  let locationPrice = 0;

  if (location === "Admission") {
    locationPrice = 100;
  } else if (location === "Green Area") {
    locationPrice = 200;
  } else {
    locationPrice = 300;
  }

  return basePrice + locationPrice;
};

// Enhanced Event Card Component
// Enhanced Event Card Component
const EventCard = ({ event, index, onCardClick, isUpcoming }: any) => {
  const theme = useTheme();

  const name = event.name || "Booth Event";
  const location = event.location || "N/A";
  const start = event.start
    ? new Date(event.start).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";
  const end = event.endDate
    ? new Date(event.endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  // Calculate price based on event type
  let calculatedPrice = 0;
  if (event.boothSize && event.duration) {
    calculatedPrice = calculateBoothPrice(event.boothSize, event.duration);
  } else if (event.boothSize && event.location) {
    calculatedPrice = calculateBazaarPrice(event.boothSize, event.location);
  }

  const price = calculatedPrice;

  // Correct status field - use Pending from backend
  const status = isUpcoming
    ? "Accept" // Force Accept for upcoming events
    : event.Pending || event.status || "Pending";

  // Get payment status - default to Unpaid if not provided
  const paymentStatus = event.paymentStatus || "Unpaid";

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accept":
        return {
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.08),
          borderColor: alpha(theme.palette.success.main, 0.2),
          icon: <CheckCircle sx={{ fontSize: 18 }} />,
          label: "Accepted",
        };
      case "reject":
        return {
          color: theme.palette.error.main,
          bgColor: alpha(theme.palette.error.main, 0.08),
          borderColor: alpha(theme.palette.error.main, 0.2),
          icon: <Cancel sx={{ fontSize: 18 }} />,
          label: "Rejected",
        };
      default:
        return {
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.08),
          borderColor: alpha(theme.palette.warning.main, 0.2),
          icon: <Pending sx={{ fontSize: 18 }} />,
          label: "Pending",
        };
    }
  };

  const getPaymentStatusConfig = (paymentStatus: string) => {
    switch (paymentStatus?.toLowerCase()) {
      case "paid":
        return {
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.15),
          borderColor: alpha(theme.palette.success.main, 0.3),
          icon: <CheckCircle sx={{ fontSize: 14 }} />,
          label: "Paid",
        };
      default:
        return {
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.15),
          borderColor: alpha(theme.palette.warning.main, 0.3),
          icon: <Payment sx={{ fontSize: 14 }} />,
          label: "Unpaid",
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const paymentConfig = getPaymentStatusConfig(paymentStatus);

  return (
    <Fade in timeout={400 + index * 100}>
      <Card
        elevation={0}
        onClick={() => onCardClick(event)}
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
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              mb={1.5}
            >
              <Chip
                label="EVENT"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: "primary.main",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  letterSpacing: "0.5px",
                  height: 24,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              />

              {/* Payment Status Chip - Only show for upcoming events */}
              {isUpcoming && (
                <Chip
                  icon={paymentConfig.icon}
                  label={paymentConfig.label}
                  size="small"
                  sx={{
                    bgcolor: paymentConfig.bgColor,
                    color: paymentConfig.color,
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    letterSpacing: "0.5px",
                    height: 24,
                    border: `1px solid ${paymentConfig.borderColor}`,
                    "& .MuiChip-icon": {
                      color: `${paymentConfig.color} !important`,
                      fontSize: "14px",
                    },
                  }}
                />
              )}

              {/* Price Chip - Show for requested events or if not upcoming */}
              {!isUpcoming && price > 0 && (
                <Chip
                  icon={<AttachMoney sx={{ fontSize: 14 }} />}
                  label={`$${price}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    color: theme.palette.success.dark,
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    letterSpacing: "0.5px",
                    height: 24,
                    border: `1px solid ${alpha(
                      theme.palette.success.main,
                      0.3
                    )}`,
                  }}
                />
              )}
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
              {name}
            </Typography>
          </Box>

          <Divider
            sx={{ my: 2, borderColor: alpha(theme.palette.primary.main, 0.06) }}
          />

          {/* Rest of the card content remains the same */}
          <Stack spacing={1.5}>
            {/* ... existing info sections ... */}

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
                <CalendarToday sx={{ fontSize: 18, color: "primary.main" }} />
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
                  {start} → {end}
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
                <LocationOn sx={{ fontSize: 18, color: "primary.main" }} />
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
                  {location}
                </Typography>
              </Box>
            </Box>

            {/* Price Display */}
            {price > 0 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                    borderRadius: 1.5,
                    p: 0.8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AttachMoney sx={{ fontSize: 18, color: "success.main" }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    display="block"
                    sx={{ mb: 0.3 }}
                  >
                    Price
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="success.main"
                    sx={{ fontSize: "0.8rem" }}
                  >
                    ${price}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Status Badge */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: statusConfig.bgColor,
                border: `1px solid ${statusConfig.borderColor}`,
              }}
            >
              <Box
                sx={{
                  color: statusConfig.color,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {statusConfig.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  display="block"
                  sx={{
                    color: statusConfig.color,
                    fontSize: "0.65rem",
                    letterSpacing: 0.5,
                    mb: 0.2,
                  }}
                >
                  APPLICATION STATUS
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{
                    color: statusConfig.color,
                    fontSize: "0.875rem",
                  }}
                >
                  {statusConfig.label}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Fade>
  );
};

// Enhanced Event Details Dialog Component
// Enhanced Event Details Dialog Component
const EventDetailsDialog = ({
  open,
  onClose,
  event,
  onViewAttendees,
  onProceedToPayment,
  onCancelRegistration,
  cancelDialogOpen,
  onCancelDialogClose,
  onConfirmCancelRegistration,
}: any) => {
  const theme = useTheme();

  if (!event) return null;

  const name = event.name || "Booth Event";
  const location = event.location || "N/A";
  const start = event.start
    ? new Date(event.start).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";
  const end = event.endDate
    ? new Date(event.endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  // Calculate price based on event type
  let calculatedPrice = 0;
  if (event.boothSize && event.duration) {
    calculatedPrice = calculateBoothPrice(event.boothSize, event.duration);
  } else if (event.boothSize && event.location) {
    calculatedPrice = calculateBazaarPrice(event.boothSize, event.location);
  }

  const price = calculatedPrice;

  // Status and payment info
  const status = event.Pending || event.status || "Pending";
  const paymentStatus = event.paymentStatus || "Unpaid";

  // Registration deadline logic
  console.log(event.deadline);
  const registrationDeadline = event.deadline
    ? new Date(event.deadline)
    : event.start
    ? new Date(new Date(event.start).getTime() - 7 * 24 * 60 * 60 * 1000) // Default: 7 days before event
    : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000); // Fallback: 7 days from now

  const now = new Date();
  const isDeadlinePassed = now > registrationDeadline;
  const isApplicationCancelled = isDeadlinePassed && paymentStatus === "Unpaid";

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accept":
        return {
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.08),
          borderColor: alpha(theme.palette.success.main, 0.2),
          icon: <CheckCircle sx={{ fontSize: 20 }} />,
          label: "Accepted",
        };
      case "reject":
        return {
          color: theme.palette.error.main,
          bgColor: alpha(theme.palette.error.main, 0.08),
          borderColor: alpha(theme.palette.error.main, 0.2),
          icon: <Cancel sx={{ fontSize: 20 }} />,
          label: "Rejected",
        };
      default:
        return {
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.08),
          borderColor: alpha(theme.palette.warning.main, 0.2),
          icon: <Pending sx={{ fontSize: 20 }} />,
          label: "Pending",
        };
    }
  };

  const getPaymentStatusConfig = (paymentStatus: string) => {
    switch (paymentStatus?.toLowerCase()) {
      case "paid":
        return {
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.15),
          borderColor: alpha(theme.palette.success.main, 0.3),
          icon: <CheckCircle sx={{ fontSize: 16 }} />,
          label: "Paid",
          variant: "filled" as const,
        };
      default:
        return {
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.15),
          borderColor: alpha(theme.palette.warning.main, 0.3),
          icon: <Payment sx={{ fontSize: 16 }} />,
          label: "Unpaid",
          variant: "filled" as const,
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const paymentConfig = getPaymentStatusConfig(paymentStatus);

  // Only show payment buttons for accepted, unpaid events where deadline hasn't passed
  const showPaymentButtons =
    status?.toLowerCase() === "accept" &&
    paymentStatus?.toLowerCase() === "unpaid" &&
    !isApplicationCancelled;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: `0 24px 60px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
        }}
      >
        <Box
          sx={{
            bgcolor: "primary.main",
            p: 6,
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
              <Stack direction="row" spacing={1} mb={2} alignItems="center">
                <Chip
                  label="EVENT"
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
                <Chip
                  icon={paymentConfig.icon}
                  label={paymentConfig.label}
                  size="small"
                  variant={paymentConfig.variant}
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    letterSpacing: "0.5px",
                    bgcolor: paymentConfig.bgColor,
                    color: paymentConfig.color,
                    borderColor: paymentConfig.borderColor,
                    "& .MuiChip-icon": {
                      color: `${paymentConfig.color} !important`,
                    },
                  }}
                />
              </Stack>
              <Typography
                variant="h4"
                fontWeight={800}
                color="white"
                sx={{ letterSpacing: "-0.5px" }}
              >
                {name}
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                color: "white",
                bgcolor: alpha("#fff", 0.15),
                "&:hover": { bgcolor: alpha("#fff", 0.25) },
              }}
            >
              <Close />
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
                    <CalendarToday
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
                      {start} to {end}
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
                    <LocationOn sx={{ color: "primary.main", fontSize: 24 }} />
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
                      LOCATION
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {location}
                    </Typography>
                  </Box>
                </Box>

                {/* Registration Deadline - Show for unpaid events */}
                {paymentStatus === "Unpaid" && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: isApplicationCancelled
                        ? alpha(theme.palette.error.main, 0.04)
                        : alpha(theme.palette.warning.main, 0.04),
                      border: `1px solid ${
                        isApplicationCancelled
                          ? alpha(theme.palette.error.main, 0.2)
                          : alpha(theme.palette.warning.main, 0.2)
                      }`,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: isApplicationCancelled
                          ? alpha(theme.palette.error.main, 0.1)
                          : alpha(theme.palette.warning.main, 0.1),
                        borderRadius: 2,
                        p: 1.5,
                        display: "flex",
                      }}
                    >
                      {isApplicationCancelled ? (
                        <Cancel sx={{ color: "error.main", fontSize: 24 }} />
                      ) : (
                        <HourglassEmpty
                          sx={{ color: "warning.main", fontSize: 24 }}
                        />
                      )}
                    </Box>
                    <Box flex={1}>
                      <Typography
                        variant="caption"
                        color={
                          isApplicationCancelled ? "error.main" : "warning.main"
                        }
                        fontWeight={700}
                        display="block"
                        sx={{
                          fontSize: "0.7rem",
                          letterSpacing: 0.5,
                          mb: 0.2,
                        }}
                      >
                        {isApplicationCancelled
                          ? "APPLICATION CANCELLED"
                          : "REGISTRATION DEADLINE"}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        color={
                          isApplicationCancelled ? "error.main" : "warning.main"
                        }
                      >
                        {registrationDeadline.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Typography>
                      <Typography
                        variant="body2"
                        color={
                          isApplicationCancelled
                            ? "error.main"
                            : "text.secondary"
                        }
                        sx={{ mt: 0.5 }}
                      >
                        {isApplicationCancelled
                          ? "Your application has been cancelled because payment was not completed before the deadline."
                          : "Complete payment before this deadline to secure your booth."}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Price Information */}
                {price > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.04),
                      border: `1px solid ${alpha(
                        theme.palette.success.main,
                        0.2
                      )}`,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        borderRadius: 2,
                        p: 1.5,
                        display: "flex",
                      }}
                    >
                      <AttachMoney
                        sx={{ color: "success.main", fontSize: 24 }}
                      />
                    </Box>
                    <Box flex={1}>
                      <Typography
                        variant="caption"
                        color="success.main"
                        fontWeight={700}
                        display="block"
                        sx={{
                          fontSize: "0.7rem",
                          letterSpacing: 0.5,
                          mb: 0.2,
                        }}
                      >
                        {paymentStatus === "Paid" ? "PAID AMOUNT" : "PRICE"}
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        color="success.main"
                      >
                        ${price}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {paymentStatus === "Paid"
                          ? "Amount successfully paid"
                          : "Total amount due for registration"}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Status Badge in Dialog */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: statusConfig.bgColor,
                    border: `1px solid ${statusConfig.borderColor}`,
                  }}
                >
                  <Box
                    sx={{
                      color: statusConfig.color,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {statusConfig.icon}
                  </Box>
                  <Box flex={1}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      display="block"
                      sx={{
                        color: statusConfig.color,
                        fontSize: "0.7rem",
                        letterSpacing: 0.5,
                        mb: 0.2,
                      }}
                    >
                      APPLICATION STATUS
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={700}
                      sx={{
                        color: statusConfig.color,
                      }}
                    >
                      {statusConfig.label}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>

            {event.description && (
              <>
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
                    ABOUT THIS EVENT
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{ lineHeight: 1.8 }}
                  >
                    {event.description}
                  </Typography>
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>

        <Box
          sx={{
            p: 3,
            display: "flex",
            gap: 2,
            justifyContent: "flex-end",
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            flexDirection: "column",
          }}
        >
          {/* Payment Action Buttons - Only show for accepted, unpaid events where deadline hasn't passed */}
          {showPaymentButtons && (
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.04),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.primary"
                >
                  Payment Required
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Complete payment of ${price} to secure your booth
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  onClick={onCancelRegistration}
                  variant="outlined"
                  color="error"
                  size="large"
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                  }}
                >
                  Cancel Registration
                </Button>
                <Button
                  onClick={onProceedToPayment}
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    px: 4,
                    bgcolor: theme.palette.success.main,
                    boxShadow: `0 4px 14px ${alpha(
                      theme.palette.success.main,
                      0.3
                    )}`,
                    "&:hover": {
                      bgcolor: theme.palette.success.dark,
                      boxShadow: `0 6px 18px ${alpha(
                        theme.palette.success.main,
                        0.4
                      )}`,
                    },
                  }}
                >
                  Pay ${price}
                </Button>
              </Box>
            </Box>
          )}

          {/* Show cancelled message if application is cancelled */}
          {isApplicationCancelled && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.error.main, 0.04),
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              }}
            >
              <Typography variant="body2" fontWeight={600} color="error.main">
                Application Cancelled
              </Typography>
              <Typography variant="caption" color="error.main">
                Your application has been automatically cancelled because
                payment was not completed before the registration deadline.
              </Typography>
            </Box>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="space-between">
            <Button
              onClick={onClose}
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

            <Box display="flex" gap={2}>
              <Button
                onClick={onViewAttendees}
                variant="contained"
                size="large"
                startIcon={<People />}
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
                View Attendees
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>

      {/* Cancel Registration Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={onCancelDialogClose}
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Cancel Registration
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your registration for{" "}
            <strong>{name}</strong>? This action cannot be undone and you will
            lose your booth reservation.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={onCancelDialogClose}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
            }}
          >
            Keep Registration
          </Button>
          <Button
            onClick={onConfirmCancelRegistration}
            variant="contained"
            color="error"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
            }}
          >
            Yes, Cancel Registration
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default function RequestStatusPage() {
  const theme = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [filter, setFilter] = useState("All");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [attendeesPopupOpen, setAttendeesPopupOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoint =
        tab === 0
          ? "/api/vendorTwo/upcoming-events"
          : "/api/vendorTwo/requested-events";

      const res = await api.get(endpoint);
      setEvents(res.data.data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  const filteredEvents =
    tab === 0
      ? events // Show all upcoming events without filtering
      : filter === "All"
      ? events
      : events.filter(
          (e) => (e.Pending || e.status)?.toLowerCase() === filter.toLowerCase()
        );

  const handleCardClick = (event: any) => {
    setSelectedEvent(event);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleViewAttendees = () => {
    setDetailsDialogOpen(false);
    setAttendeesPopupOpen(true);
  };

  const handleCloseAttendeesPopup = () => {
    setAttendeesPopupOpen(false);
    setSelectedEvent(null);
  };

  const handleProceedToPayment = async () => {
    if (!selectedEvent) return;

    try {
      const registrationId = selectedEvent._id || selectedEvent.id;

      // Detect event type: check the 'type' property
      const eventType = selectedEvent.type === "Bazaar" ? "bazaar" : "booths";

      const endpoint = `/api/payments/${eventType}/${registrationId}/pay`;

      const { data } = await api.post(endpoint, {
        paymentMethod: "card",
      });

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No payment URL returned from server");
        alert("Payment processing error. Please try again.");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Payment failed. Please try again."
      );
    }
  };

  const handleCancelRegistration = () => {
    // Open confirmation dialog instead of directly redirecting
    setCancelDialogOpen(true);
  };

  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false);
  };

  const handleConfirmCancelRegistration = async () => {
    if (!selectedEvent) return;

    try {
      const registrationId = selectedEvent._id || selectedEvent.id;
      const eventType = selectedEvent.type === "Bazaar" ? "bazaar" : "booths";
      const endpoint = `/api/payments/${eventType}/${registrationId}/cancel`;

      await api.post(endpoint);

      setCancelDialogOpen(false);
      setDetailsDialogOpen(false);
      setSelectedEvent(null);
      fetchData();
    } catch (err: any) {
      console.error("Cancel error:", err);
    }
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
            backgroundImage: `url('/images/status.jpg')`,
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
                <CalendarToday sx={{ fontSize: 32, color: "white" }} />
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
                  APPLICATION TRACKING
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
                  {tab === 0 ? "Upcoming Events" : "Requested Events"}
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
              Track your booth applications and view upcoming events where
              you&apos;ve been accepted.
            </Typography>
          </Container>
        </Box>
      </Box>

      {/* Content Section */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {/* Tabs and Filter */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 2,
            borderRadius: 3,
            bgcolor: "white",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Tabs
              value={tab}
              onChange={(e, v) => setTab(v)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                "& .MuiTab-root": {
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  px: 3,
                },
                "& .Mui-selected": {
                  color: "primary.main",
                },
              }}
            >
              <Tab label="Upcoming Events" />
              <Tab label="Requested Events" />
            </Tabs>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel sx={{ fontWeight: 500 }}>Filter by Status</InputLabel>
              <Select
                value={filter}
                label="Filter by Status"
                onChange={(e) => setFilter(e.target.value)}
                disabled={tab === 0} // Disable filter on Upcoming Events tab
                sx={{
                  borderRadius: 2,
                  fontWeight: 500,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderWidth: 1.5,
                  },
                }}
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Reject">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Event Cards */}
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={10}
          >
            <CircularProgress size={48} thickness={4} />
          </Box>
        ) : filteredEvents.length === 0 ? (
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
            <HourglassEmpty
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
              No Events Found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              No {tab === 0 ? "upcoming" : "requested"} events match your
              current filter
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={4}>
            {filteredEvents.map((event, i) => (
              <Grid size={{xs: 12, sm: 6, md: 4}} key={i}>
                <EventCard
                  event={event}
                  index={i}
                  onCardClick={handleCardClick}
                  isUpcoming={tab === 0}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        event={selectedEvent}
        onViewAttendees={handleViewAttendees}
        onProceedToPayment={handleProceedToPayment}
        onCancelRegistration={handleCancelRegistration}
        cancelDialogOpen={cancelDialogOpen}
        onCancelDialogClose={handleCancelDialogClose}
        onConfirmCancelRegistration={handleConfirmCancelRegistration}
      />

      {/* Attendees Popup */}
      {selectedEvent && (
        <AttendeesListPopup
          open={attendeesPopupOpen}
          onClose={handleCloseAttendeesPopup}
          attendees={selectedEvent.attendees || []}
          photoIDs={selectedEvent.photos || []}
        />
      )}
    </BasicLayout>
  );
}
