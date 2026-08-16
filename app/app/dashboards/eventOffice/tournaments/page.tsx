"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Chip,
  Divider,
  Menu,
  Grid,
  FormHelperText,
  Checkbox,
  TableCell,
  TableRow,
  Table,
  TableHead,
  TableBody,
  Modal,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarIcon,
  Timer as TimerIcon,
  People as PeopleIcon,
  LocalOffer,
  MoreVert as MoreVertIcon,
  LocationOn as LocationIcon,
  Sports as SportsIcon,
  EmojiEvents as TrophyIcon,
  AttachMoney as MoneyIcon,
  FormatListBulleted as FormatIcon,
} from "@mui/icons-material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { RefreshCw, Trash2 } from "lucide-react";
import axios from "axios";
import BasicLayout from "@/components/layouts/basicLayout2";
import DataTable, { TableColumn } from "@/components/DataTable";
import { TextCell, NumberCell } from "@/components/TableComponents";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart";
import TournamentFormDialog from "@/shared/components/TournamentFormDialog";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Collapse  } from "@mui/material";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/eventOffice" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/eventOffice/events" },
  { text: "Tournaments", icon: <TrophyIcon />, href: "/dashboards/eventOffice/tournaments" },
  { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/eventOffice/gym" },
  { text: "Workshop Requests", icon: <WorkIcon />, href: "/dashboards/eventOffice/workshopRequests" },
  { text: "Vendor Requests", icon: <BusinessIcon />, href: "/dashboards/eventOffice/vendorRequests" },
  { text: "Reports", icon: <BarChartIcon />, href: "/dashboards/eventOffice/reports" },
  { text: "Overlapping Booths", icon: <HomeIcon />, href: "/dashboards/eventOffice/overlappingBooths" },
  { text: "Loyalty Program", icon: <LocalOffer />, href: "/dashboards/eventOffice/loyaltyProgram" },
];

const SPORTS = [
  'tennis',
  'football',
  'basketball',
  'volleyball',
  'handball',
  'pingpong',
  'power lifting',
  'cross fit',
  'chess'
];

const STATUSES = [
  'Draft',
  'Open for Registration',
  'Sponsorship Open',
  'In Progress',
  'Completed',
  'Cancelled'
];

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  location: string;
  address?: string;
  // REMOVE: format: string;
  teamSize: number;
  maxTeams: number;
  rules?: string;
  entryFee: number;
  prize?: string;
  isSponsorshipOpen: boolean;
  registeredTeams: string[];
  totalRegisteredTeams?: number; // Actual count of all teams (pending + approved)
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  studentId: string;
  name: string;
  email: string;
  status: string;
}

interface Team {
  _id: string;
  teamName: string;
  captainId: {
    _id: string;
    name: string;
    email: string;
  };
  members: TeamMember[];
  status: string;
  paymentStatus: string;
}

interface FormData {
  name: string;
  sport: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  location: string;
  address: string;
  // REMOVE: format: string;
  teamSize: string;
  maxTeams: string;
  rules: string;
  entryFee: string;
  prize: string;
  isSponsorshipOpen: boolean;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

const getMinDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const minDate = getMinDate();

const SortableHeader = ({ label, sortKey, currentSort, onSort }: any) => {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  return (
    <Box
      onClick={() => onSort(sortKey)}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "90%",
        cursor: "pointer",
        userSelect: "none",
        "&:hover": {
          opacity: 0.7,
        },
      }}
    >
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        <KeyboardArrowUpIcon
          sx={{
            fontSize: 12,
            color: isActive && direction === "asc" ? "#003d52" : "#d1d5db",
            transition: "color 0.2s",
          }}
        />
        <KeyboardArrowDownIcon
          sx={{
            fontSize: 12,
            color: isActive && direction === "desc" ? "#003d52" : "#d1d5db",
            transition: "color 0.2s",
            mt: -0.5,
          }}
        />
      </Box>
    </Box>
  );
};

export default function TournamentPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [originalData, setOriginalData] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);
  const [validationError, setValidationError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null,
  });
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });
const [teams, setTeams] = useState<Team[]>([]); // Store fetched teams
const [viewTeamsModalOpen, setViewTeamsModalOpen] = useState(false);
const [viewingTournamentName, setViewingTournamentName] = useState('');
const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
const [openMembers, setOpenMembers] = useState<Record<string, boolean>>({});


  const [formData, setFormData] = useState<FormData>({
    name: "",
    sport: "",
    status: "Open for Registration",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    location: "",
    address: "",
    teamSize: "",
    maxTeams: "",
    rules: "",
    entryFee: "0",
    prize: "",
    isSponsorshipOpen: false
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOpenTournamentId, setMenuOpenTournamentId] = useState<string | null>(null);
  const isMenuOpen = Boolean(anchorEl);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:4000/event-office/tournaments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTournaments(res.data.data || []);
      setOriginalData(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Failed to load tournaments",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTournaments();
  }, [token]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";

    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }

    setSortConfig({ key, direction });

    if (direction === null) {
      setTournaments([...originalData]);
      return;
    }

    const sorted = [...tournaments].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (key) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "sport":
          aValue = a.sport.toLowerCase();
          bValue = b.sport.toLowerCase();
          break;
        case "status":
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case "startDate":
          aValue = new Date(a.startDate).getTime();
          bValue = new Date(b.startDate).getTime();
          break;
        case "location":
          aValue = a.location.toLowerCase();
          bValue = b.location.toLowerCase();
          break;
        case "maxTeams":
          aValue = a.maxTeams;
          bValue = b.maxTeams;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setTournaments(sorted);
  };





const handleMenuClick = (event: React.MouseEvent<HTMLElement>, t: Tournament) => {
  setAnchorEl(event.currentTarget);
  setMenuOpenTournamentId(t._id);
  setSelectedTournament(t); // store the full object
};


  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOpenTournamentId(null);
  };

  const handleOpenModal = (tournament?: Tournament) => {
    if (tournament) {
      setEditingTournament(tournament);
      setFormData({
        name: tournament.name,
        sport: tournament.sport,
        status: tournament.status,
        startDate: tournament.startDate.split("T")[0],
        endDate: tournament.endDate.split("T")[0],
        registrationDeadline: tournament.registrationDeadline.split("T")[0],
        location: tournament.location,
        address: tournament.address || "",
        teamSize: tournament.teamSize.toString(),
        maxTeams: tournament.maxTeams.toString(),
        rules: tournament.rules || "",
        entryFee: tournament.entryFee.toString(),
        prize: tournament.prize || "",
        isSponsorshipOpen: tournament.isSponsorshipOpen || false
      });
    } else {
      setEditingTournament(null);
      setFormData({
        name: "",
        sport: "",
        status: "Open for Registration",
        startDate: "",
        endDate: "",
        registrationDeadline: "",
        location: "",
        address: "",
        teamSize: "",
        maxTeams: "",
        rules: "",
        entryFee: "0",
        prize: "",
        isSponsorshipOpen: false
      });
    }
    setValidationError("");
    setFormErrors({});
    setActiveStep(0);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTournament(null);
    setValidationError("");
    setFormErrors({});
    setFormData({
      name: "",
      sport: "",
      status: "Open for Registration",
      startDate: "",
      endDate: "",
      registrationDeadline: "",
      location: "",
      address: "",
      teamSize: "",
      maxTeams: "",
      rules: "",
      entryFee: "0",
      prize: "",
      isSponsorshipOpen: false
    });
    setActiveStep(0);
  };

const handleViewTeams = async (tournamentId: string, tournamentName: string) => {
  try {
    const token = localStorage.getItem('token'); // or wherever you store your auth token
const res = await fetch(
  `http://localhost:4000/event-office/tournaments/${tournamentId}/teams`,
  {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // if using JWT auth
    },
  }
);


    if (!res.ok) throw new Error(`Failed to fetch teams: ${res.status}`);
    const data = await res.json();

    setTeams(data.data); // teams array
    setViewingTournamentName(tournamentName);
    setViewTeamsModalOpen(true); // open modal
  } catch (error) {
    console.error(error);
    setSnackbar({ open: true, message: 'Failed to load teams', severity: 'error' });
  }
};



const handleUpdateTeamStatus = async (teamId: string, newStatus: "Approved" | "Rejected" | "Disqualified") => {
  try {
    const response = await fetch(`http://localhost:4000/event-office/tournaments/teams/${teamId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ newStatus }),
    });
    const data = await response.json();
    if (data.success) {
      // Update the local team list to reflect status change
      setTeams(prev => prev.map(t => t._id === teamId ? { ...t, status: newStatus } : t));
    } else {
      alert(data.error || "Failed to update team status");
    }
  } catch (error) {
    console.error(error);
    alert("Error updating team status");
  }
};


  const handleOpenDeleteDialog = (tournament: Tournament) => {
    setDeletingTournament(tournament);
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeletingTournament(null);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) errors.name = "Tournament name is required";
    if (!formData.sport) errors.sport = "Sport is required";
    if (!formData.status) errors.status = "Status is required";
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (!formData.endDate) errors.endDate = "End date is required";
    if (!formData.registrationDeadline) errors.registrationDeadline = "Registration deadline is required";
    if (!formData.location.trim()) errors.location = "Location is required";
    // REMOVE THIS LINE - format is now optional:
    // if (!formData.format.trim()) errors.format = "Format is required";
    
    const teamSize = parseInt(formData.teamSize);
    if (!teamSize || teamSize < 1) errors.teamSize = "Team size must be at least 1";
    
    const maxTeams = parseInt(formData.maxTeams);
    if (!maxTeams || maxTeams < 1) errors.maxTeams = "Max teams must be at least 1";
    
    const entryFee = parseFloat(formData.entryFee);
    if (isNaN(entryFee) || entryFee < 0) errors.entryFee = "Entry fee must be 0 or greater";
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        errors.endDate = "End date must be after start date";
      }
    }
    
    if (formData.registrationDeadline && formData.startDate) {
      if (new Date(formData.registrationDeadline) > new Date(formData.startDate)) {
        errors.registrationDeadline = "Registration deadline must be before start date";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setValidationError("");
      const payload = {
        ...formData,
        teamSize: parseInt(formData.teamSize),
        maxTeams: parseInt(formData.maxTeams),
        entryFee: parseFloat(formData.entryFee)
      };

      if (editingTournament) {
        const res = await axios.put(
          `http://localhost:4000/event-office/tournaments/${editingTournament._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSnackbar({
          open: true,
          message: res.data.message || "Tournament updated successfully!",
          severity: "success",
        });
      } else {
        const res = await axios.post(
          "http://localhost:4000/event-office/tournaments", 
          payload, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSnackbar({
          open: true,
          message: res.data.message || "Tournament created successfully!",
          severity: "success",
        });
      }

      await fetchTournaments();
      handleCloseModal();
    } catch (err: any) {
      console.error(err);
      setValidationError(err.response?.data?.error || err.message || "An error occurred");
      setSnackbar({
        open: true,
        message: err.response?.data?.error || err.message || "An error occurred",
        severity: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingTournament) return;

    try {
      const res = await axios.delete(
        `http://localhost:4000/event-office/tournaments/${deletingTournament._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({
        open: true,
        message: res.data.message || "Tournament deleted successfully!",
        severity: "success",
      });
      await fetchTournaments();
      handleCloseDeleteDialog();
    } catch (err: any) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || err.message || "An error occurred",
        severity: "error",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatSport = (sport: string) => {
    return sport.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Draft': "#e2e8f0",
      'Open for Registration': "#dbeafe",
      'Sponsorship Open': "#f3e8ff",
      'In Progress': "#fef3c7",
      'Completed': "#d1fae5",
      'Cancelled': "#fee2e2",
    };
    return colors[status] || "#e2e8f0";
  };

  const getSportColor = (sport: string) => {
    const colors: Record<string, string> = {
      tennis: "#cde6e2ff",
      football: "#d5d7dfff",
      basketball: "#fbf0e2ff",
      volleyball: "#fbe0d9ff",
      handball: "#e3f8dfff",
      pingpong: "#f7dedeff",
      'power lifting': "#fce7f3",
      'cross fit': "#ddd6fe",
      chess: "#fef9c3",
    };
    return colors[sport] || "#e2e8f0";
  };

  const handleOpenModalFromMenu = () => {
    handleMenuClose();
    if (menuOpenTournamentId) {
      const tournamentToEdit = tournaments.find(t => t._id === menuOpenTournamentId);
      if (tournamentToEdit) {
        handleOpenModal(tournamentToEdit);
      }
    }
  };

  const handleOpenDeleteDialogFromMenu = () => {
    handleMenuClose();
    if (menuOpenTournamentId) {
      const tournamentToDelete = tournaments.find(t => t._id === menuOpenTournamentId);
      if (tournamentToDelete) {
        handleOpenDeleteDialog(tournamentToDelete);
      }
    }
  };

  const tournamentColumns: TableColumn<Tournament>[] = [
    {
      id: "name",
      label: (
        <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
          <SortableHeader label="TOURNAMENT" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
        </Box>
      ),
      width: "1.5fr",
      render: (t) => (
        <Box>
          <Typography sx={{ fontWeight: 600, color: "#1e293b" }}>
            {t.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", display: "flex", alignItems: "center", gap: 0.5 }}>
            <MoneyIcon fontSize="small" /> ${t.entryFee} Entry Fee {t.prize && `• Prize: ${t.prize}`}
          </Typography>
        </Box>
      ),
    },
    {
      id: "sport",
      label: (
        <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
          <SortableHeader label="SPORT" sortKey="sport" currentSort={sortConfig} onSort={handleSort} />
        </Box>
      ),
      width: "1.0fr",
      render: (t) => (
        <Chip
          label={formatSport(t.sport)}
          sx={{
            minWidth: "120px",
            justifyContent: "center",
            backgroundColor: getSportColor(t.sport),
            color: "black",
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: "status",
      label: (
        <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
          <SortableHeader label="STATUS" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
        </Box>
      ),
      width: "1.0fr",
      render: (t) => (
        <Chip
          label={t.status}
          sx={{
            minWidth: "120px",
            justifyContent: "center",
            backgroundColor: getStatusColor(t.status),
            color: "black",
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: "date",
      label: (
        <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
          <SortableHeader label="DATE" sortKey="startDate" currentSort={sortConfig} onSort={handleSort} />
        </Box>
      ),
      width: "1.0fr",
      render: (t) => (
        <Box>
          <TextCell text={formatDate(t.startDate)} color="#6b7280" />
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            to {formatDate(t.endDate)}
          </Typography>
        </Box>
      ),
    },
    {
      id: "location",
      label: (
        <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
          <SortableHeader label="LOCATION" sortKey="location" currentSort={sortConfig} onSort={handleSort} />
        </Box>
      ),
      width: "1.0fr",
      render: (t) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <LocationIcon fontSize="small" sx={{ color: "#64748b" }} />
          <TextCell text={t.location} color="#6b7280" />
        </Box>
      ),
    },
    {
      id: "teams",
      label: (
        <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>
            TEAMS
          </Typography>
        </Box>
      ),
      width: "0.8fr",
      render: (t) => (
        <Typography sx={{ color: "#6b7280", fontWeight: 500 }}>
          {t.totalRegisteredTeams ?? t.registeredTeams?.length ?? 0}/{t.maxTeams}
        </Typography>
      ),
    },
    {
      id: "actions",
      label: "",
      width: "0.5fr",
      align: "center",
      render: (t) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <IconButton
            size="small"
            onClick={(e) => handleMenuClick(e, t)}
            sx={{
              color: "#64748b",
              "&:hover": { backgroundColor: "rgba(0, 61, 82, 0.1)" },
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ minHeight: "100vh" }}>
        {/* Hero Section - Same as Gym Page */}
        <Box
          sx={{
            position: "relative",
            background:
              "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1600')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "320px",
            display: "flex",
            alignItems: "center",
            mb: 4,
            borderRadius: 3,
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(135deg, rgba(147, 199, 193, 0.1) 0%, rgba(0, 61, 82, 0.2) 100%)",
            },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1, px: 4, py: 6, width: "100%" }}>
            <Typography
              variant="h3"
              sx={{
                color: "white",
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: "2rem", md: "2.5rem" },
              }}
            >
              🏆 Tournament Management
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                mb: 3,
                maxWidth: "700px",
                fontSize: "1rem",
                lineHeight: 1.6,
              }}
            >
              Create and manage sports tournaments. Track registrations, set schedules, and coordinate team participation.
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenModal()}
                sx={{
                  px: 3,
                  py: 1.25,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  bgcolor: "white",
                  color: "#003d52",
                  "&:hover": {
                    bgcolor: "#f5f5f5",
                  },
                }}
              >
                Create Tournament
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={fetchTournaments}
                disabled={loading}
                sx={{
                  px: 3,
                  py: 1.25,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  color: "white",
                  "&:hover": {
                    borderColor: "white",
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Content Area */}
        <Box sx={{ px: 4, pb: 4 }}>
          {/* DataTable */}
          <Box sx={{ mx: -4 }}>
            <DataTable
              columns={tournamentColumns}
              data={tournaments}
              loading={loading}
              keyExtractor={(t) => t._id}
              emptyMessage="No tournaments found. Click 'Create Tournament' to add one."
              horizontalPadding={4}
            />
          </Box>
        </Box>


{/* NEW CODE - ADD THIS: */}
<TournamentFormDialog
  open={showModal}
  onClose={handleCloseModal}
  isEdit={!!editingTournament}
  form={formData}
  setForm={setFormData}
  activeStep={activeStep}
  setActiveStep={setActiveStep}
  onSubmit={handleSubmit}
  validationError={validationError}
  formErrors={formErrors}
  setFormErrors={setFormErrors}
/>
<Dialog
  open={viewTeamsModalOpen}
  onClose={() => setViewTeamsModalOpen(false)}
  maxWidth="md"
  fullWidth
>
  {/* Header */}
  <DialogTitle
    sx={{
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      bgcolor: "#f0f9ff",
      borderBottom: "2px solid #bae6fd",
    }}
  >
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: "#075985" }}>
        Teams Registered for {viewingTournamentName}
      </Typography>
      <Typography variant="caption" sx={{ color: "#0284c7" }}>
        {teams.length} registered
      </Typography>
    </Box>
    <IconButton onClick={() => setViewTeamsModalOpen(false)} size="small">
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  {/* Content */}
  <DialogContent sx={{ px: 3, py: 3 }}>
    {teams.length === 0 ? (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>
          No teams registered yet
        </Typography>
        <Typography sx={{ color: "#9ca3af", fontSize: "0.875rem" }}>
          Teams will appear here once they register
        </Typography>
      </Box>
    ) : (
      <Box sx={{ mt: 3 }}>
<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
  {teams.map((team) => (
    <Box
      key={team._id}
      sx={{
        p: 3,
        bgcolor: "#f8fafc",
        borderRadius: 2,
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Team Name */}
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#0c4a6e" }}>
        {team.teamName}
      </Typography>

{/* Captain */}
<Typography variant="body2" sx={{ color: "#64748b" }}>
  <strong>Captain:</strong> {team.captainId.name} ({team.captainId.email})
</Typography>

{/* Status & Payment (stacked) */}
<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
  {/* Registration Status */}
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600 }}>
      Registration Status:
    </Typography>
    <Chip
      label={team.status}
      color={
        team.status === "Approved"
          ? "success"
          : team.status === "Pending"
          ? "warning"
          : "error"
      }
      size="small"
    />
  </Box>

  {/* Payment Status */}
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600 }}>
      Payment Status:
    </Typography>
    <Chip
      label={team.paymentStatus}
      color={
        team.paymentStatus === "Paid"
          ? "success"
          : team.paymentStatus === "Pending"
          ? "warning"
          : "default"
      }
      size="small"
    />
  </Box>
</Box>

{/* Members Section */}
<Box>
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
    }}
    onClick={() =>
      setOpenMembers((prev) => ({
        ...prev,
        [team._id]: !prev[team._id],
      }))
    }
  >
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      Members ({team.members.length})
    </Typography>

    <IconButton size="small">
      {openMembers[team._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
    </IconButton>
  </Box>

  <Collapse in={openMembers[team._id]} timeout="auto" unmountOnExit>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
      {team.members.map((m) => (
        <Box
          key={m.studentId}
          sx={{
            p: 1.5,
            bgcolor: "#e0f2fe",
            borderRadius: 1,
            border: "1px solid #bae6fd",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {m.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "#0c4a6e", display: "block" }}>
            ID: {m.studentId}
          </Typography>
          <Typography variant="caption" sx={{ color: "#0c4a6e", display: "block" }}>
            Email: {m.email}
          </Typography>
        </Box>
      ))}
    </Box>
  </Collapse>
</Box>
    </Box>
  ))}
</Box>
</Box>
    )}
  </DialogContent>
</Dialog>


        {/* Delete Confirmation Dialog */}
        <Dialog
          open={showDeleteDialog}
          onClose={handleCloseDeleteDialog}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle
            sx={{
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: "#fef2f2",
              borderBottom: "2px solid #fecaca",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <WarningIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#991b1b" }}>
                Delete Tournament
              </Typography>
              <Typography variant="caption" sx={{ color: "#dc2626" }}>
                This action cannot be undone
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ px: 4, py: 3 }}>
            <Typography sx={{ mb: 3, color: "#475569" }}>
              Are you sure you want to delete this tournament? All registered teams will be notified and removed.
            </Typography>
            {deletingTournament && (
              <Box
                sx={{
                  p: 3,
                  bgcolor: "#f8fafc",
                  borderRadius: 2,
                  border: "2px solid #e2e8f0",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Chip
                    label={formatSport(deletingTournament.sport)}
                    sx={{
                      backgroundColor: getSportColor(deletingTournament.sport),
                      color: "black",
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    label={deletingTournament.status}
                    sx={{
                      backgroundColor: getStatusColor(deletingTournament.status),
                      color: "black",
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrophyIcon sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Name:</strong> {deletingTournament.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Date:</strong> {formatDate(deletingTournament.startDate)} - {formatDate(deletingTournament.endDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationIcon sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Location:</strong> {deletingTournament.location}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PeopleIcon sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Teams:</strong> {deletingTournament.registeredTeams?.length || 0}/{deletingTournament.maxTeams}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 4, py: 3, bgcolor: "#f8fafc", gap: 2 }}>
            <Button
              onClick={handleCloseDeleteDialog}
              variant="outlined"
              sx={{
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#cbd5e1",
                color: "#64748b",
                "&:hover": {
                  borderColor: "#94a3b8",
                  bgcolor: "#f1f5f9",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              sx={{
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#ef4444",
                "&:hover": {
                  bgcolor: "#dc2626",
                },
              }}
            >
              Delete Tournament
            </Button>
          </DialogActions>
        </Dialog>

        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem 
            onClick={handleOpenModalFromMenu} 
            sx={{ color: '#3b82f6', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' } }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit Tournament
          </MenuItem>
          
<MenuItem
  onClick={() => {
    if (selectedTournament) {
      handleViewTeams(selectedTournament._id, selectedTournament.name);
    }
  }}
  sx={{ color: '#10b981', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' } }}
>
  <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
  View Teams
</MenuItem>
          <MenuItem 
            onClick={handleOpenDeleteDialogFromMenu} 
            sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fef2f2', color: '#b91c1c' } }}
          >
            <Trash2 size={18} style={{ marginRight: 8 }} />
            Delete Tournament
          </MenuItem>
        </Menu>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </BasicLayout>
  );
}