"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ThemeProvider,
  Box,
  Typography,
  Container,
  Paper,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Tabs,
  Tab,
  Fade,
  Divider,
  alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { 
  Add, 
  Remove, 
  Cancel, 
  CheckCircle, 
  Pending, 
  Block,
  EmojiEvents,
  Groups,
  AccountBalanceWallet,
  CreditCard,
  Refresh,
  AttachMoney,
  WorkspacePremium,
  Search,
} from "@mui/icons-material";
import BasicLayout from "@/components/layouts/basicLayout2";
import theme from "@/lib/theme";
import axios from "axios";

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  startDate: string | Date;
  endDate: string | Date;
  registrationDeadline: string | Date;
  maxTeams: number;
  registeredTeams: string[];
  status: string;
  teamSize: number;
  currentTeams?: number;
  location?: string;
  address?: string;
  entryFee?: number;
  prize?: string;
  rules?: string;
  canRegister?: boolean;
  isRegistered?: boolean;
  format?: string;
}

interface Member {
  name: string;
  email: string;
  studentId: string;
  status?: string;
}

interface Team {
  _id: string;
  tournamentId: string;
  teamName: string;
  members: Member[];
  status: string;
  paymentStatus?: string;
  canCancel?: boolean;
  isRejected?: boolean;
}

interface RegisteredTournament {
  tournament: Tournament;
  team: Team;
  canCancel: boolean;
  isRejected?: boolean;
}

const menuItems = [
  { text: "Home", icon: <FitnessCenterIcon />, href: "/dashboards/student" },
  { text: "Events", icon: <FitnessCenterIcon />, href: "/dashboards/student/events" },
  { text: "Registered events", icon: <FitnessCenterIcon />, href: "/dashboards/student/registeredEvents" },
  { text: "Courts", icon: <FitnessCenterIcon />, href: "/dashboards/student/courts" },
  { text: "Tournaments", icon: <FitnessCenterIcon />, href: "/dashboards/student/tournaments" },
  { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/student/gym" },
  { text: "Loyalty Program", icon: <FitnessCenterIcon />, href: "/dashboards/student/loyaltyProgram" },
  { text: "Restaurants", icon: <FitnessCenterIcon />, href: "/dashboards/student/restaurants" },
];

const getStatusChip = (status: string, paymentStatus?: string) => {
  const displayStatus = paymentStatus === "Paid" ? "Confirmed" : status;
  
  const statusConfig: Record<string, { color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"; icon: any }> = {
    "Pending": { color: "warning", icon: <Pending /> },
    "Confirmed": { color: "success", icon: <CheckCircle /> },
    "Approved": { color: "info", icon: <CheckCircle /> },
    "Rejected": { color: "error", icon: <Block /> },
    "Disqualified": { color: "error", icon: <Block /> },
    "Open for Registration": { color: "success", icon: <CheckCircle /> },
    "Draft": { color: "default", icon: <Pending /> },
    "In Progress": { color: "info", icon: <Pending /> },
    "Completed": { color: "default", icon: <CheckCircle /> },
    "Cancelled": { color: "error", icon: <Cancel /> },
  };

  const config = statusConfig[displayStatus] || { color: "default", icon: null };
  return (
    <Chip
      icon={config.icon}
      label={displayStatus}
      color={config.color}
      size="small"
      sx={{ 
        fontWeight: 600,
        "& .MuiChip-icon": { fontSize: 16 }
      }}
    />
  );
};

const formatDate = (dateString: string | Date): string => {
  try {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return "Invalid Date";
  }
};

const formatDeadline = (deadline: string | Date | null | undefined): string => {
  try {
    if (!deadline) return "Not specified";
    const date = new Date(deadline);
    if (isNaN(date.getTime())) return "Invalid date";
    
    const hasTime = date.getHours() > 0 || date.getMinutes() > 0;
    if (hasTime) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    return formatDate(deadline);
  } catch {
    return "Date error";
  }
};

// Minimal Tournament Card Component
const TournamentCard = ({
  tournament,
  index = 0,
}: {
  tournament: Tournament;
  index?: number;
}) => {
  const router = useRouter();
  
  return (
    <Fade in timeout={300 + index * 50}>
      <Card
        elevation={0}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          border: "1px solid",
          borderColor: alpha("#003d52", 0.08),
          bgcolor: "white",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: `0 12px 32px ${alpha("#003d52", 0.12)}`,
            borderColor: "#003d52",
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
              <Chip
                label={tournament.sport.toUpperCase()}
                size="small"
                sx={{
                  bgcolor: alpha("#003d52", 0.08),
                  color: "#003d52",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  letterSpacing: "0.5px",
                  height: 24,
                  border: `1px solid ${alpha("#003d52", 0.2)}`,
                }}
              />
              {getStatusChip(tournament.status)}
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: "1.1rem",
                lineHeight: 1.3,
                color: "text.primary",
                minHeight: 48,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {tournament.name}
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: alpha("#003d52", 0.06) }} />

          {/* Info Stack */}
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Type
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {tournament.teamSize === 1 ? "Individual" : `Team (${tournament.teamSize} players)`}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Entry Fee
              </Typography>
              <Typography variant="body2" fontWeight={700} color="primary.main">
                {tournament.entryFee && tournament.entryFee > 0 ? `$${tournament.entryFee}` : "Free"}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Prize
              </Typography>
              <Typography variant="body2" fontWeight={600} color="success.main">
                {tournament.prize || "TBD"}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Teams
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {tournament.currentTeams || tournament.registeredTeams?.length || 0} / {tournament.maxTeams}
              </Typography>
            </Box>
          </Stack>
        </CardContent>

        {/* Action Button */}
        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => router.push(`/tournament/${tournament._id}`)}
            sx={{
              py: 1.2,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "none",
              background: "linear-gradient(135deg, #003d52 0%, #125b73 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #002d3d 0%, #0f4a5f 100%)",
              },
            }}
          >
            View Details
          </Button>
        </Box>
      </Card>
    </Fade>
  );
};

// Bracket Visualization
const BracketVisualization = ({ maxTeams, format }: { maxTeams: number; format?: string }) => {
  const rounds = Math.ceil(Math.log2(maxTeams));
  const bracketSlots = Array.from({ length: rounds }, (_, i) => Math.pow(2, rounds - i - 1));
  
  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: "rgba(0,61,82,0.03)", 
      borderRadius: 3,
      border: "1px solid rgba(0,61,82,0.1)"
    }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <EmojiEvents sx={{ color: "primary.main" }} />
        Tournament Bracket Preview
      </Typography>
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        gap: 2,
        overflowX: "auto",
        py: 2 
      }}>
        {bracketSlots.map((slots, roundIndex) => (
          <Box key={roundIndex} sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {roundIndex === 0 ? "Round 1" : roundIndex === bracketSlots.length - 1 ? "Final" : `Round ${roundIndex + 1}`}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {Array.from({ length: Math.min(slots, 8) }).map((_, slotIndex) => (
                <Box
                  key={slotIndex}
                  sx={{
                    width: 80,
                    height: 28,
                    bgcolor: roundIndex === bracketSlots.length - 1 ? "primary.main" : "white",
                    border: "2px solid",
                    borderColor: roundIndex === bracketSlots.length - 1 ? "primary.main" : "divider",
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <Typography variant="caption" sx={{ 
                    color: roundIndex === bracketSlots.length - 1 ? "white" : "text.secondary",
                    fontSize: "0.65rem"
                  }}>
                    {roundIndex === bracketSlots.length - 1 ? "🏆 Winner" : `Match ${slotIndex + 1}`}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 2 }}>
        {format || "Single Elimination"} • {maxTeams} Teams Maximum
      </Typography>
    </Box>
  );
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registeredTournaments, setRegisteredTournaments] = useState<RegisteredTournament[]>([]);
  const [view, setView] = useState<"available" | "registered">("available");
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<Member[]>([{ name: "", email: "", studentId: "" }]);
  const [loading, setLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Payment states
  const [registrationStep, setRegistrationStep] = useState<"details" | "payment">("details");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "card">("wallet");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [pendingTeamId, setPendingTeamId] = useState<string>("");

  // Separate state for filtered tournaments to prevent mixing
  const [availableTournaments, setAvailableTournaments] = useState<Tournament[]>([]);
  const [filteredRegistered, setFilteredRegistered] = useState<RegisteredTournament[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Update filtered data whenever tournaments or filters change
  useEffect(() => {
    // Filter available tournaments
    const filteredAvail = tournaments.filter(t => {
      if (selectedSport && t.sport !== selectedSport) return false;
      if (searchTerm && !t.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
    setAvailableTournaments(filteredAvail);

    // Filter registered tournaments
    const filteredReg = registeredTournaments.filter(rt => {
      if (selectedSport && rt.tournament.sport !== selectedSport) return false;
      if (searchTerm && !rt.tournament.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
    setFilteredRegistered(filteredReg);
  }, [tournaments, registeredTournaments, selectedSport, searchTerm]);

  const fetchData = async () => {
    setRefreshing(true);
    const token = localStorage.getItem("token");
  
    try {
      // Reset states first
      setTournaments([]);
      setRegisteredTournaments([]);
      setAvailableTournaments([]);
      setFilteredRegistered([]);
      
      // Fetch available tournaments
      const { data: tournamentsData } = await axios.get("/api/student/tournaments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Fetch registered tournaments
      const { data: registeredData } = await axios.get("/api/student/tournaments/registered/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update states
      setTournaments(tournamentsData.tournaments || []);
      setRegisteredTournaments(registeredData.registered || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Failed to load tournament data. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("/api/payments/getmyWallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWalletBalance(data.walletBalance || 0);
    } catch (err) {
      console.error("Failed to fetch wallet balance:", err);
      setWalletBalance(0);
    }
  };

  const handleViewChange = async (newView: "available" | "registered") => {
    setView(newView);
    setSelectedTournament(null);
    
    // Automatically refresh data when switching views
    await fetchData();
  };

  const handleOpenDialog = async (tournament: Tournament) => {
    // First fetch full tournament details
    const token = localStorage.getItem("token");
    try {
      const { data } = await axios.get(`/api/student/tournaments/${tournament._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const tournamentData = data.tournament;
      
      // Ensure dates are properly formatted
      tournamentData.startDate = new Date(tournamentData.startDate);
      tournamentData.endDate = new Date(tournamentData.endDate);
      tournamentData.registrationDeadline = new Date(tournamentData.registrationDeadline);
      
      setSelectedTournament(tournamentData);
      
      if (tournamentData.isRegistered) {
        // Already registered, show details instead of registration form
        setOpenDetailsDialog(true);
      } else if (tournamentData.canRegister) {
        // Can register, show registration form
        setOpenDialog(true);
        // Initialize members array based on teamSize
        const initialMembers: Array<{
          name: string;
          email: string;
          studentId: string;
        }> = [];
        const teamSize = tournamentData.teamSize || 1;
        
        // If team tournament, create empty slots for other members
        if (teamSize > 1) {
          for (let i = 1; i < teamSize; i++) {
            initialMembers.push({ name: "", email: "", studentId: "" });
          }
        }
        
        setTeamName("");
        setMembers(initialMembers);
      } else {
        // Cannot register (deadline passed, not open, etc.)
        const deadline = formatDate(tournamentData.registrationDeadline);
        const now = new Date();
        const registrationDeadline = new Date(tournamentData.registrationDeadline);
        
        let message = "Cannot register for this tournament: ";
        if (tournamentData.status !== 'Open for Registration') {
          message += `Tournament is ${tournamentData.status}`;
        } else if (now > registrationDeadline) {
          message += `Registration deadline (${deadline}) has passed`;
        } else {
          message += "Unknown reason";
        }
        alert(message);
      }
    } catch (err) {
      console.error("Error fetching tournament details:", err);
      alert("Failed to load tournament details.");
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTournament(null);
    setRegistrationStep("details");
    setPaymentMethod("wallet");
    setPendingTeamId("");
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedTournament(null);
  };

  const handleAddMember = () => setMembers([...members, { name: "", email: "", studentId: "" }]);
  const handleRemoveMember = (index: number) => setMembers(members.filter((_, i) => i !== index));
  const handleMemberChange = (index: number, field: keyof Member, value: string) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const handleRegister = async () => {
    if (!selectedTournament) return;
    


    // Validate members for team tournaments
    if (selectedTournament.teamSize > 1) {
      const invalidMembers = members.some(m => !m.name.trim() || !m.email.trim() || !m.studentId.trim());
      if (invalidMembers) {
        alert("Please fill in all member details");
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Prepare request body based on tournament type
      let requestBody = {};
      if (selectedTournament.teamSize > 1) {
        requestBody = { 
          teamName, 
          members: members.map(m => ({
            name: m.name.trim(),
            email: m.email.trim().toLowerCase(),
            studentId: m.studentId.trim()
          }))
        };
      }

      const { data } = await axios.post(
        `/api/student/tournaments/${selectedTournament._id}/register`,
        requestBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // If there's an entry fee, move to payment step
      if (selectedTournament.entryFee && selectedTournament.entryFee > 0) {
        setPendingTeamId(data.team._id);
        await fetchWalletBalance();
        setRegistrationStep("payment");
      } else {
        // No fee, registration complete
        alert(data.message || "Registration submitted successfully!");
        handleCloseDialog();
        await fetchData();
      }
      
    } catch (err: any) {
      console.error("Registration error:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          "Error registering for tournament";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedTournament || !pendingTeamId) return;
    
    const entryFee = selectedTournament.entryFee || 0;
    
    if (paymentMethod === "wallet" && walletBalance < entryFee) {
      alert(`Insufficient wallet balance. You need $${entryFee.toFixed(2)} but only have $${walletBalance.toFixed(2)}`);
      return;
    }

    setPaymentLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const { data } = await axios.post(
        `/api/student/tournaments/${pendingTeamId}/pay`,
        { paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (paymentMethod === "card" && data.url) {
        // Redirect to Stripe
        window.location.href = data.url;
      } else {
        // Wallet payment successful
        alert("Payment successful! Your registration is now confirmed.");
        handleCloseDialog();
        await fetchData();
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      const errorMessage = err.response?.data?.message || "Payment failed";
      alert(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelRegistration = async (tournamentId: string, teamId: string, paymentStatus?: string) => {
    const hasPaid = paymentStatus === "Paid";
    const confirmMessage = hasPaid 
      ? "Are you sure you want to cancel? The entry fee will be refunded to your wallet."
      : "Are you sure you want to cancel this registration?";
  
    // Remove window.confirm and create a proper dialog
    setCancelDialogInfo({
      open: true,
      tournamentId,
      teamId,
      paymentStatus,
      message: confirmMessage
    });
  };
  
  // Add these states near your other states (around line 90):
  const [cancelDialogInfo, setCancelDialogInfo] = useState<{
    open: boolean;
    tournamentId: string;
    teamId: string;
    paymentStatus?: string;
    message: string;
  }>({
    open: false,
    tournamentId: "",
    teamId: "",
    paymentStatus: undefined,
    message: ""
  });
  
  const [cancelling, setCancelling] = useState(false);
  
  // Add this actual cancel function:
  const executeCancelRegistration = async () => {
    const { tournamentId, teamId, paymentStatus } = cancelDialogInfo;
    
    setCancelling(true);
    try {
      const token = localStorage.getItem("token");
      
      const { data } = await axios.delete(`/api/student/tournaments/${tournamentId}/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const successMessage = data.refundAmount 
        ? `Registration cancelled! $${data.refundAmount.toFixed(2)} has been refunded to your wallet.`
        : "Registration cancelled successfully!";
      
      alert(successMessage);
      
      // Refresh data
      await fetchData();
      
      // Close dialog
      setCancelDialogInfo({
        open: false,
        tournamentId: "",
        teamId: "",
        paymentStatus: undefined,
        message: ""
      });
      
    } catch (err: any) {
      console.error("Cancellation error:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          "Error cancelling registration";
      alert(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  // Get unique sports for filter
  const allSports = Array.from(new Set([
    ...tournaments.map(t => t.sport),
    ...registeredTournaments.map(rt => rt.tournament.sport)
  ]));

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
              backgroundImage: `url('/images/tournament.jpg')`,
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
            <Typography variant="h3" fontWeight={700} color="white" sx={{ mb: 1 }}>
              Tournaments
            </Typography>
            <Typography variant="body1" color="rgba(255,255,255,0.9)" sx={{ mb: 2 }}>
              Compete against the best, form your dream team, and claim victory in our exciting sports tournaments
            </Typography>
          </Box>
        </Box>

        {/* Filters and Tabs */}
        <Container maxWidth="lg" sx={{ mb: 4 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3, 
              border: "1px solid", 
              borderColor: "divider",
              bgcolor: "white",
            }}
          >
            {/* Tabs */}
            <Tabs
              value={view}
              onChange={(_, newValue) => handleViewChange(newValue)}
              sx={{
                mb: 3,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  minHeight: 48,
                },
              }}
            >
              <Tab 
                value="available" 
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EmojiEvents fontSize="small" />
                    Available Tournaments
                    <Chip label={availableTournaments.length} size="small" sx={{ ml: 0.5 }} />
                  </Box>
                }
              />
              <Tab 
                value="registered" 
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Groups fontSize="small" />
                    My Registrations
                    <Chip label={filteredRegistered.length} size="small" color="primary" sx={{ ml: 0.5 }} />
                  </Box>
                }
              />
            </Tabs>

            {/* Filter Row */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                select
                SelectProps={{ native: true }}
                value={selectedSport}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedSport(e.target.value)}
                size="small"
                sx={{ 
                  minWidth: 160,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  }
                }}
              >
                <option value="">All Sports</option>
                {allSports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </TextField>
              
              <TextField
                placeholder="Search tournaments..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ 
                  flex: 1,
                  minWidth: 200,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  }
                }}
                InputProps={{
                  startAdornment: <Search sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />,
                }}
              />
              
              <Button
                variant="outlined"
                onClick={fetchData}
                disabled={refreshing}
                startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
                sx={{ 
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Refresh
              </Button>
            </Box>
          </Paper>
        </Container>

        {/* Tournament Cards Grid */}
        <Container maxWidth="lg" sx={{ pb: 4 }}>
          {refreshing ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={8}>
              <CircularProgress size={48} />
            </Box>
          ) : view === "available" ? (
            <>
              {availableTournaments.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
                  <EmojiEvents sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    {selectedSport || searchTerm 
                      ? "No tournaments match your filters." 
                      : "No tournaments available for registration."}
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                    Check back later for upcoming tournaments
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {availableTournaments.map((tournament, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tournament._id}>
                      <TournamentCard 
                        tournament={tournament} 
                        index={index}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          ) : (
            <>
              {filteredRegistered.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
                  <Groups sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    {selectedSport || searchTerm 
                      ? "No registered tournaments match your filters." 
                      : "You haven't registered for any tournaments yet."}
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                    Browse available tournaments to get started
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {filteredRegistered.map(({ tournament, team, canCancel, isRejected }, index) => {
                    const isPaid = team.paymentStatus === "Paid";
                    const needsPayment = tournament.entryFee && tournament.entryFee > 0 && !isPaid && !isRejected;
                    
                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tournament._id}>
                        <Fade in timeout={300 + index * 50}>
                          <Card
                            elevation={0}
                            sx={{
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              borderRadius: 3,
                              border: "2px solid",
                              borderColor: isRejected 
                                ? "error.main" 
                                : isPaid 
                                  ? "success.main" 
                                  : needsPayment 
                                    ? "warning.main" 
                                    : alpha("#003d52", 0.08),
                              bgcolor: "white",
                              transition: "all 0.3s",
                            }}
                          >
                            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                              {/* Header */}
                              <Box sx={{ mb: 2 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                                  <Chip
                                    label={tournament.sport.toUpperCase()}
                                    size="small"
                                    sx={{
                                      bgcolor: alpha("#003d52", 0.08),
                                      color: "#003d52",
                                      fontWeight: 700,
                                      fontSize: "0.65rem",
                                      letterSpacing: "0.5px",
                                      height: 24,
                                    }}
                                  />
                                  {getStatusChip(team.status, team.paymentStatus)}
                                </Box>

                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "1.1rem",
                                    lineHeight: 1.3,
                                    color: "text.primary",
                                    minHeight: 48,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {tournament.name}
                                </Typography>
                              </Box>

                              {needsPayment && (
                                <Alert severity="warning" sx={{ mb: 2, py: 0.5 }}>
                                  Payment pending
                                </Alert>
                              )}

                              {isRejected && (
                                <Alert severity="error" sx={{ mb: 2, py: 0.5 }}>
                                  Registration rejected
                                </Alert>
                              )}

                              <Divider sx={{ my: 2 }} />

                              {/* Info */}
                              <Stack spacing={1.5}>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                  <Typography variant="body2" color="text.secondary">Team</Typography>
                                  <Typography variant="body2" fontWeight={600}>{team.teamName}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                  <Typography variant="body2" color="text.secondary">Entry Fee</Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {tournament.entryFee ? `$${tournament.entryFee}` : "Free"}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                  <Typography variant="body2" color="text.secondary">Prize</Typography>
                                  <Typography variant="body2" fontWeight={600} color="success.main">
                                    {tournament.prize || "TBD"}
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>

                            {/* Actions */}
                            <Box sx={{ p: 2, pt: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                              {needsPayment && (
                                <Button
                                  fullWidth
                                  variant="contained"
                                  color="warning"
                                  onClick={async () => {
                                    setPendingTeamId(team._id);
                                    setSelectedTournament({
                                      ...tournament,
                                      startDate: new Date(tournament.startDate),
                                      endDate: new Date(tournament.endDate),
                                      registrationDeadline: new Date(tournament.registrationDeadline)
                                    });
                                    await fetchWalletBalance();
                                    setRegistrationStep("payment");
                                    setOpenDialog(true);
                                  }}
                                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                                >
                                  Complete Payment (${tournament.entryFee})
                                </Button>
                              )}
                              
                              {canCancel && !isRejected && (
                                <Button
  fullWidth
  variant="outlined"
  color="error"
  onClick={() => handleCancelRegistration(tournament._id, team._id, team.paymentStatus)}
  sx={{ 
    borderRadius: 2, 
    textTransform: "none",
    borderColor: isPaid ? "warning.main" : "error.main",
    color: isPaid ? "warning.dark" : "error.main",
    "&:hover": {
      borderColor: isPaid ? "warning.dark" : "error.dark",
      backgroundColor: isPaid ? "rgba(245, 158, 11, 0.04)" : "rgba(239, 68, 68, 0.04)"
    }
  }}
  startIcon={isPaid ? <AccountBalanceWallet /> : <Cancel />}
>
  {isPaid ? "Cancel & Refund" : "Cancel Registration"}
</Button>
                              )}
                            </Box>
                          </Card>
                        </Fade>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </>
          )}
        </Container>

        {/* Registration Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          {selectedTournament && (
            <>
              <DialogTitle sx={{ 
                background: "linear-gradient(135deg, #003d52 0%, #125b73 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 2
              }}>
                <EmojiEvents />
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {registrationStep === "payment" ? "Complete Payment" : `Register for ${selectedTournament.name}`}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {registrationStep === "payment" 
                      ? "Choose your payment method" 
                      : selectedTournament.teamSize > 1 
                        ? "Team Tournament" 
                        : "Individual Tournament"}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 0 }}>
                {registrationStep === "details" ? (
                  <Box sx={{ p: 3 }}>
                    {/* Tournament Info */}
                    <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: "rgba(0,61,82,0.03)", borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        Tournament Details
                      </Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">Registration Deadline</Typography>
                          <Typography variant="body2" fontWeight={500}>{formatDeadline(selectedTournament.registrationDeadline)}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">Team Size</Typography>
                          <Typography variant="body2" fontWeight={500}>{selectedTournament.teamSize} {selectedTournament.teamSize === 1 ? "player" : "players"}</Typography>
                        </Box>
                        {selectedTournament.entryFee && selectedTournament.entryFee > 0 && (
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="body2" color="text.secondary">Entry Fee</Typography>
                            <Typography variant="body2" fontWeight={700} color="primary.main">${selectedTournament.entryFee}</Typography>
                          </Box>
                        )}
                        {selectedTournament.prize && (
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="body2" color="text.secondary">Prize</Typography>
                            <Typography variant="body2" fontWeight={600} color="success.main">{selectedTournament.prize}</Typography>
                          </Box>
                        )}
                      </Stack>
                    </Paper>

                    {/* Bracket Preview */}
                    {selectedTournament.maxTeams >= 4 && (
                      <Box sx={{ mb: 3 }}>
                        <BracketVisualization maxTeams={selectedTournament.maxTeams} format={selectedTournament.format} />
                      </Box>
                    )}
                    
                    {selectedTournament.teamSize > 1 ? (
                      <>
                        <TextField
                          fullWidth
                          margin="dense"
                          label="Team Name"
                          value={teamName}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setTeamName(e.target.value)}
                          required
                          helperText="Choose a unique team name"
                          sx={{ mb: 2 }}
                        />
                        
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                          Team Members ({members.length + 1} of {selectedTournament.teamSize})
                        </Typography>
                        
                        {/* Captain (current user) */}
                        <Paper sx={{ p: 2, mb: 2, bgcolor: "success.lighter", border: "1px solid", borderColor: "success.light" }}>
                          <Typography variant="subtitle2" color="success.main" fontWeight={600}>
                            👑 Captain (You)
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Your information will be automatically included
                          </Typography>
                        </Paper>
                        
                        {/* Other team members */}
                        {members.map((m, i) => (
                          <Paper key={i} sx={{ p: 2, mb: 2, border: "1px solid", borderColor: "divider" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                              <Typography variant="subtitle2">Team Member {i + 1}</Typography>
                              <IconButton 
                                size="small" 
                                onClick={() => handleRemoveMember(i)}
                                disabled={members.length <= selectedTournament.teamSize - 2}
                              >
                                <Remove fontSize="small" />
                              </IconButton>
                            </Box>
                            <Stack spacing={1.5}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Name"
                                value={m.name}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleMemberChange(i, "name", e.target.value)}
                                required
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="Email"
                                value={m.email}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleMemberChange(i, "email", e.target.value)}
                                required
                                helperText="@student.guc.edu.eg"
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="Student ID"
                                value={m.studentId}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleMemberChange(i, "studentId", e.target.value)}
                                required
                                helperText="Format: XX-XXXX"
                              />
                            </Stack>
                          </Paper>
                        ))}
                        
                        {members.length < selectedTournament.teamSize - 1 && (
                          <Button 
                            startIcon={<Add />} 
                            onClick={handleAddMember}
                            fullWidth
                            variant="outlined"
                          >
                            Add Team Member
                          </Button>
                        )}
                      </>
                    ) : (
                      <Alert severity="info" icon={<CheckCircle />}>
                        This is an individual tournament. Click the button below to proceed with registration.
                      </Alert>
                    )}
                  </Box>
                ) : (
                  /* Payment Step */
                  <Box sx={{ p: 3 }}>
                    {/* Price Summary */}
                    <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: "rgba(0,61,82,0.03)", borderRadius: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {selectedTournament.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Entry Fee
                          </Typography>
                        </Box>
                        <Typography variant="h5" fontWeight={700} color="primary.main">
                          ${selectedTournament.entryFee?.toFixed(2)}
                        </Typography>
                      </Box>
                    </Paper>

                    {/* Payment Methods */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <FormLabel sx={{ mb: 2, fontWeight: 600 }}>Select Payment Method</FormLabel>

                      {/* Wallet Option */}
                      <Box
                        sx={{
                          p: 2,
                          border: paymentMethod === "wallet" ? "2px solid" : "1px solid",
                          borderColor: paymentMethod === "wallet" ? "primary.main" : "divider",
                          borderRadius: 2,
                          mb: 1.5,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            borderColor: "primary.main",
                            bgcolor: "action.hover",
                          }
                        }}
                        onClick={() => setPaymentMethod("wallet")}
                      >
                        <FormControlLabel
                          control={
                            <Radio
                              checked={paymentMethod === "wallet"}
                              onChange={() => setPaymentMethod("wallet")}
                            />
                          }
                          label={
                            <Box sx={{ ml: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <AccountBalanceWallet sx={{ color: "primary.main" }} />
                                <Box>
                                  <Typography fontWeight={600}>Wallet</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Balance: ${walletBalance.toFixed(2)}
                                    {walletBalance < (selectedTournament.entryFee || 0) && (
                                      <Typography component="span" color="error.main" sx={{ ml: 1 }}>
                                        (Insufficient)
                                      </Typography>
                                    )}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          }
                          sx={{ width: "100%", ml: 0, my: 0 }}
                        />
                      </Box>

                      {/* Card Option */}
                      <Box
                        sx={{
                          p: 2,
                          border: paymentMethod === "card" ? "2px solid" : "1px solid",
                          borderColor: paymentMethod === "card" ? "primary.main" : "divider",
                          borderRadius: 2,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            borderColor: "primary.main",
                            bgcolor: "action.hover",
                          }
                        }}
                        onClick={() => setPaymentMethod("card")}
                      >
                        <FormControlLabel
                          control={
                            <Radio
                              checked={paymentMethod === "card"}
                              onChange={() => setPaymentMethod("card")}
                            />
                          }
                          label={
                            <Box sx={{ ml: 1, display: "flex", alignItems: "center", gap: 1 }}>
                              <CreditCard sx={{ color: "primary.main" }} />
                              <Typography fontWeight={600}>Credit Card</Typography>
                            </Box>
                          }
                          sx={{ width: "100%", ml: 0, my: 0 }}
                        />
                      </Box>
                    </FormControl>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 3, borderTop: "1px solid", borderColor: "divider" }}>
                <Button onClick={handleCloseDialog} variant="outlined" sx={{ borderRadius: 2 }}>
                  Cancel
                </Button>
                {registrationStep === "details" ? (
                  <Button 
                    onClick={handleRegister} 
                    disabled={loading}
                    variant="contained"
                    sx={{ 
                      px: 4,
                      borderRadius: 2,
                      background: "linear-gradient(135deg, #003d52 0%, #125b73 100%)",
                    }}
                  >
                    {loading ? <CircularProgress size={22} color="inherit" /> : 
                      selectedTournament.entryFee && selectedTournament.entryFee > 0 
                        ? "Proceed to Payment" 
                        : "Submit Registration"}
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePayment} 
                    disabled={paymentLoading}
                    variant="contained"
                    sx={{ 
                      px: 4,
                      borderRadius: 2,
                      background: "linear-gradient(135deg, #003d52 0%, #125b73 100%)",
                    }}
                  >
                    {paymentLoading ? <CircularProgress size={22} color="inherit" /> : "Pay Now"}
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Tournament Details Dialog */}
        <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
          {selectedTournament && (
            <>
              <DialogTitle sx={{ 
                background: "linear-gradient(135deg, #003d52 0%, #125b73 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 2
              }}>
                <EmojiEvents sx={{ color: "#FFD700" }} />
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {selectedTournament.name}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {selectedTournament.sport}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                  {/* Status and Basic Info */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    {getStatusChip(selectedTournament.status)}
                    {selectedTournament.entryFee && selectedTournament.entryFee > 0 && (
                      <Chip 
                        icon={<AttachMoney />} 
                        label={`$${selectedTournament.entryFee} Entry Fee`}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {selectedTournament.prize && (
                      <Chip 
                        icon={<WorkspacePremium />} 
                        label={selectedTournament.prize}
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {/* Details Grid */}
                  <Box sx={{ 
                    display: "grid", 
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, 
                    gap: 2 
                  }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(0,61,82,0.03)", borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Tournament Dates</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {formatDate(selectedTournament.startDate)} - {formatDate(selectedTournament.endDate)}
                      </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(0,61,82,0.03)", borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Registration Deadline</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {formatDeadline(selectedTournament.registrationDeadline)}
                      </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(0,61,82,0.03)", borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Team Size</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedTournament.teamSize} {selectedTournament.teamSize === 1 ? "player" : "players"} per team
                      </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(0,61,82,0.03)", borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Registered Teams</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedTournament.currentTeams || selectedTournament.registeredTeams.length} / {selectedTournament.maxTeams}
                      </Typography>
                    </Paper>
                    {selectedTournament.location && (
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(0,61,82,0.03)", borderRadius: 2, gridColumn: { sm: "span 2" } }}>
                        <Typography variant="caption" color="text.secondary">Location</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedTournament.location}
                          {selectedTournament.address && ` - ${selectedTournament.address}`}
                        </Typography>
                      </Paper>
                    )}
                  </Box>

                  {/* Bracket Visualization */}
                  {selectedTournament.maxTeams >= 4 && (
                    <BracketVisualization maxTeams={selectedTournament.maxTeams} format={selectedTournament.format} />
                  )}
                  
                  {/* Rules */}
                  {selectedTournament.rules && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                        📋 Rules & Guidelines
                      </Typography>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(0,61,82,0.03)", borderRadius: 2 }}>
                        <Typography variant="body2" whiteSpace="pre-wrap">
                          {selectedTournament.rules}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Button onClick={handleCloseDetailsDialog} variant="outlined" sx={{ borderRadius: 2 }}>
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
        {/* Cancel Confirmation Dialog */}
<Dialog 
  open={cancelDialogInfo.open} 
  onClose={() => setCancelDialogInfo({...cancelDialogInfo, open: false})}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle sx={{ 
    background: "linear-gradient(135deg, #d32f2f 0%, #f44336 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: 2
  }}>
    <Cancel sx={{ color: "white" }} />
    <Box>
      <Typography variant="h6" fontWeight={700}>
        Cancel Registration
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.9 }}>
        Confirm your action
      </Typography>
    </Box>
  </DialogTitle>
  
  <DialogContent sx={{ p: 3 }}>
    <Alert severity="warning" sx={{ mb: 2 }}>
      This action cannot be undone.
    </Alert>
    
    <Typography variant="body1" sx={{ mb: 2 }}>
      {cancelDialogInfo.message}
    </Typography>
    
    {cancelDialogInfo.paymentStatus === "Paid" && (
      <Paper elevation={0} sx={{ 
        p: 2, 
        bgcolor: "rgba(76, 175, 80, 0.08)", 
        border: "1px solid",
        borderColor: "success.light",
        borderRadius: 2,
        mb: 2
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountBalanceWallet sx={{ color: "success.main" }} />
          <Typography variant="body2" color="success.main" fontWeight={600}>
            The entry fee will be refunded to your wallet immediately.
          </Typography>
        </Box>
      </Paper>
    )}
  </DialogContent>
  
  <DialogActions sx={{ p: 3, borderTop: "1px solid", borderColor: "divider" }}>
    <Button 
      onClick={() => setCancelDialogInfo({...cancelDialogInfo, open: false})}
      variant="outlined" 
      sx={{ borderRadius: 2 }}
      disabled={cancelling}
    >
      Keep Registration
    </Button>
    <Button 
      onClick={executeCancelRegistration}
      disabled={cancelling}
      variant="contained"
      color="error"
      sx={{ 
        borderRadius: 2,
        background: "linear-gradient(135deg, #d32f2f 0%, #f44336 100%)",
        "&:hover": {
          background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
        }
      }}
    >
      {cancelling ? <CircularProgress size={22} color="inherit" /> : "Yes, Cancel Registration"}
    </Button>
  </DialogActions>
</Dialog>
      </ThemeProvider>
    </BasicLayout>
  );
}
