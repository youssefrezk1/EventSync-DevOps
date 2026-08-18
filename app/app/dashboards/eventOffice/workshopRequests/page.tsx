"use client";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  EventBusy as EventBusyIcon,
  ExpandMore,
  ExpandLess,
  Timer as TimerIcon,
  People as PeopleIcon,
  FitnessCenter as FitnessCenterIcon,
} from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  IconButton,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
  Chip,
  Divider,
  Grid,
  alpha,
  Collapse,
  Menu
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Search, LocationOn, People, AttachMoney, School,LocalOffer } from "@mui/icons-material";
import BasicLayout from "@/components/layouts/basicLayout2";
import DataTable, { TableColumn } from "@/components/DataTable";
import { TextCell, StatusChip, DateRangeCell, NumberCell, CurrencyCell } from "@/components/TableComponents";
import { RefreshCw, TextAlignJustify } from "lucide-react";
import axios from "axios";
import { number } from "framer-motion";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"; 
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"; 
import { Center } from "@react-three/drei";
import {
  // ... other imports
  EmojiEvents, // Add this import
} from "@mui/icons-material";
const menuItems = [
  { text: "Home", icon: <Search />, href: "/dashboards/eventOffice" },
  { text: "Events", icon: <Search />, href: "/dashboards/eventOffice/events" },
  { text: "Tournaments", icon: <EmojiEvents />, href: "/dashboards/eventOffice/tournaments" }, // Add this line
  { text: "Gym", icon: <Search />, href: "/dashboards/eventOffice/gym" },
  { text: "Workshop Requests", icon: <Search />, href: "/dashboards/eventOffice/workshopRequests" },
  { text: "Vendor Requests", icon: <Search />, href: "/dashboards/eventOffice/vendorRequests" },
  { text: "Reports", icon: <Search />, href: "/dashboards/eventOffice/reports" },
  { text: "Overlapping Booths", icon: <Search />, href: "/dashboards/eventOffice/overlappingBooths" },
  { text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/eventOffice/loyaltyProgram"},
];




// Sortable Header Component
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


interface Workshop {
  _id: string;
  name: string;
  location: "GUC Cairo" | "GUC Berlin";
  start: string;
  end: string;
  shortDescription: string;
  fullagenda: string;
  facultyResponsible: string;
  professorsParticipating: string[];
  requiredBudget: number;
  fundingSource: "external" | "GUC";
  extraRequiredResources: string;
  capacity: number;
  registrationDeadline: string;
  status: "Pending" | "confirmed" | "rejected";
  requestChange: string;
  ProfCreator: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

interface Filters {
  search: string;
  faculty: string;
  location: string;
  date: string;
  sortBy: string;
  capacity: number;
  budget: number;
}

export default function WorkshopRequestsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [originalData, setOriginalData] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [editWorkshop, setEditWorkshop] = useState<Workshop | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
      key: "",
      direction: null,
    });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "accept" | "reject" | null;
    workshop: Workshop | null;
  }>({ open: false, type: null, workshop: null });
  const [editMessage, setEditMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [agendaExpanded, setAgendaExpanded] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    faculty: "",
    location: "",
    date: "",
    capacity: 0,
    sortBy: "start",
    budget: 0,
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOpenWorkshop, setMenuOpenWorkshop] = useState<Workshop | null>(null);
  const isMenuOpen = Boolean(anchorEl);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchWorkshops = async (applyFilters = true) => {
    try {
      setLoading(true);
      const res = await axios.get<{ ok: boolean; workshops: Workshop[] }>(
        "/event-office/workshops",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let filtered = res.data.workshops;

      if (applyFilters) {
        if (filters.search)
          filtered = filtered.filter((w) =>
            w.name.toLowerCase().includes(filters.search.toLowerCase())
          );
        if (filters.location)
          filtered = filtered.filter((w) =>
            w.location.toLowerCase().includes(filters.location.toLowerCase())
          );
        if (filters.date)
          filtered = filtered.filter(
            (w) => new Date(w.start).toISOString().slice(0, 10) === filters.date
          );
        if (filters.faculty)
          filtered = filtered.filter((w) =>
            w.facultyResponsible.toLowerCase().includes(filters.faculty.toLowerCase())
          );

        
      }

      setWorkshops(filtered);
      setOriginalData(filtered);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to load workshops", severity: "error" });
    } finally {
      setLoading(false);
    }
  };


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
      setWorkshops([...originalData]);
      return;
    }

    const sorted = [...workshops].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (key) {
        case "search":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "faculty":
          aValue = a.facultyResponsible.toLowerCase();
          bValue = b.facultyResponsible.toLowerCase();
          break;
        case "date":
          aValue = new Date(a.start || 0).getTime();
          bValue = new Date(b.start || 0).getTime();
          break;
        case "location":
          aValue = a.location || 0;
          bValue = b.location || 0;
          break;
        case "capacity":
          aValue = a.capacity || 0;
          bValue = b.capacity || 0;
          break;
        case "budget":
          aValue = a.requiredBudget || 0;
          bValue = b.requiredBudget || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setWorkshops(sorted);
  };



  useEffect(() => {
    if (token) fetchWorkshops(false);
  }, [token]);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    fetchWorkshops(true);
  };

  const handleClearFilters = async () => {
    const clearedFilters = {
      search: "",
      faculty: "",
      location: "",
      date: "",
      capacity: 0,
      sortBy: "start",
      budget: 0,
    };
    setFilters(clearedFilters);
    
    try {
      setLoading(true);
      const res = await axios.get<{ ok: boolean; workshops: Workshop[] }>(
        "/event-office/workshops",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkshops(res.data.workshops);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to load workshops", severity: "error" });
    } finally {
      setLoading(false);
    }
  };


  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, workshop: Workshop) => {
        setAnchorEl(event.currentTarget);
        setMenuOpenWorkshop(workshop);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuOpenWorkshop(null);
    };

    const handleAcceptFromMenu = () => {
        handleMenuClose();
        if (menuOpenWorkshop) {
            handleActionClick(menuOpenWorkshop, "Accept");
        }
    };

    const handleEditFromMenu = () => {
        handleMenuClose();
        if (menuOpenWorkshop) {
            handleEditRequest(menuOpenWorkshop);
        }
    };

    const handleRejectFromMenu = () => {
        handleMenuClose();
        if (menuOpenWorkshop) {
            handleActionClick(menuOpenWorkshop, "Reject");
        }
    };

  const handleActionClick = async (workshop: Workshop, action: "Accept" | "Reject") => {
    setConfirmDialog({ open: true, type: action.toLowerCase() as "accept" | "reject", workshop });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.workshop || !confirmDialog.type) return;
    
    setUpdatingId(confirmDialog.workshop._id);
    setConfirmDialog({ open: false, type: null, workshop: null });
    
    try {
      const url = `/event-office/workshops/${confirmDialog.workshop._id}/${confirmDialog.type}`;
      await axios.patch(url, {}, { headers: { Authorization: `Bearer ${token}` } });

      setSnackbar({ open: true, message: `Workshop ${confirmDialog.type}ed successfully`, severity: "success" });
      setWorkshops((prev) => prev.filter((w) => w._id !== confirmDialog.workshop!._id));
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: `Failed to ${confirmDialog.type} workshop`, severity: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewDetails = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
  };

  const handleEditRequest = (workshop: Workshop) => {
    setEditWorkshop(workshop);
    setEditMessage("");
  };

  const handleSubmitEditRequest = async () => {
    if (!editWorkshop || !editMessage.trim()) return;

    try {
      const url = `/event-office/workshops/${editWorkshop._id}/request-edits`;
      await axios.patch(url, { edits: editMessage }, { headers: { Authorization: `Bearer ${token}` } });

      setSnackbar({ open: true, message: "Edit request sent successfully", severity: "success" });
      setEditWorkshop(null);
      setEditMessage("");
      setWorkshops((prev) => prev.filter((w) => w._id !== editWorkshop._id));
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to send edit request", severity: "error" });
    }
  };

  const parseAgenda = (agendaString: string) => {
    try {
      return JSON.parse(agendaString);
    } catch {
      return [];
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const workshopColumns: TableColumn<Workshop>[] = [
    { id: "name", label: (
                <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
                    <SortableHeader label="NAME" sortKey="search" currentSort={sortConfig} onSort={handleSort} />
                </Box>
            ), width: "2fr", render: (w) => <TextCell text={w.name} fontWeight={600} /> },
    { id: "faculty", label:(
                <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
                    <SortableHeader label="FACULTY" sortKey="faculty" currentSort={sortConfig} onSort={handleSort} />                
                </Box>
            ), width: "1.0fr", render: (w) => <TextCell text={w.facultyResponsible} color="#6b7280" /> },
    { id: "location", label:(
                <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
                    <SortableHeader label="LOCATION" sortKey="location" currentSort={sortConfig} onSort={handleSort} />
                </Box>
            ), width: "1.2fr", render: (w) => <TextCell text={w.location} color="#6b7280" /> },
    { id: "date", label:(
                <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
                    <SortableHeader label="DATES" sortKey="date" currentSort={sortConfig} onSort={handleSort} /> 
                </Box>
            ), width: "1.8fr", render: (w) => <DateRangeCell start={w.start} end={w.end} /> },
    { id: "capacity", label:(
                <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
                    <SortableHeader label="CAPACITY" sortKey="capacity" currentSort={sortConfig} onSort={handleSort} />
                </Box>
            ), width: "1fr", render: (w) => <NumberCell value={w.capacity} /> },
    { id: "budget", label:(
                <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
                    <SortableHeader label="BUDGET" sortKey="budget" currentSort={sortConfig} onSort={handleSort} /> 
                </Box>
            ), width: "1fr", render: (w) => <CurrencyCell amount={w.requiredBudget} /> },
    { id: "status", label: <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }} >
                    STATUS
             </Box>,
              width: "1fr", render: (w) => <StatusChip label={w.status} /> },

    {
      id: "details",
      label: <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
  DETAILS
 </Box>,
      width: "0.9fr",
      render: (w) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleViewDetails(w)}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 2,
            py: 0.5,
            bgcolor: "#003d52",
            fontSize: "0.8125rem",
            "&:hover": {
              bgcolor: "#002a3a",
            },
          }}
        >
          View
        </Button>
      ),
    },
    {
 id: "actions",
 label: "",
 width: "0.5fr",
 align: "center",
 render: (w) => (
  <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
             {/* New Three-Dot Button */}
 <IconButton
  size="small"
  onClick={(e) => handleMenuClick(e, w)}
  sx={{
   color: "#64748b",
   "&:hover": { backgroundColor: "rgba(0, 61, 82, 0.1)" },
  }}
 >
  <MoreVertIcon fontSize="small" /> 
 </IconButton>
  </Box>
 ),
  }
  ];

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ minHeight: "100vh" }}>
        {/* Hero Section */}
        <Box
          sx={{
            position: "relative",
            background:
              "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1600')",
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
              background: "linear-gradient(135deg, rgba(147, 199, 193, 0.1) 0%, rgba(0, 61, 82, 0.2) 100%)" 
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
              📝 Workshop Requests
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
              View all workshop requests submitted by faculty. You can accept, reject, or request edits.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshCw size={18} />}
              onClick={() => fetchWorkshops(false)}
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

        {/* Content Area */}
        <Box sx={{ px: 4, pb: 4 }}>
          {/* Filter Section */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                mx: -4,
                px: 4,
                py: 3,
                bgcolor: "white",
                borderRadius: 2.5,
                border: "1px solid #e5e7eb",
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={3} color="#111827" fontSize="1.125rem">
                Filter Options
              </Typography>

              <Grid container spacing={2} alignItems="center">
                <Grid size={{xs: 12, sm: 6, md: 2.4}}>
                  <TextField
                    fullWidth
                    placeholder="Search Workshops..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: "#9ca3af", fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        bgcolor: "#f9fafb",
                        "& fieldset": { border: "1px solid #e5e7eb" },
                        "&:hover fieldset": { borderColor: "#d1d5db" },
                        "&.Mui-focused fieldset": { borderColor: "#93c7c1" },
                      },
                    }}
                    sx={{ "& .MuiInputBase-input": { fontSize: "0.875rem", py: 1.25 } }}
                  />
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 2.4}}>
                  <TextField
                    fullWidth
                    placeholder="Search by Faculty..."
                    value={filters.faculty}
                    onChange={(e) => handleFilterChange("faculty", e.target.value)}
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        bgcolor: "#f9fafb",
                        "& fieldset": { border: "1px solid #e5e7eb" },
                        "&:hover fieldset": { borderColor: "#d1d5db" },
                        "&.Mui-focused fieldset": { borderColor: "#93c7c1" },
                      },
                    }}
                    sx={{ "& .MuiInputBase-input": { fontSize: "0.875rem", py: 1.25 } }}
                  />
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 2.4}}>
                  <TextField
                    fullWidth
                    placeholder="Location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn sx={{ color: "#9ca3af", fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        bgcolor: "#f9fafb",
                        "& fieldset": { border: "1px solid #e5e7eb" },
                        "&:hover fieldset": { borderColor: "#d1d5db" },
                        "&.Mui-focused fieldset": { borderColor: "#93c7c1" },
                      },
                    }}
                    sx={{ "& .MuiInputBase-input": { fontSize: "0.875rem", py: 1.25 } }}
                  />
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 2.4}}>
                  <TextField
                    fullWidth
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange("date", e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon sx={{ color: "#9ca3af", fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        bgcolor: "#f9fafb",
                        "& fieldset": { border: "1px solid #e5e7eb" },
                        "&:hover fieldset": { borderColor: "#d1d5db" },
                        "&.Mui-focused fieldset": { borderColor: "#93c7c1" },
                      },
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiInputBase-input": { fontSize: "0.875rem", py: 1.25 } }}
                  />
                </Grid>

                

                <Grid size={{xs: 12, sm: 6, md: 1.2}}>
                  <Button
                    variant="contained"
                    onClick={handleApplyFilters}
                    fullWidth
                    sx={{
                      py: 1,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      bgcolor: "#003d52",
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: "#002a3a",
                        boxShadow: "0 2px 8px rgba(0, 61, 82, 0.24)",
                      },
                    }}
                  >
                    Apply Filters
                  </Button>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 1.2}}>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    fullWidth
                    sx={{
                      py: 1,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      borderColor: "#e5e7eb",
                      "&:hover": {
                        borderColor: "#d1d5db",
                        bgcolor: "#f9fafb",
                      },
                    }}
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* DataTable */}
          <Box sx={{ mx: -4 }}>
            <DataTable
              columns={workshopColumns}
              data={workshops}
              loading={loading}
              keyExtractor={(w) => w._id}
              emptyMessage="No workshop requests found"
              horizontalPadding={4}
            />
          </Box>
        </Box>

        {/* View Details Dialog - Enhanced Design */}
        <Dialog
          open={!!selectedWorkshop}
          onClose={() => setSelectedWorkshop(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: `0 24px 60px ${alpha("#003d52", 0.2)}`,
            },
          }}
        >
          {selectedWorkshop && (
            <>
              <Box
                sx={{
                  bgcolor: "#003d52",
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

                <Box position="relative" zIndex={1}>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    color="white"
                    sx={{ 
                      letterSpacing: "-0.5px",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      hyphens: "auto",
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedWorkshop.name}
                  </Typography>
                </Box>
              </Box>

              <DialogContent sx={{ p: 4 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="overline"
                      fontWeight={700}
                      color="#003d52"
                      sx={{
                        fontSize: "0.75rem",
                        letterSpacing: 1.5,
                        mb: 2,
                        display: "block",
                      }}
                    >
                      WORKSHOP DETAILS
                    </Typography>
                    <Stack spacing={2.5}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha("#003d52", 0.04),
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: alpha("#003d52", 0.1),
                            borderRadius: 2,
                            p: 1.5,
                            display: "flex",
                          }}
                        >
                          <CalendarTodayIcon
                            sx={{ color: "#003d52", fontSize: 24 }}
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
                            {formatDateTime(selectedWorkshop.start)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            to {formatDateTime(selectedWorkshop.end)}
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
                          bgcolor: alpha("#FB8C00", 0.04),
                          border: `1px solid ${alpha("#FB8C00", 0.2)}`,
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: alpha("#FB8C00", 0.1),
                            borderRadius: 2,
                            p: 1.5,
                            display: "flex",
                          }}
                        >
                          <EventBusyIcon
                            sx={{ color: "#FB8C00", fontSize: 24 }}
                          />
                        </Box>
                        <Box flex={1}>
                          <Typography
                            variant="caption"
                            color="#FB8C00"
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
                            color="#FB8C00"
                          >
                            {formatDateTime(selectedWorkshop.registrationDeadline)}
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
                            border: `1px solid ${alpha("#003d52", 0.1)}`,
                          }}
                        >
                          <LocationOnIcon
                            sx={{ color: "#003d52", fontSize: 22 }}
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
                              {selectedWorkshop.location}
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
                            border: `1px solid ${alpha("#003d52", 0.1)}`,
                          }}
                        >
                          <People
                            sx={{ color: "#003d52", fontSize: 22 }}
                          />
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={600}
                              display="block"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              CAPACITY
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {selectedWorkshop.capacity}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={2}>
                        <Box
                          sx={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${alpha("#003d52", 0.1)}`,
                          }}
                        >
                          <AttachMoney
                            sx={{ color: "#003d52", fontSize: 22 }}
                          />
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={600}
                              display="block"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              BUDGET
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              ${selectedWorkshop.requiredBudget.toLocaleString()}
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
                            border: `1px solid ${alpha("#003d52", 0.1)}`,
                          }}
                        >
                          <School
                            sx={{ color: "#003d52", fontSize: 22 }}
                          />
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={600}
                              display="block"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              FUNDING SOURCE
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {selectedWorkshop.fundingSource === "GUC" ? "GUC" : "External"}
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
                      color="#003d52"
                      sx={{
                        fontSize: "0.75rem",
                        letterSpacing: 1.5,
                        mb: 2,
                        display: "block",
                      }}
                    >
                      DESCRIPTION
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ lineHeight: 1.8, mb: 2 }}
                    >
                      {selectedWorkshop.shortDescription}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Box 
                      sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between",
                        cursor: "pointer",
                        p: 1,
                        borderRadius: 1,
                        transition: "background-color 0.2s",
                        "&:hover": { bgcolor: alpha("#003d52", 0.04) }
                      }}
                      onClick={() => setAgendaExpanded(!agendaExpanded)}
                    >
                      <Typography
                        variant="overline"
                        fontWeight={700}
                        color="#003d52"
                        sx={{
                          fontSize: "0.75rem",
                          letterSpacing: 1.5,
                          display: "block",
                        }}
                      >
                        FULL AGENDA 
                      </Typography>
                      <IconButton 
                        size="small"
                        sx={{
                          transition: "transform 0.3s ease",
                          transform: agendaExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      >
                        <ExpandMore />
                      </IconButton>
                    </Box>
                    
                    <Collapse in={agendaExpanded} timeout={400}>
                      <Box sx={{ mt: 2 }}>
                        <Stack spacing={2}>
                          {parseAgenda(selectedWorkshop.fullagenda).map((item: any, index: number) => (
                            <Box
                              key={item.id}
                              sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: item.isBreak ? alpha("#FB8C00", 0.04) : alpha("#003d52", 0.04),
                                border: `1px solid ${item.isBreak ? alpha("#FB8C00", 0.2) : alpha("#003d52", 0.1)}`,
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                <Chip
                                  label={item.isBreak ? "BREAK" : `SESSION ${index + 1}`}
                                  size="small"
                                  sx={{
                                    bgcolor: item.isBreak ? "#FB8C00" : "#003d52",
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: "0.65rem",
                                  }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                                  {new Date(item.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                </Typography>
                              </Box>

                              {!item.isBreak ? (
                                <Stack spacing={1}>
                                  <Typography variant="subtitle1" fontWeight={700} color="#003d52">
                                    {item.title}
                                  </Typography>
                                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <AccessTimeIcon sx={{ fontSize: 16, color: "#64748b" }} />
                                      <Typography variant="body2" color="text.secondary">
                                        {item.startTime} - {item.endTime}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <LocationOnIcon sx={{ fontSize: 16, color: "#64748b" }} />
                                      <Typography variant="body2" color="text.secondary">
                                        {item.location}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <School sx={{ fontSize: 16, color: "#64748b" }} />
                                      <Typography variant="body2" color="text.secondary">
                                        {item.professor}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  {item.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: "italic" }}>
                                      {item.description}
                                    </Typography>
                                  )}
                                </Stack>
                              ) : (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <AccessTimeIcon sx={{ fontSize: 16, color: "#FB8C00" }} />
                                  <Typography variant="body2" fontWeight={600} color="#FB8C00">
                                    {item.startTime} - {item.endTime}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Collapse>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography
                      variant="overline"
                      fontWeight={700}
                      color="#003d52"
                      sx={{
                        fontSize: "0.75rem",
                        letterSpacing: 1.5,
                        mb: 2,
                        display: "block",
                      }}
                    >
                      FACULTY & PROFESSORS
                    </Typography>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.7rem" }}>
                          Faculty Responsible
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedWorkshop.facultyResponsible}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.7rem" }}>
                          Professors Participating
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedWorkshop.professorsParticipating.join(", ")}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {selectedWorkshop.extraRequiredResources && (
                    <>
                      <Divider />
                      <Box>
                        <Typography
                          variant="overline"
                          fontWeight={700}
                          color="#003d52"
                          sx={{
                            fontSize: "0.75rem",
                            letterSpacing: 1.5,
                            mb: 2,
                            display: "block",
                          }}
                        >
                          EXTRA REQUIRED RESOURCES
                        </Typography>
                        <Typography
                          variant="body1"
                          color="text.primary"
                          sx={{ lineHeight: 1.8 }}
                        >
                          {selectedWorkshop.extraRequiredResources}
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
                  borderTop: `1px solid ${alpha("#003d52", 0.08)}`,
                }}
              >
                <Button
                  onClick={() => setSelectedWorkshop(null)}
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
              </Box>
            </>
          )}
        </Dialog>

        {/* Confirmation Dialogs for Accept/Reject */}
        <Dialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ open: false, type: null, workshop: null })}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle
            sx={{
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: confirmDialog.type === "accept" ? "#f0fdf4" : "#fef2f2",
              borderBottom: confirmDialog.type === "accept" ? "2px solid #bbf7d0" : "2px solid #fecaca",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: confirmDialog.type === "accept" ? "#22c55e" : "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              {confirmDialog.type === "accept" ? <CheckCircleIcon /> : <CancelIcon />}
            </Box>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: confirmDialog.type === "accept" ? "#166534" : "#991b1b" 
                }}
              >
                {confirmDialog.type === "accept" ? "Accept Workshop" : "Reject Workshop"}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ color: confirmDialog.type === "accept" ? "#16a34a" : "#dc2626" }}
              >
                Please confirm your action
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ px: 4, py: 3 }}>
            <Typography sx={{ mb: 3, color: "#475569" }}>
              Are you sure you want to {confirmDialog.type} this workshop request?
            </Typography>
            {confirmDialog.workshop && (
              <Box
                sx={{
                  p: 3,
                  bgcolor: "#f8fafc",
                  borderRadius: 2,
                  border: "2px solid #e2e8f0",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {confirmDialog.workshop.name}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <School sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Faculty:</strong> {confirmDialog.workshop.facultyResponsible}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Location:</strong> {confirmDialog.workshop.location}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarTodayIcon sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Start:</strong> {formatDateTime(confirmDialog.workshop.start)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 4, py: 3, bgcolor: "#f8fafc", gap: 2 }}>
            <Button
              onClick={() => setConfirmDialog({ open: false, type: null, workshop: null })}
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
              onClick={handleConfirmAction}
              variant="contained"
              sx={{
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: confirmDialog.type === "accept" ? "#22c55e" : "#ef4444",
                "&:hover": {
                  bgcolor: confirmDialog.type === "accept" ? "#16a34a" : "#dc2626",
                },
              }}
            >
              {confirmDialog.type === "accept" ? "Accept Workshop" : "Reject Workshop"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Request Dialog - Gym Style */}
        <Dialog open={!!editWorkshop} onClose={() => setEditWorkshop(null)} maxWidth="sm" fullWidth>
          <DialogTitle
            sx={{
              fontWeight: 600,
              pr: 6,
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: "#f8fafc",
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "#003d52",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <EditIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Request Edits
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Provide feedback for the professor to improve
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent dividers sx={{ px: 4, py: 3, bgcolor: "#ffffff" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <EditIcon sx={{ color: "black", fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1e293b" }}>
                    Edit Request Message
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Describe the edits you'd like the professor to make..."
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#e2e8f0" },
                    },
                  }}
                />
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 4, py: 3, bgcolor: "#f8fafc", gap: 2 }}>
            <Button
              onClick={() => setEditWorkshop(null)}
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
              onClick={handleSubmitEditRequest}
              variant="contained"
              disabled={!editMessage.trim()}
              sx={{
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#003d52",
                "&:hover": {
                  bgcolor: "#002a3a",
                },
              }}
            >
              Send Request
            </Button>
          </DialogActions>
        </Dialog>


{/* --- Action Menu for Workshops --- */}
<Menu
    anchorEl={anchorEl}
    open={isMenuOpen}
    onClose={handleMenuClose}
    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
>
    {/* Accept Action */}
    <MenuItem 
        onClick={handleAcceptFromMenu} 
        disabled={menuOpenWorkshop?.status !== 'Pending' || updatingId === menuOpenWorkshop?._id}
        sx={{ color: '#15803d', '&:hover': { bgcolor: '#dcfce7' } }}
    >
        <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
        Accept
    </MenuItem>
    
    {/* Edit Action */}
    <MenuItem 
        onClick={handleEditFromMenu} 
        sx={{ color: '#0369a1', '&:hover': { bgcolor: '#e0f2fe' } }}
    >
        <EditIcon fontSize="small" sx={{ mr: 1 }} />
        Request Edits
    </MenuItem>
    
    {/* Reject Action */}
    <MenuItem 
        onClick={handleRejectFromMenu} 
        disabled={menuOpenWorkshop?.status !== 'Pending' || updatingId === menuOpenWorkshop?._id}
        sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}
    >
        <CancelIcon fontSize="small" sx={{ mr: 1 }} />
        Reject
    </MenuItem>
</Menu>

        {/* Snackbar */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={3000} 
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))} 
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </BasicLayout>
  );
}