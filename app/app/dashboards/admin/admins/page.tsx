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
  CircularProgress,
  Alert,
  Grid,           // ADD THIS
  InputAdornment, // ADD THIS
  Select,         // ADD THIS
  MenuItem,       // ADD THIS
  FormControl,    // ADD THIS
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  LocalOffer,
} from "@mui/icons-material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";import SearchIcon from "@mui/icons-material/Search"; // ADD THIS
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { RefreshCw, Trash2 } from "lucide-react";
import { api } from "../../../../api";
import BasicLayout from "@/components/layouts/basicLayout2";
import AuthGuard from "@/components/AuthGuard";
import DataTable, { TableColumn } from "@/components/DataTable";
import { TextCell } from "@/components/TableComponents";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/admin" },
  { text: "Staff Verification", icon: <HomeIcon />, href: "/dashboards/admin/roles" },
  { text: "Vendor Requests", icon: <BusinessIcon />, href: "/dashboards/admin/vendorRequests" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/admin/events" },
  { text: "Admins", icon: <HomeIcon />, href: "/dashboards/admin/admins" },
  { text: "Event Office", icon: <WorkIcon />, href: "/dashboards/admin/eventoffice" },
  { text: "All Users", icon: <HomeIcon />, href: "/dashboards/admin/all-users" },
  { text: "All Vendors", icon: <BusinessIcon />, href: "/dashboards/admin/vendors" },
  { text: "Restaurants", icon: <RestaurantIcon />, href: "/dashboards/admin/restraunts" },
  { text: "Reports", icon: <BarChartIcon />, href: "/dashboards/admin/reports" },
  {text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/admin/loyaltyProgram"},
];

interface Admin {
  _id: string;
  adminName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  adminName: string;
  email: string;
  password: string;
}

export default function AdminPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null,
  });
const [allAdmins, setAllAdmins] = useState<Admin[]>([]); // Store original data
  const [formData, setFormData] = useState<FormData>({
    adminName: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    adminId: string | null;
    adminName: string;
  }>({
    open: false,
    adminId: null,
    adminName: "",
  });
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      console.log("Fetching admins...");
      setLoading(true);
      const res = await api.get("/admin/getAdmins");
      console.log("Fetched admins:", res.data.admins);
      const fetchedAdmins = res.data.admins || [];
      setAllAdmins(fetchedAdmins); // Store original
      setAdmins(fetchedAdmins);    // Display all initially
    } catch (err) {
      console.error("Error fetching admins:", err);
      setPageError("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      adminName: "",
      email: "",
      password: "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      adminName: "",
      email: "",
      password: "",
    });
    setFormError(null);
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    try {
      setFormError(null);
      setSubmitting(true);

      if (!formData.adminName || !formData.email || !formData.password) {
        setFormError("All fields are required");
        return;
      }

      if (formData.password.length < 6) {
        setFormError("Password must be at least 6 characters long");
        return;
      }

      const payload = {
        adminName: formData.adminName,
        email: formData.email,
        password: formData.password,
      };

      console.log("Sending create admin request...");

      const response = await api.post("/admin/createAdmins", payload);

      console.log("Create admin response:", response);

      if (response.status >= 200 && response.status < 300) {
        console.log("Admin created successfully, refreshing list...");
        await fetchAdmins();
        console.log("Admin list refreshed, closing modal...");
        handleCloseModal();
        setSuccess("Admin created successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data?.message || "Failed to create admin");
      }
    } catch (err: any) {
      console.error("Error creating admin:", err);
      setFormError(
        err.response?.data?.message || err.message || "Failed to create admin"
      );
    } finally {
      console.log("Setting submitting to false");
      setSubmitting(false);
    }
  };
  const handleApplyFilters = () => {
    let filtered = [...allAdmins];
  
    // Search by name or email
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (admin) =>
          admin.adminName.toLowerCase().includes(search) ||
          admin.email.toLowerCase().includes(search)
      );
    }
  
  
    
  
    setAdmins(filtered);
  };
  
  const handleClearFilters = () => {
    setSearchText("");
    setSortConfig({ key: "", direction: null });
    setAdmins(allAdmins); // Reset to all admins
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
      setAdmins([...allAdmins]);
      return;
    }
  
    const sorted = [...admins].sort((a, b) => {
      let aValue: any;
      let bValue: any;
  
      switch (key) {
        case "adminName":
          aValue = a.adminName.toLowerCase();
          bValue = b.adminName.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }
  
      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  
    setAdmins(sorted);
  };

  const handleOpenDeleteDialog = (id: string, adminName: string) => {
    setDeleteDialog({
      open: true,
      adminId: id,
      adminName: adminName,
    });
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      adminId: null,
      adminName: "",
    });
  };
  
  const handleConfirmDelete = async () => {
    const { adminId, adminName } = deleteDialog;
    
    if (!adminId) return;
  
    try {
      await api.delete(`/admin/deleteAdmins/${adminId}`);
      await fetchAdmins();
      setSuccess(`Admin "${adminName}" deleted successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setPageError(err.response?.data?.message || "Failed to delete admin");
    } finally {
      handleCloseDeleteDialog();
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

  // Define table columns
// Define table columns
// Define table columns
const adminColumns: TableColumn<Admin>[] = [
  {
    id: "adminName",
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
        onClick={() => handleSort("adminName")}
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
            ADMIN NAME
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "adminName" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "adminName" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "2.5fr",
    render: (admin: Admin) => <TextCell text={admin.adminName} fontWeight={600} />,
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
    width: "3fr",
    render: (admin: Admin) => <TextCell text={admin.email} color="#6b7280" />,
  },
  {
    id: "createdAt",
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
        onClick={() => handleSort("createdAt")}
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
            CREATED AT
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "createdAt" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "createdAt" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "2fr",
    render: (admin: Admin) => <TextCell text={formatDate(admin.createdAt)} color="#6b7280" />,
  },
  {
    id: "actions",
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
            ACTIONS
          </Typography>
        </Box>
      </Box>
    ),
    width: "1fr",
    align: "center",
    render: (admin: Admin) => (
      <IconButton
        size="small"
        onClick={() => handleOpenDeleteDialog(admin._id, admin.adminName)}
        sx={{
          color: "#dc2626",
          "&:hover": {
            bgcolor: "#fef2f2",
            color: "#b91c1c",
          },
        }}
      >
        <Trash2 size={18} />
      </IconButton>
    ),
  },
];

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <BasicLayout menuItems={menuItems}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
            }}
          >
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6">Loading...</Typography>
          </Box>
        </BasicLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <BasicLayout menuItems={menuItems}>
        <Box sx={{ minHeight: "100vh" }}>
          {/* Hero Section */}
          <Box
            sx={{
              position: "relative",
              background:
              "linear-gradient(to bottom, rgba(0, 20, 40, 0.90), rgba(0, 61, 82, 0.80)), url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1600')",
            
              backgroundSize: "cover",
              backgroundPosition: "center",
              minHeight: "320px",
              display: "flex",
              alignItems: "center",
              mb: 4,
              borderRadius: 3,  // ADD THIS LINE
              overflow: "hidden",  // ADD THIS LINE
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
                  fontSize: { xs: "1.9rem", md: "2.4rem" },
                }}
              >
                👨‍💼 Admin Management
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
               Manage system administrators. Create, edit, and remove admin accounts for the platform.

              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenModal}
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
                  Add Admin
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw size={18} />}
                  onClick={fetchAdmins}
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
  <Grid size={{xs: 12, sm: 8, md: 9}}>
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
            {/* Alerts */}
            {pageError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setPageError(null)}>
                {pageError}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            {/* DataTable */}
            <Box sx={{ mx: -4 }}>
              <DataTable
                columns={adminColumns}
                data={admins}
                loading={false}
                emptyMessage='No admins found. Click the "Add Admin" button to create one.
'
                keyExtractor={(admin: Admin) => admin._id}
                horizontalPadding={4}
              />
            </Box>
          </Box>

          {/* Create Admin Modal */}
          <Dialog open={showModal} onClose={handleCloseModal} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, pr: 6 }}>
            Create New Admin
              <IconButton
                onClick={handleCloseModal}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: "#6b7280",
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              {/* Form Error Alert */}
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
                  {formError}
                </Alert>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                <TextField
                  fullWidth
                  label="Admin Name"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  placeholder="Enter admin name"
                  error={!!formError && !formData.adminName}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#93c7c1",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#93c7c1",
                      },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  error={!!formError && !formData.email}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#93c7c1",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#93c7c1",
                      },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password (min 6 characters)"
                  helperText="Password must be at least 6 characters long"
                  error={!!formError && (!formData.password || formData.password.length < 6)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#93c7c1",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#93c7c1",
                      },
                    },
                  }}
                />
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={handleCloseModal}
                disabled={submitting}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} /> : null}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  bgcolor: "#003d52",
                  "&:hover": {
                    bgcolor: "#002a3a",
                  },
                }}
              >
                {submitting ? "Creating..." : "Create Admin"}
              </Button>
            </DialogActions>
          </Dialog>
          {/* Delete Confirmation Dialog - Red theme for deletion */}
<Dialog 
  open={deleteDialog.open} 
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
      <Trash2 size={20} />
    </Box>
    <Box>
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 600, 
          color: "#991b1b" 
        }}
      >
        Confirm Admin Deletion
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ color: "#dc2626" }}
      >
        Please confirm your action
      </Typography>
    </Box>
  </DialogTitle>

  <DialogContent sx={{ px: 4, py: 3 }}>
    <Typography sx={{ mb: 3, color: "#475569" }}>
      Are you sure you want to delete <strong>{deleteDialog.adminName}</strong>?
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
        {deleteDialog.adminName}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HomeIcon sx={{ fontSize: 18, color: "#64748b" }} />
          <Typography variant="body2" sx={{ color: "#475569" }}>
            <strong>Role:</strong> System Administrator
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Trash2 size={18} color="#64748b" />
          <Typography variant="body2" sx={{ color: "#475569" }}>
            <strong>Action:</strong> Delete Admin
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
          This admin will lose all access to the system.
        </Typography>
      </Box>
    </Box>
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
      onClick={handleConfirmDelete}
      variant="contained"
      sx={{
        px: 3,
        py: 1,
        textTransform: "none",
        fontWeight: 600,
        borderRadius: 2,
        bgcolor: "#ef4444",
        "&:hover": {
          bgcolor: "#dc2626",
        },
      }}
    >
      Delete Admin
    </Button>
  </DialogActions>
</Dialog>
        </Box>
      </BasicLayout>
    </AuthGuard>
  );
}