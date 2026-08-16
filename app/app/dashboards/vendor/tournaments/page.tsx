"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Container,
  alpha,
  Chip,
  Stack,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  Paper,
  Fade,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { FactCheck, Rule } from "@mui/icons-material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupsIcon from "@mui/icons-material/Groups";
import MoneyIcon from "@mui/icons-material/Money";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CancelIcon from "@mui/icons-material/Cancel";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SendIcon from "@mui/icons-material/Send";
import BasicLayout from "@/components/layouts/basicLayout2";
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

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  endDate: string;
  location: string;
  address?: string;
  isSponsorshipOpen: boolean;
  maxTeams: number;
  currentTeams: number;
  availableSlots: number;
  entryFee?: number;
}

interface Application {
  _id: string;
  tournamentId: {
    _id: string;
    name: string;
    sport: string;
    startDate: string;
    endDate: string;
    location: string;
  };
  proposedTier: string;
  proposedAmount: number;
  message: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paidAmount: number;
  createdAt: string;
}

// Tournament Card Component - Styled to match requestStatus page
const TournamentCard = ({
  tournament,
  onApply,
  onViewDetails,
  isAlreadyApplied = false,
  index = 0,
}: {
  tournament: Tournament;
  onApply: (t: Tournament) => void;
  onViewDetails: (t: Tournament) => void;
  isAlreadyApplied?: boolean;
  index?: number;
}) => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    const colors: any = {
      "Open for Registration": "success",
      "Sponsorship Open": "primary",
      "In Progress": "warning",
      Completed: "default",
      Draft: "default",
      Cancelled: "error",
    };
    return colors[status] || "default";
  };

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
        onClick={() => onViewDetails(tournament)}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.08),
          bgcolor: "white",
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
                label={tournament.sport.toUpperCase()}
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
              {tournament.isSponsorshipOpen && (
                <Chip
                  label="$50"
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    color: theme.palette.success.dark,
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    letterSpacing: "0.5px",
                    height: 24,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
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
              {tournament.name}
            </Typography>
          </Box>

          <Divider
            sx={{ my: 2, borderColor: alpha(theme.palette.primary.main, 0.06) }}
          />

          {/* Info Stack */}
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
                  {formatDate(tournament.startDate)} → {formatDate(tournament.endDate)}
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
                  {tournament.location}
                </Typography>
              </Box>
            </Box>

            {/* Status Badge */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: tournament.isSponsorshipOpen
                  ? alpha(theme.palette.success.main, 0.08)
                  : alpha(theme.palette.warning.main, 0.08),
                border: `1px solid ${
                  tournament.isSponsorshipOpen
                    ? alpha(theme.palette.success.main, 0.2)
                    : alpha(theme.palette.warning.main, 0.2)
                }`,
              }}
            >
              <Box
                sx={{
                  color: tournament.isSponsorshipOpen
                    ? theme.palette.success.main
                    : theme.palette.warning.main,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {tournament.isSponsorshipOpen ? (
                  <CheckCircleIcon sx={{ fontSize: 18 }} />
                ) : (
                  <PendingIcon sx={{ fontSize: 18 }} />
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  display="block"
                  sx={{
                    color: tournament.isSponsorshipOpen
                      ? theme.palette.success.main
                      : theme.palette.warning.main,
                    fontSize: "0.65rem",
                    letterSpacing: 0.5,
                    mb: 0.2,
                  }}
                >
                  SPONSORSHIP STATUS
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{
                    color: tournament.isSponsorshipOpen
                      ? theme.palette.success.main
                      : theme.palette.warning.main,
                    fontSize: "0.875rem",
                  }}
                >
                  {tournament.isSponsorshipOpen ? "Open for Sponsors" : tournament.status}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>

        {/* Action Button */}
        {tournament.isSponsorshipOpen && (
          <Box sx={{ p: 3, pt: 0 }}>
            {isAlreadyApplied ? (
              <Chip
                label="Already Applied"
                icon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
                sx={{
                  width: "100%",
                  height: 44,
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                  "& .MuiChip-icon": {
                    color: theme.palette.success.main,
                  },
                }}
              />
            ) : (
              <Button
                fullWidth
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply(tournament);
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1.2,
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                  "&:hover": {
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.45)}`,
                  },
                }}
              >
                Apply for Sponsorship
              </Button>
            )}
          </Box>
        )}
      </Card>
    </Fade>
  );
};

// Application Card Component - Styled to match requestStatus page
const ApplicationCard = ({
  application,
  onCancel,
  onCardClick,
  index = 0,
}: {
  application: Application;
  onCancel: (id: string, isPaid: boolean) => void;
  onCardClick?: (application: Application) => void;
  index?: number;
}) => {
  const theme = useTheme();

  // If payment is "Paid", status should show as "Confirmed"
  const displayStatus = application.paymentStatus === "Paid" ? "Confirmed" : application.status;

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return {
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.08),
          borderColor: alpha(theme.palette.success.main, 0.2),
          icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
          label: "Confirmed",
        };
      case "approved":
        return {
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.08),
          borderColor: alpha(theme.palette.success.main, 0.2),
          icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
          label: "Approved",
        };
      case "rejected":
        return {
          color: theme.palette.error.main,
          bgColor: alpha(theme.palette.error.main, 0.08),
          borderColor: alpha(theme.palette.error.main, 0.2),
          icon: <CancelIcon sx={{ fontSize: 18 }} />,
          label: "Rejected",
        };
      default:
        return {
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.08),
          borderColor: alpha(theme.palette.warning.main, 0.2),
          icon: <PendingIcon sx={{ fontSize: 18 }} />,
          label: "Pending",
        };
    }
  };

  const getPaymentConfig = (paymentStatus: string) => {
    switch (paymentStatus?.toLowerCase()) {
      case "paid":
        return {
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.15),
          borderColor: alpha(theme.palette.success.main, 0.3),
          icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
          label: "Paid",
        };
      default:
        return {
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.15),
          borderColor: alpha(theme.palette.warning.main, 0.3),
          icon: <PendingIcon sx={{ fontSize: 14 }} />,
          label: "Unpaid",
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusConfig = getStatusConfig(displayStatus);
  const paymentConfig = getPaymentConfig(application.paymentStatus);

  return (
    <Fade in timeout={400 + index * 100}>
      <Card
        elevation={0}
        onClick={() => onCardClick?.(application)}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.08),
          bgcolor: "white",
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
                label={
                  application.tournamentId && application.tournamentId.sport
                    ? application.tournamentId.sport.toUpperCase()
                    : "UNKNOWN"
                }
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
              {application.tournamentId && application.tournamentId.name
                ? application.tournamentId.name
                : "Unknown Tournament"}
            </Typography>
          </Box>

          <Divider
            sx={{ my: 2, borderColor: alpha(theme.palette.primary.main, 0.06) }}
          />

          {/* Info Stack */}
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
                  {application.tournamentId && application.tournamentId.startDate
                    ? `${formatDate(application.tournamentId.startDate)} → ${formatDate(
                        application.tournamentId.endDate
                      )}`
                    : "Date not available"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
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
                <MoneyIcon sx={{ fontSize: 18, color: "success.main" }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  display="block"
                  sx={{ mb: 0.3 }}
                >
                  Amount Paid
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="success.main"
                  sx={{ fontSize: "0.8rem" }}
                >
                  ${application.paidAmount || application.proposedAmount}
                </Typography>
              </Box>
            </Box>

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

        {/* Cancel Button - Show for pending and confirmed applications */}
        {(application.status === "Pending" || application.paymentStatus === "Paid") && (
          <Box sx={{ p: 3, pt: 0 }}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(application._id, application.paymentStatus === "Paid");
              }}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                py: 1.2,
                borderWidth: 2,
                "&:hover": {
                  borderWidth: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.04),
                },
              }}
            >
              {application.paymentStatus === "Paid" ? "Cancel & Refund to Wallet" : "Cancel Application"}
            </Button>
          </Box>
        )}
      </Card>
    </Fade>
  );
};

// Main Component
const VendorTournamentsPage = () => {
  const theme = useTheme();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [applicationDetailsDialogOpen, setApplicationDetailsDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [tier, setTier] = useState("Standard");
  const [message, setMessage] = useState("");
  const [sportFilter, setSportFilter] = useState("");

  // Get unique sports from tournaments for filter options
  const uniqueSports = useMemo(() => {
    const sports = new Set(tournaments.map((t) => t.sport));
    return Array.from(sports).sort();
  }, [tournaments]);

  // Get set of tournament IDs that user has already applied to
  const appliedTournamentIds = useMemo(() => {
    return new Set(applications.filter((app) => app.tournamentId).map((app) => app.tournamentId._id));
  }, [applications]);

  // Filter tournaments by sport
  const filteredTournaments = useMemo(() => {
    if (!sportFilter) return tournaments;
    return tournaments.filter((t) => t.sport.toLowerCase() === sportFilter.toLowerCase());
  }, [tournaments, sportFilter]);

  // Filter applications by sport
  const filteredApplications = useMemo(() => {
    if (!sportFilter) return applications;
    return applications.filter((a) => a.tournamentId.sport.toLowerCase() === sportFilter.toLowerCase());
  }, [applications, sportFilter]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [applicationToCancel, setApplicationToCancel] = useState<{
    id: string;
    isPaid: boolean;
  } | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });

  useEffect(() => {
    fetchTournaments();
    fetchMyApplications();

    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");

    if (paymentStatus === "cancelled") {
      showSnackbar("Payment was cancelled", "info");
      window.history.replaceState({}, "", "/dashboards/vendor/tournaments");
    }
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/vendor/tournaments");
      setTournaments(response.data.tournaments || []);
    } catch (error: any) {
      showSnackbar(
        error.response?.data?.message || "Failed to fetch tournaments",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const response = await api.get("/api/vendor/tournaments/my-applications");
      setApplications(response.data.applications || []);
    } catch (error: any) {
      console.error("Failed to fetch applications:", error);
    }
  };

  const handleApplyClick = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setApplyDialogOpen(true);
    setPaymentMethod("");
    setTier("");
    setMessage("");
  };

  const handleViewDetails = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setDetailsDialogOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!paymentMethod) {
      showSnackbar("Please select a payment method", "error");
      return;
    }

    if (!selectedTournament) {
      showSnackbar("No tournament selected", "error");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(
        `/api/vendor/tournaments/${selectedTournament._id}/apply`,
        {
          paymentMethod,
          tier: "Standard",
          message,
        }
      );

      console.log("Application response:", response.data);

      if (paymentMethod === "stripe" && response.data.sessionUrl) {
        window.location.href = response.data.sessionUrl;
        return;
      }

      if (paymentMethod === "wallet") {
        showSnackbar("Sponsorship application submitted successfully", "success");
        setApplyDialogOpen(false);
        setSubmitting(false);
        await Promise.all([fetchMyApplications(), fetchTournaments()]);
        return;
      }
    } catch (error: any) {
      console.error("Application submission error:", error);
      console.error("Error response:", error.response);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit application. Please try again.";
      showSnackbar(errorMessage, "error");
      setSubmitting(false);
    }
  };

  const handleCancelApplication = async (applicationId: string, isPaid: boolean) => {
    setApplicationToCancel({ id: applicationId, isPaid });
    setConfirmDialogOpen(true);
  };

  const handleApplicationClick = (application: Application) => {
    setSelectedApplication(application);
    setApplicationDetailsDialogOpen(true);
  };

  const confirmCancelApplication = async () => {
    if (!applicationToCancel) return;

    try {
      setConfirmDialogOpen(false);
      const response = await api.delete(
        `/api/vendor/tournaments/applications/${applicationToCancel.id}`
      );
      const refunded = response.data.refunded;
      const refundAmount = response.data.refundAmount;

      if (refunded && refundAmount > 0) {
        showSnackbar(
          `Application cancelled! $${refundAmount.toFixed(2)} refunded to wallet`,
          "success"
        );
      } else {
        showSnackbar("Application cancelled successfully", "success");
      }

      await fetchMyApplications();
    } catch (error: any) {
      showSnackbar(
        error.response?.data?.message || "Failed to cancel application. Please try again.",
        "error"
      );
    } finally {
      setApplicationToCancel(null);
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error" | "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getSportIcon = (sport: string) => {
    const icons: any = {
      football: "⚽",
      basketball: "🏀",
      tennis: "🎾",
      volleyball: "🏐",
      handball: "🤾",
      pingpong: "🏓",
      "power lifting": "🏋️",
      "cross fit": "💪",
      chess: "♟️",
    };
    return icons[sport.toLowerCase()] || "🏆";
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      "Open for Registration": "success",
      "Sponsorship Open": "primary",
      "In Progress": "warning",
      Completed: "default",
      Draft: "default",
      Cancelled: "error",
    };
    return colors[status] || "default";
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
            backgroundImage: `url('/images/tournament.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "brightness(0.5)",
            zIndex: 1,
          }}
        />
        {/* Gradient Overlay */}
        {/* <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.7)} 0%, ${alpha(theme.palette.secondary.dark, 0.5)} 100%)`,
            zIndex: 1,
          }}
        /> */}
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
                <EmojiEventsIcon sx={{ fontSize: 32, color: "white" }} />
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
                  SPONSORSHIP OPPORTUNITIES
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
                  Tournament Sponsorships
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
              Boost your brand visibility by sponsoring exciting sports
              tournaments. Connect with passionate audiences and showcase your
              business.
            </Typography>

            {/* Stats Row */}
            <Box
              sx={{
                display: "flex",
                gap: 4,
                mt: 4,
                flexWrap: "wrap",
              }}
            >
              <Box
                sx={{
                  bgcolor: alpha("#fff", 0.15),
                  backdropFilter: "blur(10px)",
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  border: `1px solid ${alpha("#fff", 0.2)}`,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: "white" }}
                >
                  {tournaments.length}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: alpha("#fff", 0.8), fontWeight: 500 }}
                >
                  Available Tournaments
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: alpha("#fff", 0.15),
                  backdropFilter: "blur(10px)",
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  border: `1px solid ${alpha("#fff", 0.2)}`,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: "white" }}
                >
                  {applications.length}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: alpha("#fff", 0.8), fontWeight: 500 }}
                >
                  Your Applications
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: alpha("#fff", 0.15),
                  backdropFilter: "blur(10px)",
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  border: `1px solid ${alpha("#fff", 0.2)}`,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: "white" }}
                >
                  $50
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: alpha("#fff", 0.8), fontWeight: 500 }}
                >
                  Sponsorship Fee
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Content Section */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {/* Tabs with Filter */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{
                flex: 1,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  py: 2,
                  minHeight: 60,
                },
                "& .Mui-selected": {
                  fontWeight: 700,
                },
                "& .MuiTabs-indicator": {
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
              }}
            >
              <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <span>Available Tournaments</span>
                  <Chip
                    label={filteredTournaments.length}
                    size="small"
                    color="primary"
                    sx={{
                      height: 22,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <span>My Applications</span>
                  <Chip
                    label={filteredApplications.length}
                    size="small"
                    color="secondary"
                    sx={{
                      height: 22,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  />
                </Box>
              }
            />
          </Tabs>
          {/* Sport Filter - inline with tabs */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 2 }}>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Filter:
            </Typography>
            <TextField
              select
              size="small"
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              sx={{
                minWidth: 150,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "white",
                },
              }}
              SelectProps={{
                displayEmpty: true,
              }}
            >
              <MenuItem value="">
                <em>All Sports</em>
              </MenuItem>
              {uniqueSports.map((sport) => (
                <MenuItem key={sport} value={sport}>
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            {sportFilter && (
              <Button
                size="small"
                onClick={() => setSportFilter("")}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  minWidth: "auto",
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>
        </Paper>

        {/* Loading State */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 12,
            }}
          >
            <CircularProgress size={48} thickness={4} />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Loading tournaments...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Tab Panel 0: Available Tournaments */}
            {tabValue === 0 && (
              <>
                {filteredTournaments.length === 0 ? (
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
                    <EmojiEventsIcon
                      sx={{
                        fontSize: 80,
                        color: alpha(theme.palette.primary.main, 0.3),
                        mb: 2,
                      }}
                    />
                    <Typography variant="h5" fontWeight={700} color="text.primary" mb={1}>
                      {sportFilter ? "No Tournaments Found" : "No Tournaments Available"}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {sportFilter 
                        ? `No ${sportFilter} tournaments available. Try a different sport filter.`
                        : "Check back soon for exciting sponsorship opportunities"
                      }
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={3}>
                    {filteredTournaments.map((tournament, index) => (
                      <Grid size={{xs: 12, sm: 6, md: 3}} key={tournament._id}>
                        <TournamentCard
                          tournament={tournament}
                          onApply={handleApplyClick}
                          onViewDetails={handleViewDetails}
                          isAlreadyApplied={appliedTournamentIds.has(tournament._id)}
                          index={index}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}

            {/* Tab Panel 1: My Applications */}
            {tabValue === 1 && (
              <>
                {filteredApplications.length === 0 ? (
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
                    <WorkspacePremiumIcon
                      sx={{
                        fontSize: 80,
                        color: alpha(theme.palette.primary.main, 0.3),
                        mb: 2,
                      }}
                    />
                    <Typography variant="h5" fontWeight={700} color="text.primary" mb={1}>
                      {sportFilter ? "No Applications Found" : "No Applications Yet"}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mb={3}>
                      {sportFilter
                        ? `No applications for ${sportFilter} tournaments. Try a different sport filter.`
                        : "Start sponsoring tournaments to see your applications here"
                      }
                    </Typography>
                    {!sportFilter && (
                      <Button
                        variant="contained"
                        onClick={() => setTabValue(0)}
                        startIcon={<EmojiEventsIcon />}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: 2,
                          px: 4,
                          py: 1.2,
                        }}
                      >
                        Browse Tournaments
                      </Button>
                    )}
                  </Paper>
                ) : (
                  <Grid container spacing={3}>
                    {filteredApplications.map((application, index) => (
                      <Grid size={{xs: 12, sm: 6, md: 3}} key={application._id}>
                        <ApplicationCard
                          application={application}
                          onCancel={handleCancelApplication}
                          onCardClick={handleApplicationClick}
                          index={index}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </>
        )}
      </Container>

      {/* Apply Dialog */}
      <Dialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: `0 24px 60px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
        }}
      >
        {/* Dialog Header */}
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "white",
            p: 4,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative blur */}
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
          <IconButton
            onClick={() => setApplyDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 12,
              top: 12,
              color: "white",
              bgcolor: alpha("#fff", 0.15),
              "&:hover": { bgcolor: alpha("#fff", 0.25) },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative", zIndex: 1 }}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: alpha("#fff", 0.2),
                borderRadius: 2,
                display: "flex",
                backdropFilter: "blur(10px)",
              }}
            >
              <WorkspacePremiumIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Chip
                label="SPONSORSHIP"
                size="small"
                sx={{
                  bgcolor: alpha("#fff", 0.2),
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  letterSpacing: "0.5px",
                  backdropFilter: "blur(10px)",
                  mb: 1,
                }}
              />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 800, 
                  letterSpacing: "-0.5px",
                  color: "white",
                  textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
              >
                Apply for Sponsorship
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  opacity: 1, 
                  mt: 0.5, 
                  fontWeight: 600,
                  color: "white",
                }}
              >
                {selectedTournament?.name}
              </Typography>
            </Box>
          </Box>
        </Box>

        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            {/* Sponsorship Fee */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                p: 2.5,
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
                <MoneyIcon sx={{ color: "primary.main", fontSize: 28 }} />
              </Box>
              <Box flex={1}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                  display="block"
                  sx={{ mb: 0.5, fontSize: "0.7rem", letterSpacing: 0.5 }}
                >
                  SPONSORSHIP FEE
                </Typography>
                <Typography variant="h4" fontWeight={800} color="primary.main">
                  $50.00
                </Typography>
              </Box>
            </Box>

            {/* Payment Method */}
            <TextField
              select
              fullWidth
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            >
              <MenuItem value="wallet">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <AccountBalanceWalletIcon sx={{ fontSize: 22, color: "primary.main" }} />
                  <span>Pay with Wallet</span>
                </Box>
              </MenuItem>
              <MenuItem value="stripe">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CreditCardIcon sx={{ fontSize: 22, color: "primary.main" }} />
                  <span>Pay with Credit Card</span>
                </Box>
              </MenuItem>
            </TextField>

            {/* Message */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Message (Optional)"
              placeholder="Tell us why you'd like to sponsor this tournament..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0, gap: 1.5 }}>
          <Button
            onClick={() => setApplyDialogOpen(false)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitApplication}
            disabled={submitting || !paymentMethod}
            startIcon={
              submitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : paymentMethod === "stripe" ? (
                <CreditCardIcon />
              ) : (
                <SendIcon />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              px: 4,
              py: 1.2,
              borderRadius: 2,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            {submitting
              ? "Processing..."
              : paymentMethod === "stripe"
              ? "Proceed to Payment"
              : "Submit Application"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog - Styled like requestStatus */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: `0 24px 60px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
        }}
      >
        {/* Dialog Header */}
        <Box
          sx={{
            bgcolor: "primary.main",
            p: 6,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative blur */}
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
                  label={selectedTournament?.sport?.toUpperCase() || "TOURNAMENT"}
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
                {selectedTournament?.isSponsorshipOpen && (
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                    label="Sponsorship Open"
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.15),
                      color: theme.palette.success.light,
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      letterSpacing: "0.5px",
                      "& .MuiChip-icon": {
                        color: `${theme.palette.success.light} !important`,
                      },
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
                {selectedTournament?.name}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setDetailsDialogOpen(false)}
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
          {selectedTournament && (
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="overline"
                  fontWeight={700}
                  color="primary.main"
                  sx={{ fontSize: "0.75rem", letterSpacing: 1.5, mb: 2, display: "block" }}
                >
                  TOURNAMENT DETAILS
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
                      <CalendarTodayIcon sx={{ color: "primary.main", fontSize: 24 }} />
                    </Box>
                    <Box flex={1}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={700}
                        display="block"
                        sx={{ mb: 0.5, fontSize: "0.7rem", letterSpacing: 0.5 }}
                      >
                        EVENT DATES
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {formatDate(selectedTournament.startDate)} to {formatDate(selectedTournament.endDate)}
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
                      <LocationOnIcon sx={{ color: "primary.main", fontSize: 24 }} />
                    </Box>
                    <Box flex={1}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={700}
                        display="block"
                        sx={{ mb: 0.5, fontSize: "0.7rem", letterSpacing: 0.5 }}
                      >
                        LOCATION
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedTournament.location}
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
                      <GroupsIcon sx={{ color: "primary.main", fontSize: 24 }} />
                    </Box>
                    <Box flex={1}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={700}
                        display="block"
                        sx={{ mb: 0.5, fontSize: "0.7rem", letterSpacing: 0.5 }}
                      >
                        TEAMS REGISTERED
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedTournament.currentTeams} / {selectedTournament.maxTeams}
                      </Typography>
                    </Box>
                  </Box>

                  {selectedTournament.isSponsorshipOpen && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
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
                        <WorkspacePremiumIcon sx={{ color: "success.main", fontSize: 24 }} />
                      </Box>
                      <Box flex={1}>
                        <Typography
                          variant="caption"
                          color="success.main"
                          fontWeight={700}
                          display="block"
                          sx={{ mb: 0.5, fontSize: "0.7rem", letterSpacing: 0.5 }}
                        >
                          SPONSORSHIP AVAILABLE
                        </Typography>
                        <Typography variant="body1" fontWeight={600} color="success.main">
                          $50 sponsorship fee
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          This tournament is currently accepting sponsorship applications.
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0, gap: 1.5 }}>
          <Button
            onClick={() => setDetailsDialogOpen(false)}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            Close
          </Button>
          {selectedTournament?.isSponsorshipOpen && (
            appliedTournamentIds.has(selectedTournament._id) ? (
              <Chip
                label="Already Applied"
                icon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
                sx={{
                  height: 44,
                  px: 2,
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                  "& .MuiChip-icon": {
                    color: theme.palette.success.main,
                  },
                }}
              />
            ) : (
              <Button
                variant="contained"
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleApplyClick(selectedTournament);
                }}
                startIcon={<WorkspacePremiumIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 3,
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                }}
              >
                Apply for Sponsorship
              </Button>
            )
          )}
        </DialogActions>
      </Dialog>

      {/* Application Details Dialog */}
      <Dialog
        open={applicationDetailsDialogOpen}
        onClose={() => setApplicationDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: `0 24px 60px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
        }}
      >
        {selectedApplication && (
          <>
            {/* Dialog Header */}
            <Box
              sx={{
                bgcolor: "primary.main",
                p: 6,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative blur */}
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
                      label={selectedApplication.proposedTier.toUpperCase()}
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
                      icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                      label={selectedApplication.paymentStatus === "Paid" ? "Confirmed" : selectedApplication.status}
                      size="small"
                      sx={{
                        bgcolor: selectedApplication.paymentStatus === "Paid"
                          ? alpha(theme.palette.success.main, 0.15)
                          : alpha(theme.palette.warning.main, 0.15),
                        color: selectedApplication.paymentStatus === "Paid"
                          ? theme.palette.success.light
                          : theme.palette.warning.light,
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        letterSpacing: "0.5px",
                        "& .MuiChip-icon": {
                          color: selectedApplication.paymentStatus === "Paid"
                            ? `${theme.palette.success.light} !important`
                            : `${theme.palette.warning.light} !important`,
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
                    {selectedApplication.tournamentId.name}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setApplicationDetailsDialogOpen(false)}
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
                    sx={{ fontSize: "0.75rem", letterSpacing: 1.5, mb: 2, display: "block" }}
                  >
                    SPONSORSHIP DETAILS
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
                        <CalendarTodayIcon sx={{ color: "primary.main", fontSize: 24 }} />
                      </Box>
                      <Box flex={1}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                          display="block"
                          sx={{ mb: 0.5, fontSize: "0.7rem", letterSpacing: 0.5 }}
                        >
                          EVENT DATES
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {new Date(selectedApplication.tournamentId.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} to {new Date(selectedApplication.tournamentId.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
                        <LocationOnIcon sx={{ color: "primary.main", fontSize: 24 }} />
                      </Box>
                      <Box flex={1}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                          display="block"
                          sx={{ mb: 0.5, fontSize: "0.7rem", letterSpacing: 0.5 }}
                        >
                          LOCATION
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedApplication.tournamentId.location}
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
                        bgcolor: alpha(theme.palette.success.main, 0.04),
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
                        <MoneyIcon sx={{ color: "success.main", fontSize: 24 }} />
                      </Box>
                      <Box flex={1}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                          display="block"
                          sx={{ mb: 0.5, fontSize: "0.7rem", letterSpacing: 0.5 }}
                        >
                          AMOUNT PAID
                        </Typography>
                        <Typography variant="body1" fontWeight={600} color="success.main">
                          ${selectedApplication.paidAmount || selectedApplication.proposedAmount}
                        </Typography>
                      </Box>
                    </Box>

                    {selectedApplication.message && (
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
                          <SendIcon sx={{ color: "primary.main", fontSize: 24 }} />
                        </Box>
                        <Box flex={1}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={700}
                            display="block"
                            sx={{ mb: 0.5, fontSize: "0.7rem", letterSpacing: 0.5 }}
                          >
                            YOUR MESSAGE
                          </Typography>
                          <Typography variant="body1" fontWeight={500} sx={{ fontStyle: "italic" }}>
                            "{selectedApplication.message}"
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0, gap: 1.5 }}>
              <Button
                onClick={() => setApplicationDetailsDialogOpen(false)}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                Close
              </Button>
              {(selectedApplication.status === "Pending" || selectedApplication.paymentStatus === "Paid") && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setApplicationDetailsDialogOpen(false);
                    handleCancelApplication(selectedApplication._id, selectedApplication.paymentStatus === "Paid");
                  }}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  Cancel Application
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                bgcolor: alpha(theme.palette.error.main, 0.1),
                borderRadius: 2,
                display: "flex",
              }}
            >
              <CancelIcon sx={{ color: "error.main" }} />
            </Box>
            Cancel Sponsorship Application
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {applicationToCancel?.isPaid
              ? "Are you sure you want to cancel this application? The sponsorship fee ($50) will be refunded to your wallet."
              : "Are you sure you want to cancel this application?"}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
          <Button
            onClick={() => {
              setConfirmDialogOpen(false);
              setApplicationToCancel(null);
            }}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            No, Keep It
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmCancelApplication}
            startIcon={<CancelIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
            }}
          >
            Yes, Cancel & Refund
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </BasicLayout>
  );
};

export default VendorTournamentsPage;
