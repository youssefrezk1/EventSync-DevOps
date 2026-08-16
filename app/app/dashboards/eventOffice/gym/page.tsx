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
  Menu
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
import {
  // ... other imports
  EmojiEvents, // Add this import
} from "@mui/icons-material";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/eventOffice" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/eventOffice/events" },
  { text: "Tournaments", icon: <EmojiEvents />, href: "/dashboards/eventOffice/tournaments" }, // Add this line
  { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/eventOffice/gym" },
  { text: "Workshop Requests", icon: <WorkIcon />, href: "/dashboards/eventOffice/workshopRequests" },
  { text: "Vendor Requests", icon: <BusinessIcon />, href: "/dashboards/eventOffice/vendorRequests" },
  { text: "Reports", icon: <BarChartIcon />, href: "/dashboards/eventOffice/reports" },
  { text: "Overlapping Booths", icon: <HomeIcon />, href: "/dashboards/eventOffice/overlappingBooths" },
  { text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/eventOffice/loyaltyProgram"},
];

interface GymClass {
  _id: string;
  date: string;
  time: string;
  duration: string;
  type: "yoga" | "pilates" | "aerobics" | "Zumba" | "cross circuit" | "kick-boxing";
  maxParticipants: number;
  counter?: number;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  date: string;
  time: string;
  duration: string;
  type: string;
  maxParticipants: string;
}
// --- Code to be added/updated at the top of your file ---
const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};
const minDate = getMinDate();

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

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
export default function GymPage() {
  const [gymClasses, setGymClasses] = useState<GymClass[]>([]);
  const [originalData, setOriginalData] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<GymClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<GymClass | null>(null);
  const [validationError, setValidationError] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null,
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });
  const [formData, setFormData] = useState<FormData>({
    date: "",
    time: "",
    duration: "",
    type: "",
    maxParticipants: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchGymClasses = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:4000/eventOffice/gym", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGymClasses(res.data);
      setOriginalData(res.data);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to load gym classes",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOpenClassId, setMenuOpenClassId] = useState<string | null>(null);
  const isMenuOpen = Boolean(anchorEl);
const handleMenuClick = (event: React.MouseEvent<HTMLElement>, g: GymClass) => {
        setAnchorEl(event.currentTarget);
        setMenuOpenClassId(g._id);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuOpenClassId(null);
    };
    // We update handleOpenModal and handleOpenDeleteDialog to use the class stored in menuOpenClassId
    const handleOpenModalFromMenu = () => {
        handleMenuClose();
        if (menuOpenClassId) {
            const classToEdit = gymClasses.find(c => c._id === menuOpenClassId);
            if (classToEdit) {
                handleOpenModal(classToEdit);
            }
        }
    };

    const handleOpenDeleteDialogFromMenu = () => {
        handleMenuClose();
        if (menuOpenClassId) {
            const classToDelete = gymClasses.find(c => c._id === menuOpenClassId);
            if (classToDelete) {
                handleOpenDeleteDialog(classToDelete);
            }
        }
    };
  useEffect(() => {
    if (token) fetchGymClasses();
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
      setGymClasses([...originalData]);
      return;
    }

    const sorted = [...gymClasses].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (key) {
        case "type":
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case "date":
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case "time":
          aValue = a.time;
          bValue = b.time;
          break;
        case "duration":
          aValue = parseInt(a.duration) || 0;
          bValue = parseInt(b.duration) || 0;
          break;
        case "maxParticipants":
          aValue = a.maxParticipants;
          bValue = b.maxParticipants;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setGymClasses(sorted);
  };

  const handleOpenModal = (gymClass?: GymClass) => {
    if (gymClass) {
      setEditingClass(gymClass);
      setFormData({
        date: gymClass.date.split("T")[0],
        time: gymClass.time,
        duration: gymClass.duration,
        type: gymClass.type,
        maxParticipants: gymClass.maxParticipants.toString(),
      });
    } else {
      setEditingClass(null);
      setFormData({
        date: "",
        time: "",
        duration: "",
        type: "",
        maxParticipants: "",
      });
    }
    setValidationError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setValidationError("");
    setFormData({
      date: "",
      time: "",
      duration: "",
      type: "",
      maxParticipants: "",
    });
  };

  const handleOpenDeleteDialog = (gymClass: GymClass) => {
    setDeletingClass(gymClass);
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeletingClass(null);
  };

  const handleSubmit = async () => {
    if (!editingClass) {
      if (!formData.type) {
        setValidationError("Please select a gym class type");
        return;
      }
      if (!formData.date) {
        setValidationError("Please select a date");
        return;
      }
      if (!formData.time) {
        setValidationError("Please select a time");
        return;
      }
      if (!formData.duration) {
        setValidationError("Please enter a duration");
        return;
      }
      if (!formData.maxParticipants) {
        setValidationError("Please enter maximum participants");
        return;
      }
    } else {
      if (!formData.date) {
        setValidationError("Please select a date");
        return;
      }
      if (!formData.time) {
        setValidationError("Please select a time");
        return;
      }
      if (!formData.duration) {
        setValidationError("Please enter a duration");
        return;
      }
    }

    try {
      setValidationError("");
      const payload = {
        ...formData,
        maxParticipants: Number(formData.maxParticipants),
      };

      if (editingClass) {
        await axios.patch(
          `http://localhost:4000/eventOffice/gym/${editingClass._id}`,
          {
            date: payload.date,
            time: payload.time,
            duration: payload.duration,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSnackbar({
          open: true,
          message: "Gym class updated successfully!",
          severity: "success",
        });
      } else {
        await axios.post("http://localhost:4000/eventOffice/gym", payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({
          open: true,
          message: "Gym class created successfully!",
          severity: "success",
        });
      }

      await fetchGymClasses();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      setValidationError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!deletingClass) return;

    try {
      await axios.delete(
        `http://localhost:4000/eventOffice/gym/${deletingClass._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchGymClasses();
      setSnackbar({
        open: true,
        message: "Gym class deleted successfully!",
        severity: "success",
      });
      handleCloseDeleteDialog();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "An error occurred",
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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      yoga: "#cde6e2ff",
      pilates: "#d5d7dfff",
      aerobics: "#fbf0e2ff",
      Zumba: "#fbe0d9ff",
      "cross circuit": "#e3f8dfff",
      "kick-boxing": "#f7dedeff",    };
    return colors[type] || "#6366f1";
  };

  const gymColumns: TableColumn<GymClass>[] = [
    {
      id: "type",
      label: (
            <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
                <SortableHeader label="TYPE" sortKey="type" currentSort={sortConfig} onSort={handleSort} />
            </Box>
        ),      width: "1.3fr",
      render: (g) => (
        <Chip
          label={g.type}
          sx={{
            minWidth: "130px",
            justifyContent: "center",
            backgroundColor: getTypeColor(g.type),
            color: "black",
            fontWeight: 600,
            textTransform: "capitalize",
          }}
        />
      ),
    },
    {
      id: "date",
      label: (
            <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
                <SortableHeader label="DATE" sortKey="date" currentSort={sortConfig} onSort={handleSort} />
            </Box>
        ),      width: "1.0fr",
      render: (g) => <TextCell text={formatDate(g.date)} color="#6b7280" />,
    },
    {
      id: "time",
      label: (
            <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
                <SortableHeader label="TIME" sortKey="time" currentSort={sortConfig} onSort={handleSort} />
            </Box>
        ),      width: "1.0fr",
      render: (g) => <TextCell text={g.time} color="#6b7280" />,
    },
    {
      id: "duration",
      label:(
            <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
                <SortableHeader label="DURATION" sortKey="duration" currentSort={sortConfig} onSort={handleSort} />
            </Box>
        ),      width: "1.0fr",
      render: (g) => <TextCell text={g.duration} color="#6b7280" />,
    },
    {
      id: "maxParticipants",
      label: (
            <Box sx={{ borderRight: '1px solid #e2e8f0', width: '100%' }}>
                <SortableHeader label="MAX PARTICIPANTS" sortKey="maxParticipants" currentSort={sortConfig} onSort={handleSort} />
            </Box>
        ),      width: "1.0fr",
      render: (g) => <NumberCell value={g.maxParticipants} color="#6b7280" />,
    },
    {
      id: "actions",
      label: "",
      width: "0.5fr",
      align: "center",
      render: (g) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
              {/* 1. The three-dot IconButton */}
            <IconButton
              size="small"
              onClick={(e) => handleMenuClick(e, g)}
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
        {/* Hero Section - Same as Event Office */}
        <Box
          sx={{
            position: "relative",
            background:
              "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600')",
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
              🏋️ Gym Classes
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
              Manage your gym class schedule. Create and remove gym classes.
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
                Add Class
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={fetchGymClasses}
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
          {/* DataTable - with alignment fix */}
          <Box sx={{ mx: -4 }}>
            <DataTable
              columns={gymColumns}
              data={gymClasses}
              loading={loading}
              keyExtractor={(g) => g._id}
              emptyMessage="No gym classes found. Click 'Add Class' to create one."
              horizontalPadding={4}
            />
          </Box>
        </Box>

        {/* Create/Edit Modal */}
        <Dialog open={showModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
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
              {editingClass ? <EditIcon /> : <AddIcon />}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {editingClass ? "Edit Gym Class" : "Create New Gym Class"}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {editingClass
                  ? "Update the gym class details"
                  : "Fill in the details to create a new class"}
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent dividers sx={{ px: 4, py: 3, bgcolor: "#ffffff" }}>
            {validationError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {validationError}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {!editingClass && (
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <FitnessCenterIcon sx={{  fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1e293b" }}>
                      Class Type
                    </Typography>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>Select Type</InputLabel>
                    <Select
                      value={formData.type}
                      label="Select Type"
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      sx={{
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#e2e8f0",
                        },
                      }}
                    >
                      <MenuItem value="yoga">🧘 Yoga</MenuItem>
                      <MenuItem value="pilates">🤸 Pilates</MenuItem>
                      <MenuItem value="aerobics">💪 Aerobics</MenuItem>
                      <MenuItem value="Zumba">💃 Zumba</MenuItem>
                      <MenuItem value="cross circuit">🏃 Cross Circuit</MenuItem>
                      <MenuItem value="kick-boxing">🥊 Kick-boxing</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <CalendarIcon sx={{  fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1e293b" }}>
                    Date
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: minDate }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#e2e8f0" },
                    },
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <AccessTimeIcon sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1e293b" }}>
                    Time
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#e2e8f0" },
                    },
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <TimerIcon sx={{  fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1e293b" }}>
                    Duration
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  placeholder="e.g., 60 minutes"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#e2e8f0" },
                    },
                  }}
                />
              </Box>

              {!editingClass && (
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <PeopleIcon sx={{  fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1e293b" }}>
                      Maximum Participants
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder="Enter max participants"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData({ ...formData, maxParticipants: e.target.value })
                    }
                    inputProps={{ min: 1 }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#e2e8f0" },
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 4, py: 3, bgcolor: "#f8fafc", gap: 2 }}>
            <Button
              onClick={handleCloseModal}
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
              onClick={handleSubmit}
              variant="contained"
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
              {editingClass ? "Update Class" : "Create Class"}
            </Button>
          </DialogActions>
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
                Delete Gym Class
              </Typography>
              <Typography variant="caption" sx={{ color: "#dc2626" }}>
                This action cannot be undone
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ px: 4, py: 3 }}>
            <Typography sx={{ mb: 3, color: "#475569" }}>
              Are you sure you want to delete this gym class? All participants will be notified.
            </Typography>
            {deletingClass && (
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
                    label={deletingClass.type}
                    sx={{
                      backgroundColor: getTypeColor(deletingClass.type),
                      color: "black",
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  />
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Date:</strong> {formatDate(deletingClass.date)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Time:</strong> {deletingClass.time}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TimerIcon sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Duration:</strong> {deletingClass.duration}
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
              Delete Class
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
              Edit Class
          </MenuItem>
          <MenuItem 
              onClick={handleOpenDeleteDialogFromMenu} 
              sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fef2f2', color: '#b91c1c' } }}
          >
              <Trash2 size={18} style={{ marginRight: 8 }} />
              Delete Class
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