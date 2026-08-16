"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Grid,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputAdornment,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PeopleIcon from "@mui/icons-material/People";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import {LocalOffer} from "@mui/icons-material";
import BarChartIcon from "@mui/icons-material/BarChart";
import SearchIcon from "@mui/icons-material/Search";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { api } from "@/api";
import BasicLayout from "@/components/layouts/basicLayout2";
import AuthGuard from "@/components/AuthGuard";
import DataTable, { TableColumn } from "@/components/DataTable";
import { TextCell, StatusChip } from "@/components/TableComponents";

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

type User = {
  _id: string;
  name?: string;
  adminName?: string;
  fullName?: string;
  email: string;
  role?: string;
  blocked: boolean;
  isVerified: boolean;
  createdAt?: string;
};

export default function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"blockUser" | "unblockUser" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterVerified, setFilterVerified] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await api.get("/api/users");
      const fetchedUsers = res.data.users || res.data || [];
      setAllUsers(fetchedUsers);
      setUsers(fetchedUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleActionClick = (user: User, type: "blockUser" | "unblockUser") => {
    setSelectedUser(user);
    setActionType(type);
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedUser || !actionType) return;
    try {
      setProcessing(true);
      const url = `/admin/${actionType}/${selectedUser._id}`;
      await api.patch(url);
      setConfirmOpen(false);
      await fetchUsers();
    } catch (err) {
      console.error("Error performing action:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyFilters = () => {
    let filtered = [...allUsers];
  
    // Search by name or email
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          (user.name || user.adminName || user.fullName || "").toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
      );
    }
  
    // Filter by role
    if (filterRole) {
      filtered = filtered.filter((user) => (user.role || "user") === filterRole);
    }
  
    // Filter by status
    if (filterStatus) {
      if (filterStatus === "Active") {
        filtered = filtered.filter((user) => !user.blocked);
      } else if (filterStatus === "Blocked") {
        filtered = filtered.filter((user) => user.blocked);
      }
    }
  
    // Filter by verified
    if (filterVerified) {
      if (filterVerified === "verified") {
        filtered = filtered.filter((user) => user.isVerified);
      } else if (filterVerified === "not-verified") {
        filtered = filtered.filter((user) => !user.isVerified);
      }
    }
  
    setUsers(filtered);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setFilterRole("");
    setFilterStatus("");
    setFilterVerified("");
    setSortConfig({ key: "", direction: null });
    setUsers(allUsers);
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
      setUsers([...allUsers]);
      return;
    }
  
    const sorted = [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;
  
      switch (key) {
        case "name":
          aValue = (a.name || a.adminName || a.fullName || a.email).toLowerCase();
          bValue = (b.name || b.adminName || b.fullName || b.email).toLowerCase();
          break;
        case "role":
          aValue = (a.role || "user").toLowerCase();
          bValue = (b.role || "user").toLowerCase();
          break;
        case "status":
          aValue = a.blocked ? 1 : 0;
          bValue = b.blocked ? 1 : 0;
          break;
        case "verified":
          aValue = a.isVerified ? 1 : 0;
          bValue = b.isVerified ? 1 : 0;
          break;
        case "joined":
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          return 0;
      }
  
      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  
    setUsers(sorted);
  };

  // Define table columns
// Define table columns
const userColumns: TableColumn<User>[] = [
  {
    id: "avatar",
    label: (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          minHeight: "25px",
        }}
      >
        {/* Empty label for avatar column */}
      </Box>
    ),
    width: "0.5fr",
    render: (user: User) => {
      const displayName = user.name || user.adminName || user.fullName || user.email;
      return (
        <Avatar
          sx={{
            bgcolor: "#93c7c1",
            width: 40,
            height: 40,
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          {displayName[0]?.toUpperCase() || "U"}
        </Avatar>
      );
    },
  },
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
          width: "90%",
          height: "100%",
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
    render: (user: User) => (
      <TextCell
        text={user.name || user.adminName || user.fullName || user.email}
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
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          width: "90%",
          height: "100%",
        }}>
          <Typography sx={{ 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            color: "#6b7280",
            lineHeight: 1.2
          }}>
            EMAIL
          </Typography>
        </Box>
      </Box>
    ),
    width: "2.5fr",
    render: (user: User) => <TextCell text={user.email} color="#6b7280" />,
  },
  {
    id: "role",
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
        onClick={() => handleSort("role")}
      >
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          width: "90%",
          height: "100%",
        }}>
          <Typography sx={{ 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            color: "#6b7280",
            lineHeight: 1.2
          }}>
            ROLE
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "role" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "role" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "1fr",
    align: "center",
    render: (user: User) => {
      const roleColors = {
        admin: { bg: "#fce7f3", text: "#be185d" },
        user: { bg: "#dbeafe", text: "#1e40af" },
        vendor: { bg: "#fef3c7", text: "#b45309" },
        eventoffice: { bg: "#dcfce7", text: "#15803d" },
        student: { bg: "#e0e7ff", text: "#4338ca" },
        Professor: { bg: "#fee2e2", text: "#b91c1c" },
        Staff: { bg: "#f5e6ff", text: "#7c3aed" },
        TA: { bg: "#cffafe", text: "#0e7490" },
        "Not yet": { bg: "#f3f4f6", text: "#6b7280" },
      };
      const role = user.role || "user";
      const colors = roleColors[role as keyof typeof roleColors] || { bg: "#f3f4f6", text: "#6b7280" };
      
      return (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            py: 0.5,
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 600,
            bgcolor: colors.bg,
            color: colors.text,
            minWidth: "80px",
            width: "100px",
          }}
        >
          {role}
        </Box>
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
          justifyContent: "space-between",
          width: "100%",
          cursor: "pointer",
          height: "100%",
          minHeight: "25px",
          borderRight: '2px solid #e2e8f0'
        }}
        onClick={() => handleSort("status")}
      >
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          width: "90%",
          height: "100%",
        }}>
          <Typography sx={{ 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            color: "#6b7280",
            lineHeight: 1.2
          }}>
            STATUS
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "status" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "status" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "1fr",
    align: "center",
    render: (user: User) => {
      const statusColors = {
        Blocked: { bg: "#fee2e2", text: "#dc2626" },
        Active: { bg: "#dcfce7", text: "#15803d" },
      };
      const status = user.blocked ? "Blocked" : "Active";
      const colors = statusColors[status];
      
      return (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            py: 0.5,
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 600,
            bgcolor: colors.bg,
            color: colors.text,
            minWidth: "80px",
            width: "100px",
          }}
        >
          {status}
        </Box>
      );
    },
  },
  {
    id: "verified",
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
        onClick={() => handleSort("verified")}
      >
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          width: "90%",
          height: "100%",
        }}>
          <Typography sx={{ 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            color: "#6b7280",
            lineHeight: 1.2
          }}>
            VERIFIED
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "verified" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "verified" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "1.2fr",
    align: "center",
    render: (user: User) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
        {user.isVerified ? (
          <>
            <ShieldCheck size={16} style={{ color: "#15803d" }} />
            <Typography variant="body2" fontSize="0.875rem" color="#15803d" fontWeight={600}>
              Verified
            </Typography>
          </>
        ) : (
          <StatusChip
            label="Not Verified"
            colorMap={{
              "Not Verified": { bg: "#fef3c7", text: "#ca8a04" },
            }}
          />
        )}
      </Box>
    ),
  },
  {
    id: "joined",
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
        onClick={() => handleSort("joined")}
      >
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          width: "90%",
          height: "100%",
        }}>
          <Typography sx={{ 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            color: "#6b7280",
            lineHeight: 1.2
          }}>
            JOINED
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "joined" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "joined" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "1.2fr",
    align: "center",
    render: (user: User) => (
      <TextCell
        text={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
        color="#6b7280"
      />
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
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          width: "90%",
          height: "100%",
        }}>
          <Typography sx={{ 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            color: "#6b7280",
            lineHeight: 1.2
          }}>
            ACTION
          </Typography>
        </Box>
      </Box>
    ),
    width: "1fr",
    align: "center",
    render: (user: User) => (
      <Button
        variant="outlined"
        size="small"
        onClick={() => handleActionClick(user, user.blocked ? "unblockUser" : "blockUser")}
        sx={{
          textTransform: "none",
          borderRadius: "8px",
          fontSize: "0.8125rem",
          fontWeight: 600,
          minWidth: "90px",
          width: "90px",
          px: 2,
          py: 0.75,
          borderColor: user.blocked ? "#15803d" : "#dc2626",
          color: user.blocked ? "#15803d" : "#dc2626",
          "&:hover": {
            borderColor: user.blocked ? "#15803d" : "#dc2626",
            bgcolor: user.blocked ? "#f0fdf4" : "#fef2f2",
          },
        }}
      >
        {user.blocked ? "Unblock" : "Block"}
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
                👥 All GUC`S ACCOUNTS
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
                Manage all registered users across the platform. View user information, roles, and control access.
              </Typography>

              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={fetchUsers}
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
                <Grid size={{xs: 12, sm: 6, md: 3}}>
                  <TextField
                    fullWidth
                    placeholder="Search Name or Email..."
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
                <Grid size={{xs: 12, sm: 6, md: 3}}>
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
                        All Roles
                      </MenuItem>
                      <MenuItem value="admin" sx={{ fontSize: "0.875rem" }}>Admin</MenuItem>
                      <MenuItem value="eventoffice" sx={{ fontSize: "0.875rem" }}>Event Office</MenuItem>
                      <MenuItem value="student" sx={{ fontSize: "0.875rem" }}>Student</MenuItem>
                      <MenuItem value="Professor" sx={{ fontSize: "0.875rem" }}>Professor</MenuItem>
                      <MenuItem value="Staff" sx={{ fontSize: "0.875rem" }}>Staff</MenuItem>
                      <MenuItem value="TA" sx={{ fontSize: "0.875rem" }}>TA</MenuItem>
                      <MenuItem value="vendor" sx={{ fontSize: "0.875rem" }}>Vendor</MenuItem>
                      <MenuItem value="Not yet" sx={{ fontSize: "0.875rem" }}>Not yet</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Filter by Status */}
                <Grid size={{xs: 12, sm: 6, md: 3}}>
                  <FormControl fullWidth>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
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
                        All Status
                      </MenuItem>
                      <MenuItem value="Active" sx={{ fontSize: "0.875rem" }}>Active</MenuItem>
                      <MenuItem value="Blocked" sx={{ fontSize: "0.875rem" }}>Blocked</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Filter by Verified */}
                <Grid size={{xs: 12, sm: 6, md: 3}}>
                  <FormControl fullWidth>
                    <Select
                      value={filterVerified}
                      onChange={(e) => setFilterVerified(e.target.value)}
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
                        All Verification
                      </MenuItem>
                      <MenuItem value="verified" sx={{ fontSize: "0.875rem" }}>Verified</MenuItem>
                      <MenuItem value="not-verified" sx={{ fontSize: "0.875rem" }}>Not Verified</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

 
                {/* Apply Filters Button */}
                <Grid size={{xs: 12, sm: 6, md: 1.5}}>
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
                <Grid size={{xs: 12, sm: 6, md: 1.5}}>
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
            <Box sx={{ mx: -4 }}>
              <DataTable
                columns={userColumns}
                data={users}
                loading={loading}
                emptyMessage="No users found"
                keyExtractor={(user: User) => user._id}
                horizontalPadding={4}
              />
            </Box>
          </Box>

{/* Confirmation Dialog - Styled like Vendor Requests */}
<Dialog 
  open={confirmOpen} 
  onClose={() => setConfirmOpen(false)} 
  maxWidth="xs" 
  fullWidth
>
  <DialogTitle
    sx={{
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      bgcolor: actionType === "blockUser" ? "#fef2f2" : "#f0fdf4",
      borderBottom: actionType === "blockUser" ? "2px solid #fecaca" : "2px solid #bbf7d0",
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        bgcolor: actionType === "blockUser" ? "#ef4444" : "#22c55e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      {actionType === "blockUser" ? (
        <ShieldCheck size={20} style={{ transform: "rotate(180deg)" }} />
      ) : (
        <ShieldCheck size={20} />
      )}
    </Box>
    <Box>
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 600, 
          color: actionType === "blockUser" ? "#991b1b" : "#166534"
        }}
      >
        {actionType === "blockUser" ? "Block User" : "Unblock User"}
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ color: actionType === "blockUser" ? "#dc2626" : "#16a34a" }}
      >
        Please confirm your action
      </Typography>
    </Box>
  </DialogTitle>

  <DialogContent sx={{ px: 4, py: 3 }}>
    <Typography sx={{ mb: 3, color: "#475569" }}>
      {actionType === "blockUser"
        ? `Are you sure you want to block ${selectedUser?.name || selectedUser?.adminName || selectedUser?.fullName || selectedUser?.email}?`
        : `Are you sure you want to unblock ${selectedUser?.name || selectedUser?.adminName || selectedUser?.fullName || selectedUser?.email}?`}
    </Typography>
    {selectedUser && (
      <Box
        sx={{
          p: 3,
          bgcolor: "#f8fafc",
          borderRadius: 2,
          border: "2px solid #e2e8f0",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: "#111827" }}>
          {selectedUser.name || selectedUser.adminName || selectedUser.fullName || selectedUser.email}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PeopleIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="body2" sx={{ color: "#475569" }}>
              <strong>Email:</strong> {selectedUser.email}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HomeIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="body2" sx={{ color: "#475569" }}>
              <strong>Role:</strong> {selectedUser.role || "user"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShieldCheck size={18} color="#64748b" />
            <Typography variant="body2" sx={{ color: "#475569" }}>
              <strong>Status:</strong> {selectedUser.blocked ? "Blocked" : "Active"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShieldCheck size={18} color="#64748b" />
            <Typography variant="body2" sx={{ color: "#475569" }}>
              <strong>Verified:</strong> {selectedUser.isVerified ? "Yes" : "No"}
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
            {actionType === "blockUser"
              ? "⚠️ This user will lose access to the system immediately."
              : "✅ This user will regain full access to the system."}
          </Typography>
        </Box>
      </Box>
    )}
  </DialogContent>

  <DialogActions sx={{ px: 4, py: 3, bgcolor: "#f8fafc", gap: 2 }}>
    <Button
      onClick={() => setConfirmOpen(false)}
      variant="outlined"
      disabled={processing}
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
      onClick={handleConfirmAction}
      variant="contained"
      disabled={processing}
      sx={{
        px: 3,
        py: 1,
        textTransform: "none",
        fontWeight: 600,
        borderRadius: 2,
        bgcolor: actionType === "blockUser" ? "#ef4444" : "#22c55e",
        "&:hover": {
          bgcolor: actionType === "blockUser" ? "#dc2626" : "#16a34a",
        },
      }}
    >
      {processing ? "Processing..." : actionType === "blockUser" ? "Block User" : "Unblock User"}
    </Button>
  </DialogActions>
</Dialog>
        </Box>
      </BasicLayout>
    </AuthGuard>
  );
}