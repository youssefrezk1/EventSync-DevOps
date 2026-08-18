"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Container,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Divider,
  IconButton,
  Snackbar,
  Paper,
  Stack,
  Avatar,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SchoolIcon from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import SportsIcon from "@mui/icons-material/Sports";
import GroupsIcon from "@mui/icons-material/Groups";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PersonIcon from "@mui/icons-material/Person";
import WalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import PendingIcon from "@mui/icons-material/Pending";
import GroupIcon from "@mui/icons-material/Group";
import EventIcon from "@mui/icons-material/Event";
import RuleIcon from "@mui/icons-material/Rule";
import PaymentIcon from "@mui/icons-material/Payment";

import BasicLayout from "@/components/layouts/basicLayout2";
import { getMenuItemsByRole } from "@/shared/components/getMenuItemsByRole";
import VendorCarousel from "@/shared/components/VendorList";

interface DecodedToken {
  role?: string;
  staffRole?: string;
}

interface TeamMember {
  studentId: string;
  name: string;
  email: string;
  status?: string;
}

interface StudentTeam {
  _id: string;
  teamName: string;
  status: string;
  paymentStatus: string;
  members: TeamMember[];
  captainId: string;
}

interface VendorLogo {
  public_id: string;
  url: string;
}

interface SponsorVendor {
  _id: string;
  companyName: string;
  logo: VendorLogo[];
}

interface Sponsor {
  sponsorId: SponsorVendor;
  tier: string;
  logoUrl: string;
}

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  location: string;
  address: string;
  entryFee: number;
  prize?: string;
  maxTeams: number;
  currentTeams: number;
  teamSize: number;
  rules: string;
  isRegistered: boolean;
  canRegister: boolean;
  studentTeam: StudentTeam | null;
  bracket?: any[];
  registeredTeams?: any[];
  format?: string;
  sponsors?: Sponsor[];
  creator?: {
    firstName: string;
    lastName: string;
  };
}

const api = {
  get: async (url: string) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${url}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.json();
  },
  post: async (url: string, data?: any) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${url}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  },
  delete: async (url: string) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${url}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },
};

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  // Registration dialog state
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"wallet" | "card">("wallet");
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Cancel confirmation
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Helper functions
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Load menu from JWT
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }
      const decoded = jwtDecode<DecodedToken>(token);
      const items = getMenuItemsByRole(decoded.role, decoded.staffRole);
      setMenuItems(items);
    } catch (err) {
      console.error("Failed to decode token", err);
      router.push("/");
    }
  }, [router]);

  // Fetch tournament data
  const fetchTournament = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/student/tournaments/${tournamentId}`);
      if (response.tournament) {
        setTournament(response.tournament);
      } else {
        setError(response.message || "Failed to load tournament");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load tournament");
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      const response = await api.get("/api/payments/getmyWallet");
      if (response.walletBalance !== undefined) {
        setWalletBalance(response.walletBalance);
      }
    } catch (err) {
      console.error("Failed to fetch wallet balance");
    }
  };

  useEffect(() => {
    fetchTournament();
    fetchWalletBalance();
  }, [tournamentId]);

  // Initialize team members
  useEffect(() => {
    if (tournament && tournament.teamSize > 1 && members.length === 0) {
      const emptyMembers = Array(tournament.teamSize - 1)
        .fill(null)
        .map(() => ({
          studentId: "",
          name: "",
          email: "",
        }));
      setMembers(emptyMembers);
    }
  }, [tournament, members.length]);

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle member input changes
  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const updatedMembers = [...members];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setMembers(updatedMembers);
  };

  // Registration submit
  const handleRegistrationSubmit = async () => {
    setRegistrationLoading(true);
    setRegistrationError("");

    try {
      const payload: any = {};
      
      if (tournament && tournament.teamSize > 1) {
        if (!teamName.trim()) {
          setRegistrationError("Team name is required");
          setRegistrationLoading(false);
          return;
        }

        for (let i = 0; i < members.length; i++) {
          if (!members[i].studentId || !members[i].name || !members[i].email) {
            setRegistrationError(`Please fill in all details for teammate ${i + 1}`);
            setRegistrationLoading(false);
            return;
          }
        }

        payload.teamName = teamName;
        payload.members = members;
      }

      const response = await api.post(`/api/student/tournaments/${tournamentId}/register`, payload);

      if (response.success || response.team) {
        setActiveStep(1);
        await fetchTournament();
      } else {
        setRegistrationError(response.message || "Registration failed");
      }
    } catch (err: any) {
      setRegistrationError(err.message || "Registration failed");
    } finally {
      setRegistrationLoading(false);
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!tournament?.studentTeam) return;

    setPaymentLoading(true);

    try {
      const response = await api.post(`/api/student/tournaments/${tournament.studentTeam._id}/pay`, {
        paymentMethod: selectedPaymentMethod,
      });

      if (response.success) {
        if (selectedPaymentMethod === "card" && response.url) {
          window.location.href = response.url;
        } else {
          setSnackbar({
            open: true,
            message: response.message || "Payment successful!",
            severity: "success",
          });
          setShowRegistrationDialog(false);
          setActiveStep(0);
          fetchTournament();
          fetchWalletBalance();
        }
      } else {
        setSnackbar({
          open: true,
          message: response.message || "Payment failed",
          severity: "error",
        });
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || "Payment failed",
        severity: "error",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle cancellation
  const handleCancelRegistration = async () => {
    setCancelLoading(true);

    try {
      const response = await api.delete(`/api/student/tournaments/${tournamentId}/cancel`);

      if (response.success) {
        setSnackbar({
          open: true,
          message: response.message || "Registration cancelled successfully",
          severity: "success",
        });
        setShowCancelDialog(false);
        fetchTournament();
        fetchWalletBalance();
      } else {
        setSnackbar({
          open: true,
          message: response.message || "Cancellation failed",
          severity: "error",
        });
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || "Cancellation failed",
        severity: "error",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <BasicLayout menuItems={menuItems}>
        <Box sx={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress size={60} />
        </Box>
      </BasicLayout>
    );
  }

  // Error state
  if (error || !tournament) {
    return (
      <BasicLayout menuItems={menuItems}>
        <Box sx={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Alert severity="error">{error || "Tournament not found"}</Alert>
        </Box>
      </BasicLayout>
    );
  }

  const daysRemaining = getDaysRemaining(tournament.registrationDeadline);
  const spotsLeft = tournament.maxTeams - tournament.currentTeams;
  const isDeadlinePassed = daysRemaining <= 0;

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
        {/* BREADCRUMB - WORKSHOP STYLE */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2.5,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {/* Left Side - Logo + Breadcrumbs */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            {/* Logo */}
            <Box
              component="img"
              src="/images/EventSubLogo.png"
              alt="EventSync Logo"
              sx={{
                height: 42,
                cursor: "pointer",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  opacity: 0.85,
                },
              }}
              onClick={() => router.push("/dashboards/student")}
            />

            {/* Divider */}
            <Box
              sx={{
                width: 1.5,
                height: 32,
                bgcolor: "divider",
                borderRadius: 1,
              }}
            />

            {/* Breadcrumbs */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {/* Dashboard */}
              <Box
                onClick={() => router.push("/dashboards/student")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  cursor: "pointer",
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "action.hover",
                    transform: "translateY(-1px)",
                    "& .breadcrumb-icon": { color: "primary.main" },
                    "& .breadcrumb-text": { color: "primary.main" },
                  },
                }}
              >
                <HomeIcon className="breadcrumb-icon" sx={{ fontSize: "1.1rem", color: "text.secondary", transition: "color 0.2s ease" }} />
                <Typography className="breadcrumb-text" sx={{ fontSize: "0.9rem", fontWeight: 500, color: "text.primary", transition: "color 0.2s ease" }}>
                  Dashboard
                </Typography>
              </Box>

              <NavigateNextIcon sx={{ fontSize: "1.2rem", color: "text.secondary", opacity: 0.5, mx: 0.5 }} />

              {/* Tournaments */}
              <Box
                onClick={() => router.push("/dashboards/student/tournaments")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  cursor: "pointer",
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "action.hover",
                    transform: "translateY(-1px)",
                    "& .breadcrumb-icon": { color: "primary.main" },
                    "& .breadcrumb-text": { color: "primary.main" },
                  },
                }}
              >
                <EmojiEventsIcon className="breadcrumb-icon" sx={{ fontSize: "1.1rem", color: "text.secondary", transition: "color 0.2s ease" }} />
                <Typography className="breadcrumb-text" sx={{ fontSize: "0.9rem", fontWeight: 500, color: "text.primary", transition: "color 0.2s ease" }}>
                  Tournaments
                </Typography>
              </Box>

              <NavigateNextIcon sx={{ fontSize: "1.2rem", color: "text.secondary", opacity: 0.5, mx: 0.5 }} />

              {/* Current Tournament Chip */}
              <Chip
                icon={<SportsIcon sx={{ fontSize: "1rem" }} />}
                label={tournament.name}
                size="small"
                sx={{
                  height: 32,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  bgcolor: "primary.main",
                  color: "white",
                  px: 0.5,
                  "& .MuiChip-icon": { color: "white" },
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              />
            </Box>
          </Box>

          {/* Right Side - Label */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                bgcolor: "grey.100",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontWeight: 500,
                textTransform: "uppercase",
                fontSize: "0.7rem",
                letterSpacing: "0.05em",
              }}
            >
              Tournament Details
            </Typography>
          </Box>
        </Box>
        
        {/* HERO SECTION */}
        <Box
          sx={{
            position: "relative",
            height: "500px",
            backgroundImage: "url(/images/sports.jpg)",
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
          {/* ... rest of hero section ... */}
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
                  {tournament.name}
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
                    {getDateTimeDisplay(tournament.startDate, tournament.endDate)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  <Chip
                    icon={<SportsIcon sx={{ color: "white" }} />}
                    label={tournament.sport}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.15)",
                      color: "white",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                  <Chip
                    icon={<LocationOnIcon sx={{ color: "white" }} />}
                    label={tournament.location}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.15)",
                      color: "white",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                  <Chip
                    icon={<GroupsIcon sx={{ color: "white" }} />}
                    label={tournament.teamSize === 1 ? "Individual" : `${tournament.teamSize} Players`}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.15)",
                      color: "white",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                  <Chip
                    label={tournament.status}
                    sx={{
                      bgcolor:
                        tournament.status === "Open for Registration"
                          ? "rgba(16,185,129,0.25)"
                          : "rgba(245,158,11,0.25)",
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
          <Grid container spacing={4}>
            {/* LEFT COLUMN - Tournament Details */}
            <Grid size={{ xs: 12, md: 8 }}>
              {/* TOURNAMENT DETAILS CARD */}
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  mb: 4,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 3, color: "text.primary", display: "flex", alignItems: "center", gap: 1 }}
                >
                  <InfoIcon sx={{ color: "primary.main" }} />
                  Tournament Details
                </Typography>

                <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                        <LocationOnIcon sx={{ color: "primary.main", mt: 0.5 }} />
                        <Box>
                          <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>
                            Location
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: 16, color: "text.primary" }}>
                            {tournament.location}
                          </Typography>
                          {tournament.address && (
                            <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
                              {tournament.address}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                        <EventAvailableIcon sx={{ color: "primary.main", mt: 0.5 }} />
                        <Box>
                          <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>
                            Registration Deadline
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: 16, color: "text.primary" }}>
                            {formatDate(tournament.registrationDeadline)}
                          </Typography>
                          <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
                            {daysRemaining > 0 ? `${daysRemaining} days left` : "Deadline passed"}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                        <SportsIcon sx={{ color: "primary.main", mt: 0.5 }} />
                        <Box>
                          <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>
                            Sport
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: 16, color: "text.primary" }}>
                            {tournament.sport}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                        <GroupsIcon sx={{ color: "primary.main", mt: 0.5 }} />
                        <Box>
                          <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>
                            Team Size
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: 16, color: "text.primary" }}>
                            {tournament.teamSize === 1 ? "Individual" : `${tournament.teamSize} Players`}
                          </Typography>
                          <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
                            {tournament.teamSize > 1 ? "Per team" : "Single competitor"}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                        <EmojiEventsIcon sx={{ color: "primary.main", mt: 0.5 }} />
                        <Box>
                          <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>
                            Format
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: 16, color: "text.primary" }}>
                            {tournament.format || "Single Elimination"}
                          </Typography>
                          <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
                            Tournament style
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                        <AccessTimeIcon sx={{ color: "primary.main", mt: 0.5 }} />
                        <Box>
                          <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>
                            Dates
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: 16, color: "text.primary" }}>
                            {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                          </Typography>
                          <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
                            Tournament period
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Rules Section */}
                {tournament.rules && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: "text.primary", mb: 2 }}>
                      Rules & Guidelines
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "text.secondary", whiteSpace: "pre-line" }}>
                        {tournament.rules}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* RIGHT COLUMN - Registration & Status */}
            <Grid size={{ xs: 12, md: 4 }}>
              {/* REGISTRATION STATUS CARD */}
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  mb: 4,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 700,
                    mb: 3,
                    color: "text.primary",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <EventIcon sx={{ color: "primary.main" }} />
                  TOURNAMENT STATUS
                </Typography>

                <Stack spacing={2.5}>
                  {/* Organizer */}
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600, mb: 1 }}>
                      ORGANIZER
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                        Sports Committee
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
                        Coordinator
                      </Typography>
                    </Paper>
                  </Box>

                  {/* Entry Fee */}
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600, mb: 1 }}>
                      ENTRY FEE
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AttachMoneyIcon sx={{ color: "primary.main" }} />
                        <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: 18 }}>
                          ${tournament.entryFee}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
                        Per {tournament.teamSize === 1 ? "participant" : "team"}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* Availability */}
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600, mb: 1 }}>
                      AVAILABILITY
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <GroupIcon sx={{ color: "success.main" }} />
                        <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: 18 }}>
                          {spotsLeft} spots left
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
                        {tournament.currentTeams} of {tournament.maxTeams} teams registered
                      </Typography>
                    </Paper>
                  </Box>

                  {/* Prize */}
                  {tournament.prize && (
                    <Box>
                      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600, mb: 1 }}>
                        PRIZE
                      </Typography>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <EmojiEventsIcon sx={{ color: "warning.main" }} />
                          <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: 18 }}>
                            {tournament.prize}
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  )}

                  {/* Your Registration Status */}
                  {tournament.isRegistered ? (
                    <>
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600, mb: 1 }}>
                          YOUR REGISTRATION
                        </Typography>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            {tournament.studentTeam?.status === "Approved" ? (
                              <CheckCircleIcon sx={{ color: "success.main" }} />
                            ) : tournament.studentTeam?.status === "Pending" ? (
                              <PendingIcon sx={{ color: "warning.main" }} />
                            ) : (
                              <CancelIcon sx={{ color: "error.main" }} />
                            )}
                            <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                              {tournament.studentTeam?.status || "Pending"}
                            </Typography>
                          </Box>
                          {tournament.teamSize > 1 && tournament.studentTeam?.teamName && (
                            <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 0.5 }}>
                              Team: {tournament.studentTeam.teamName}
                            </Typography>
                          )}
                          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
                            Payment: {tournament.studentTeam?.paymentStatus || "Pending"}
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Action Buttons */}
                      {tournament.studentTeam?.paymentStatus !== "Paid" && tournament.entryFee > 0 ? (
                        <Button
                          variant="contained"
                          fullWidth
                          size="large"
                          onClick={() => {
                            setActiveStep(1);
                            setShowRegistrationDialog(true);
                          }}
                          sx={{
                            py: 1.5,
                            borderRadius: 2,
                          }}
                        >
                          <PaymentIcon sx={{ mr: 1 }} />
                          Pay Entry Fee (${tournament.entryFee})
                        </Button>
                      ) : tournament.canRegister ? (
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          size="large"
                          onClick={() => setShowCancelDialog(true)}
                          sx={{ py: 1.5, borderRadius: 2 }}
                        >
                          Cancel Registration
                        </Button>
                      ) : null}
                    </>
                  ) : tournament.canRegister ? (
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={() => setShowRegistrationDialog(true)}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        bgcolor: "primary.main",
                        "&:hover": {
                          bgcolor: "primary.dark",
                        },
                      }}
                      disabled={isDeadlinePassed}
                    >
                      <HowToRegIcon sx={{ mr: 1 }} />
                      {isDeadlinePassed ? "Registration Closed" : "Register Now"}
                    </Button>
                  ) : (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: "warning.lighter",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "warning.light",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <InfoIcon sx={{ color: "warning.main" }} />
                      <Typography sx={{ fontSize: 14, color: "warning.dark", fontWeight: 500 }}>
                        Registration is currently closed
                      </Typography>
                    </Paper>
                  )}

                  {/* Deadline Warning */}
                  {isDeadlinePassed && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: "error.lighter",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "error.light",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mt: 1,
                      }}
                    >
                      <AccessTimeIcon sx={{ color: "error.main" }} />
                      <Typography sx={{ fontSize: 14, color: "error.dark", fontWeight: 500 }}>
                        Registration Deadline Passed
                      </Typography>
                    </Paper>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Sponsors Section - Full Width */}
          {tournament.sponsors && tournament.sponsors.length > 0 && (() => {
            const validSponsors = tournament.sponsors
              .filter((s) => s.sponsorId && typeof s.sponsorId === 'object' && s.sponsorId.companyName)
              .map((s) => ({
                companyName: s.sponsorId.companyName,
                logo: s.sponsorId.logo || [],
              }));
            
            return validSponsors.length > 0 ? (
              <Box sx={{ mt: 6, mb: 4 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 3,
                    color: "text.primary",
                  }}
                >
                  Tournament Sponsors
                </Typography>
                <VendorCarousel registeredVendors={validSponsors} />
              </Box>
            ) : null;
          })()}
        </Container>
      </Box>

      {/* Registration Dialog */}
      <Dialog
        open={showRegistrationDialog}
        onClose={() => {
          setShowRegistrationDialog(false);
          setActiveStep(0);
          setRegistrationError("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight={700}>
            {activeStep === 0 ? "Register for Tournament" : "Complete Payment"}
          </Typography>
          <IconButton
            onClick={() => {
              setShowRegistrationDialog(false);
              setActiveStep(0);
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>{tournament?.teamSize > 1 ? "Team Details" : "Confirm"}</StepLabel>
            </Step>
            <Step>
              <StepLabel>Payment</StepLabel>
            </Step>
          </Stepper>

          {activeStep === 0 && tournament && (
            <Box>
              {tournament.teamSize > 1 ? (
                <>
                  <TextField
                    label="Team Name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    fullWidth
                    required
                    sx={{ mb: 3 }}
                  />

                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Teammates (you are automatically included)
                  </Typography>

                  {members.map((member, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2, border: "1px solid", borderColor: "divider" }}>
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        Teammate {index + 1}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Full Name"
                            value={member.name}
                            onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                            fullWidth
                            size="small"
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Student ID"
                            value={member.studentId}
                            onChange={(e) => handleMemberChange(index, "studentId", e.target.value)}
                            fullWidth
                            size="small"
                            required
                            placeholder="XX-XXXXX"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="GUC Email"
                            value={member.email}
                            onChange={(e) => handleMemberChange(index, "email", e.target.value)}
                            fullWidth
                            size="small"
                            required
                            placeholder="name@student.guc.edu.eg"
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 2,
                    bgcolor: "primary.lighter",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "primary.light",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <InfoIcon sx={{ color: "primary.main" }} />
                  <Typography sx={{ fontSize: 14, color: "primary.dark" }}>
                    This is an individual tournament. Click &quot;Proceed to Payment&quot; to continue with your registration.
                  </Typography>
                </Paper>
              )}

              {registrationError && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mt: 2,
                    bgcolor: "error.lighter",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "error.light",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <CancelIcon sx={{ color: "error.main" }} />
                  <Typography sx={{ fontSize: 14, color: "error.dark" }}>
                    {registrationError}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {activeStep === 1 && tournament && (
            <Box>
              {tournament.entryFee > 0 ? (
                <>
                  <Typography variant="body1" gutterBottom>
                    Entry Fee: <strong>${tournament.entryFee}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Select your preferred payment method:
                  </Typography>

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Paper
                      sx={{
                        flex: 1,
                        p: 3,
                        textAlign: "center",
                        cursor: "pointer",
                        border: selectedPaymentMethod === "wallet" ? "2px solid" : "1px solid",
                        borderColor: selectedPaymentMethod === "wallet" ? "primary.main" : "divider",
                        borderRadius: 2,
                        transition: "all 0.2s",
                        "&:hover": { borderColor: "primary.main" },
                      }}
                      onClick={() => setSelectedPaymentMethod("wallet")}
                    >
                      <WalletIcon sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
                      <Typography fontWeight={600}>Wallet</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Balance: ${walletBalance.toFixed(2)}
                      </Typography>
                      {walletBalance < tournament.entryFee && (
                        <Typography variant="caption" color="error">
                          Insufficient balance
                        </Typography>
                      )}
                    </Paper>

                    <Paper
                      sx={{
                        flex: 1,
                        p: 3,
                        textAlign: "center",
                        cursor: "pointer",
                        border: selectedPaymentMethod === "card" ? "2px solid" : "1px solid",
                        borderColor: selectedPaymentMethod === "card" ? "primary.main" : "divider",
                        borderRadius: 2,
                        transition: "all 0.2s",
                        "&:hover": { borderColor: "primary.main" },
                      }}
                      onClick={() => setSelectedPaymentMethod("card")}
                    >
                      <CreditCardIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                      <Typography fontWeight={600}>Credit Card</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Powered by Stripe
                      </Typography>
                    </Paper>
                  </Box>
                </>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    bgcolor: "success.lighter",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "success.light",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <CheckCircleIcon sx={{ color: "success.main" }} />
                  <Typography sx={{ fontSize: 14, color: "success.dark" }}>
                    This tournament is free! Your registration will be submitted for approval.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          {activeStep === 0 && tournament && (
            <Button
              variant="contained"
              onClick={handleRegistrationSubmit}
              disabled={registrationLoading}
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              {registrationLoading ? (
                <CircularProgress size={24} />
              ) : tournament.entryFee > 0 ? (
                "Proceed to Payment"
              ) : (
                "Submit Registration"
              )}
            </Button>
          )}

          {activeStep === 1 && tournament && tournament.entryFee > 0 && (
            <Button
              variant="contained"
              onClick={handlePayment}
              disabled={!selectedPaymentMethod || paymentLoading || (selectedPaymentMethod === "wallet" && walletBalance < tournament.entryFee)}
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              {paymentLoading ? (
                <CircularProgress size={24} />
              ) : (
                `Pay $${tournament.entryFee}`
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Registration?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your registration?
            {tournament?.studentTeam?.paymentStatus === "Paid" && tournament?.entryFee > 0 && (
              <strong> Your entry fee of ${tournament.entryFee} will be refunded to your wallet.</strong>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>Keep Registration</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleCancelRegistration}
            disabled={cancelLoading}
          >
            {cancelLoading ? <CircularProgress size={24} /> : "Cancel Registration"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </BasicLayout>
  );
}