"use client";

import { useState, useEffect, ReactNode } from "react";
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  SelectChangeEvent,
  Chip,
  Grid,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";import BasicLayout from "@/components/layouts/basicLayout2";
import BusinessIcon from "@mui/icons-material/Business";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import WorkIcon from "@mui/icons-material/Work";
import BarChartIcon from "@mui/icons-material/BarChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { RefreshCw, CheckCircle } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DataTable, { TableColumn } from "@/components/DataTable";
import { TextCell, StatusChip } from "@/components/TableComponents";
import {LocalOffer} from "@mui/icons-material";

interface Staff {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  dummyrole: string;
  isPending: string;
  role?: string;
  createdAt?: string;
}

interface ConfirmDialogState {
  open: boolean;
  staffId: string | null;
  staffName: string;
  role: string;
}

type StaffRole = "Professor" | "TA" | "Staff";

interface MenuItem {
  text: string;
  icon: ReactNode;
  href: string;
}

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/admin" },
  { text: "Staff Verification", icon: <HomeIcon />, href: "/dashboards/admin/roles" },
  { text: "Vendor Requests", icon: <BusinessIcon />, href: "/dashboards/admin/vendorRequests" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/admin/events" },
  { text: "Admins", icon: <HomeIcon />, href: "/dashboards/admin/admins" },
  { text: "Event Office", icon: <WorkIcon />, href: "/dashboards/admin/eventoffice" },
  { text: "All Users", icon: <HomeIcon />, href: "/dashboards/admin/all-users" },
  { text: "All Vendors", icon: <BusinessIcon />, href: "/dashboards/admin/vendors" },
    { text: "Restaurants", href: "/dashboards/admin/restraunts" },
  { text: "Reports", icon: <BarChartIcon />, href: "/dashboards/admin/reports" },
  {text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/admin/loyaltyProgram"},
];

export default function StaffVerificationPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, StaffRole | "">>({});
  const [searchText, setSearchText] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null,
  });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    staffId: null,
    staffName: "",
    role: "",
  });

  const validRoles: StaffRole[] = ["Professor", "TA", "Staff"];

  useEffect(() => {
    fetchPendingStaff();
  }, []);

  const fetchPendingStaff = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
  
      const response = await fetch(`${API_URL}/admin/pendingStaff`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch pending staff");
      }
  
      const data: { staff: Staff[] } = await response.json();
      const fetchedStaff = data.staff || [];
      
      setAllStaff(fetchedStaff);
      setStaffList(fetchedStaff);
  
      const initialRoles: Record<string, StaffRole | ""> = {};
      fetchedStaff.forEach((staff) => {
        initialRoles[staff._id] = "";
      });
      setSelectedRoles(initialRoles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    let filtered = [...allStaff];
  
    // Search by name or email
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (staff) => {
          const fullName = staff.firstName && staff.lastName
            ? `${staff.firstName} ${staff.lastName}`.toLowerCase()
            : "";
          const email = staff.email.toLowerCase();
          return fullName.includes(search) || email.includes(search);
        }
      );
    }
  
    // Filter by role
    if (filterRole) {
      filtered = filtered.filter((staff) => staff.dummyrole === filterRole);
    }

    // Apply sorting if active
    if (sortConfig.key && sortConfig.direction) {
      filtered = applySorting(filtered, sortConfig.key, sortConfig.direction);
    }
  
    setStaffList(filtered);
  };
  
  const handleClearFilters = () => {
    setSearchText("");
    setFilterRole("");
    setSortConfig({ key: "", direction: null });
    setStaffList(allStaff);
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
      setStaffList([...allStaff]);
      return;
    }
    
    let filtered = [...staffList];
    filtered = applySorting(filtered, key, direction);
    setStaffList(filtered);
  };

  const applySorting = (data: Staff[], key: string, direction: "asc" | "desc") => {
    return [...data].sort((a, b) => {
      let aValue = "";
      let bValue = "";

      if (key === "name") {
        aValue = a.firstName && a.lastName ? `${a.firstName} ${a.lastName}`.toLowerCase() : a.email.toLowerCase();
        bValue = b.firstName && b.lastName ? `${b.firstName} ${b.lastName}`.toLowerCase() : b.email.toLowerCase();
      } else if (key === "dummyrole") {
        aValue = a.dummyrole.toLowerCase();
        bValue = b.dummyrole.toLowerCase();
      }

      if (direction === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  };

  const handleRoleChange = (staffId: string, role: StaffRole | ""): void => {
    setSelectedRoles((prev) => ({
      ...prev,
      [staffId]: role,
    }));
  };

  const handleOpenConfirmDialog = (staff: Staff): void => {
    const role = selectedRoles[staff._id];
    if (!role) {
      setError("Please select a role before confirming");
      return;
    }

    const fullName = staff.firstName && staff.lastName
      ? `${staff.firstName} ${staff.lastName}`
      : staff.email;

    setConfirmDialog({
      open: true,
      staffId: staff._id,
      staffName: fullName,
      role: role,
    });
  };

  const handleCloseConfirmDialog = (): void => {
    setConfirmDialog({
      open: false,
      staffId: null,
      staffName: "",
      role: "",
    });
  };

  const handleConfirmStaff = async (): Promise<void> => {
    const { staffId, role } = confirmDialog;

    if (!staffId) return;

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_URL}/admin/updateStaffRole/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update staff role");
      }

      const data: { ok: boolean } = await response.json();

      if (data.ok) {
        setSuccess(`Staff member verified successfully as ${role}`);
        setStaffList((prev) => prev.filter((s) => s._id !== staffId));
        setSelectedRoles((prev) => {
          const newRoles = { ...prev };
          delete newRoles[staffId];
          return newRoles;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      handleCloseConfirmDialog();
    }
  };

  // Define table columns
const staffColumns: TableColumn<Staff>[] = [
  {
    id: "name",
    label: (
      <Box 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          width: "100%",
          cursor: "pointer",
          height: "100%",
          minHeight: "25px",
          borderRight: '2px solid #e2e8f0'
        }} 
        onClick={() => handleSort("name")}
      >
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          width: "90%", // Keep 90% for sortable columns
        }}>
          <Typography sx={{ 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            color: "#6b7280",
            lineHeight: 1.2
          }}>
            NAME
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
            marginLeft: 1
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "name" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "name" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "2fr",
    render: (staff: Staff) => (
      <TextCell
        text={
          staff.firstName && staff.lastName
            ? `${staff.firstName} ${staff.lastName}`
            : "N/A"
        }
        fontWeight={600}
      />
    ),
  },
  {
    id: "email",
    label: (
      <Box 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "flex-start",
          width: "100%",
          height: "100%",
          minHeight: "25px",
          borderRight: '2px solid #e2e8f0'
        }}
      >
        <Typography sx={{ 
          fontSize: "0.75rem", 
          fontWeight: 600, 
          color: "#6b7280",
          lineHeight: 1.2
        }}>
          EMAIL
        </Typography>
      </Box>
    ),
    width: "2.5fr",
    render: (staff: Staff) => <TextCell text={staff.email} color="#6b7280" />,
  },
  {
    id: "dummyrole",
    label: (
      <Box 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          width: "100%",
          cursor: "pointer",
          height: "100%",
          minHeight: "25px",
          borderRight: '2px solid #e2e8f0'
        }} 
        onClick={() => handleSort("dummyrole")}
      >
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          width: "90%", // Keep 90% for sortable columns
        }}>
          <Typography sx={{ 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            color: "#6b7280",
            whiteSpace: "nowrap",
            lineHeight: 1.2
          }}>
            REQUESTED ROLE
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
            marginLeft: 1
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "dummyrole" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "dummyrole" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "1.5fr",
    align: "center",
    render: (staff: Staff) => {
      const colorMap = {
        Professor: { bg: "#ede9fe", text: "#7c3aed" },
        TA: { bg: "#e0f2fe", text: "#0369a1" },
        Staff: { bg: "#dcfce7", text: "#15803d" },
      };
      const colors = colorMap[staff.dummyrole as keyof typeof colorMap] || { bg: "#f3f4f6", text: "#6b7280" };
      
      return (
        <Chip
          label={staff.dummyrole}
          size="small"
          sx={{
            minWidth: "80px",
            height: "24px",
            fontSize: "0.75rem",
            fontWeight: 600,
            bgcolor: colors.bg,
            color: colors.text,
            borderRadius: "6px",
            "& .MuiChip-label": {
              px: 1.5,
            },
          }}
        />
      );
    },
  },
  {
    id: "status",
    label: (
      <Box 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          width: "100%",
          height: "100%",
          minHeight: "25px",
          borderRight: '2px solid #e2e8f0'
        }}
      >
        <Typography sx={{ 
          fontSize: "0.75rem", 
          fontWeight: 600, 
          color: "#6b7280",
          lineHeight: 1.2
        }}>
          STATUS
        </Typography>
      </Box>
    ),
    width: "1.2fr",
    align: "center",
    render: () => (
      <StatusChip
        label="Pending"
        colorMap={{
          Pending: { bg: "#fef3c7", text: "#ca8a04" },
        }}
      />
    ),
  },
  {
    id: "assignRole",
    label: (
      <Box 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "flex-start",
          width: "100%",
          height: "100%",
          minHeight: "25px",
          borderRight: '2px solid #e2e8f0'
        }}
      >
        <Typography sx={{ 
          fontSize: "0.75rem", 
          fontWeight: 600, 
          color: "#6b7280",
          lineHeight: 1.2
        }}>
          ASSIGN ROLE
        </Typography>
      </Box>
    ),
    width: "2fr",
    render: (staff: Staff) => (
      <FormControl fullWidth size="small">
        <Select
          value={selectedRoles[staff._id] || ""}
          onChange={(e: SelectChangeEvent) =>
            handleRoleChange(staff._id, e.target.value as StaffRole | "")
          }
          displayEmpty
          sx={{
            borderRadius: "8px",
            fontSize: "0.875rem",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#e5e7eb",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#93c7c1",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#93c7c1",
            },
          }}
        >
          <MenuItem value="" disabled>
            <em>Select Role</em>
          </MenuItem>
          {validRoles.map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    ),
  },
  {
    id: "action",
    label: (
      <Box 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          width: "100%",
          height: "100%",
          minHeight: "25px"
        }}
      >
        <Typography sx={{ 
          fontSize: "0.75rem", 
          fontWeight: 600, 
          color: "#6b7280",
          lineHeight: 1.2
        }}>
          ACTION
        </Typography>
      </Box>
    ),
    width: "1.5fr",
    align: "center",
    render: (staff: Staff) => (
      <Button
        variant="contained"
        size="small"
        onClick={() => handleOpenConfirmDialog(staff)}
        disabled={!selectedRoles[staff._id]}
        startIcon={<CheckCircle size={16} />}
        sx={{
          textTransform: "none",
          borderRadius: "8px",
          fontSize: "0.8125rem",
          fontWeight: 600,
          px: 2,
          py: 0.75,
          bgcolor: "#15803d",
          "&:hover": {
            bgcolor: "#166534",
          },
          "&:disabled": {
            bgcolor: "#e5e7eb",
            color: "#9ca3af",
          },
        }}
      >
        Confirm
      </Button>
    ),
  },
];

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <BasicLayout menuItems={menuItems}>
        <Box sx={{ minHeight: "100vh" }}>
          {/* Hero Section */}
          <Box
            sx={{
              position: "relative",
              background:
                "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600')",
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
            <Box sx={{ position: "relative", zIndex: 1, px: 4, py: 6,pb: 3 , width: "100%" }}>
              <Typography
                variant="h3"
                sx={{
                  color: "white",
                  fontWeight: 700,
                  mb: 2,
                  fontSize: { xs: "2rem", md: "2.5rem" },
                }}
              >
                ✅ Staff Verification
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
                Review and verify pending staff registration requests. Assign appropriate roles to professors, teaching assistants, and staff members.
              </Typography>

              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={fetchPendingStaff}
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
                  backgroundColor: "transparent",
                  "&:hover": {
                    borderColor: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Filter Section */}
          <Box sx={{ px: 4, mb: 3 }}>
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
                {/* Search by Name/Email */}
                <Grid size={{xs: 12, sm: 6, md: 4}}>
                  <TextField
                    fullWidth
                    placeholder="Search by Name or Email..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "#9ca3af", fontSize: 20 }} />
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

                {/* Filter by Role */}
                <Grid size={{xs: 12, sm: 6, md: 3.5}}>
                  <FormControl fullWidth>
                    <Select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      displayEmpty
                      sx={{
                        borderRadius: 2,
                        bgcolor: "#f9fafb",
                        fontSize: "0.875rem",
                        "& fieldset": { border: "1px solid #e5e7eb" },
                        "&:hover fieldset": { borderColor: "#d1d5db" },
                        "&.Mui-focused fieldset": { borderColor: "#93c7c1" },
                        "& .MuiSelect-select": { py: 1.25 },
                      }}
                    >
                      <MenuItem value="" sx={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                        Filter by Role
                      </MenuItem>
                      <MenuItem value="Professor" sx={{ fontSize: "0.875rem" }}>Professor</MenuItem>
                      <MenuItem value="TA" sx={{ fontSize: "0.875rem" }}>TA</MenuItem>
                      <MenuItem value="Staff" sx={{ fontSize: "0.875rem" }}>Staff</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Apply Filters Button */}
                <Grid size={{xs: 12, sm: 6, md: 2}}>
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

                {/* Clear Filters Button */}
                <Grid size={{xs: 12, sm: 6, md: 2}}>
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

          {/* Content Area */}
          <Box sx={{ px: 4, pb: 4 }}>
            {/* Alerts */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            {/* DataTable */}
            <Box sx={{ mx: -4 }}>
              {staffList.length === 0 && !loading ? (
                <Box
                  sx={{
                    bgcolor: "white",
                    borderRadius: 3,
                    p: 8,
                    textAlign: "center",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 60, color: "#15803d", mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} color="#111827" mb={1}>
                    No pending staff verifications
                  </Typography>
                  <Typography variant="body2" color="#6b7280">
                    All staff members have been verified
                  </Typography>
                </Box>
              ) : (
                <DataTable
                  columns={staffColumns}
                  data={staffList}
                  loading={loading}
                  emptyMessage="No pending staff verifications"
                  keyExtractor={(staff: Staff) => staff._id}
                  horizontalPadding={4}
                />
              )}
            </Box>
          </Box>

{/* Confirmation Dialog - Styled like Vendor Requests */}
<Dialog 
  open={confirmDialog.open} 
  onClose={handleCloseConfirmDialog} 
  maxWidth="xs" 
  fullWidth
>
  <DialogTitle
    sx={{
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      bgcolor: "#f0fdf4",
      borderBottom: "2px solid #bbf7d0",
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        bgcolor: "#22c55e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      <CheckCircleIcon />
    </Box>
    <Box>
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 600, 
          color: "#166534" 
        }}
      >
        Confirm Staff Verification
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ color: "#16a34a" }}
      >
        Please confirm your action
      </Typography>
    </Box>
  </DialogTitle>

  <DialogContent sx={{ px: 4, py: 3 }}>
    <Typography sx={{ mb: 3, color: "#475569" }}>
      Are you sure you want to verify <strong>{confirmDialog.staffName}</strong> as a <strong>{confirmDialog.role}</strong>?
    </Typography>
    <Box
      sx={{
        p: 3,
        bgcolor: "#f8fafc",
        borderRadius: 2,
        border: "2px solid #e2e8f0",
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: "#111827" }}>
        {confirmDialog.staffName}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircleIcon sx={{ fontSize: 18, color: "#64748b" }} />
          <Typography variant="body2" sx={{ color: "#475569" }}>
            <strong>Role:</strong> {confirmDialog.role}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BusinessIcon sx={{ fontSize: 18, color: "#64748b" }} />
          <Typography variant="body2" sx={{ color: "#475569" }}>
            <strong>Status:</strong> Verification Pending
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          mt: 2,
          pt: 2,
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <Typography variant="caption" sx={{ color: "#64748b", fontStyle: "italic" }}>
          A verification email will be sent to the staff member upon confirmation.
        </Typography>
      </Box>
    </Box>
  </DialogContent>

  <DialogActions sx={{ px: 4, py: 3, bgcolor: "#f8fafc", gap: 2 }}>
    <Button
      onClick={handleCloseConfirmDialog}
      variant="outlined"
      sx={{
        px: 3,
        py: 1,
        textTransform: "none",
        fontWeight: 600,
        borderRadius: 2,
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
      onClick={handleConfirmStaff}
      variant="contained"
      sx={{
        px: 3,
        py: 1,
        textTransform: "none",
        fontWeight: 600,
        borderRadius: 2,
        bgcolor: "#22c55e",
        "&:hover": {
          bgcolor: "#16a34a",
        },
      }}
    >
      Confirm Verification
    </Button>
  </DialogActions>
</Dialog>
        </Box>
      </BasicLayout>
    </AuthGuard>
  );
}