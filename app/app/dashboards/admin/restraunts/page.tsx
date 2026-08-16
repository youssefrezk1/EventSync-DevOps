"use client";

import React, { useEffect, useState } from "react";
import { ReactNode } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  Grid,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { Download, RefreshCw, ShieldCheck, Eye, X } from "lucide-react";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"; import { api } from "@/api";
import BasicLayout from "@/components/layouts/basicLayout2";
import BusinessIcon from "@mui/icons-material/Business";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import WorkIcon from "@mui/icons-material/Work";
import AuthGuard from "@/components/AuthGuard";
import BarChartIcon from "@mui/icons-material/BarChart";
import DataTable, { TableColumn } from "@/components/DataTable";
import { TextCell, StatusChip } from "@/components/TableComponents";
import { LocalOffer } from "@mui/icons-material";

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
  { text: "Loyalty Program", icon: <LocalOffer />, href: "/dashboards/admin/loyaltyProgram" },
];

type Restaurant = {
  _id: string;
  name: string;
  email: string;
  logo?: { url: string }[];
  taxcard?: { url: string }[];
  blocked?: boolean;
  isVerified?: boolean;
  createdAt?: string;
};

export default function AllRestrauntsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>(
    { key: "", direction: null }
  );

  // Image preview states
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
    type: string;
    isPDF?: boolean;
  } | null>(null);

  // Create / Delete states
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({ id: '', name: '', email: '', password: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Restaurant | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  async function fetchRestaurants() {
    try {
      setLoading(true);
      const res = await api.get("/admin/restraunts");
      // API may return { restaurants, total, ... } or { restraunts: [...] } or raw array
      let fetched = res.data?.restaurants || res.data?.restraunts || res.data || [];
      // If the API returned an object (not an array), try to extract the restaurants array
      if (!Array.isArray(fetched) && typeof fetched === 'object') {
        // If the top-level response has a `restaurants` field, use it
        if (Array.isArray(res.data?.restaurants)) fetched = res.data.restaurants;
        else if (Array.isArray(res.data?.restraunts)) fetched = res.data.restraunts;
        else fetched = [];
      }
      setAllRestaurants(fetched);
      setRestaurants(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleApplyFilters = () => {
    let filtered = [...allRestaurants];

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name?.toLowerCase().includes(search) ||
          r.email?.toLowerCase().includes(search)
      );
    }

    if (filterStatus) {
      if (filterStatus === "Active") {
        filtered = filtered.filter((r) => !r.blocked);
      } else if (filterStatus === "Blocked") {
        filtered = filtered.filter((r) => r.blocked);
      }
    }

    setRestaurants(filtered);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setFilterStatus("");
    setSortConfig({ key: "", direction: null });
    setRestaurants(allRestaurants);
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
      setRestaurants([...allRestaurants]);
      return;
    }

    const sorted = [...restaurants].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (key) {
        case "company":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
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

    setRestaurants(sorted);
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleImagePreview = (url: string, name: string, type: "logo" | "taxcard", isPDF: boolean = false) => {
    setPreviewImage({ url, name, type, isPDF });
    setImagePreviewOpen(true);
  };

  const handleDownloadFromPreview = () => {
    if (previewImage) {
      const extension = previewImage.isPDF ? 'pdf' : 'png';
      const filename = `${previewImage.name}-${previewImage.type}.${extension}`;
      handleDownload(previewImage.url, filename);
    }
  };

  // Define table columns
  const restaurantColumns: TableColumn<Restaurant>[] = [
    {
      id: "company",
      label: (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", cursor: "pointer", height: "100%", minHeight: "25px", borderRight: '2px solid #e2e8f0' }} onClick={() => handleSort("company")}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "90%", height: "100%" }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", lineHeight: 1.2 }}>COMPANY</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <KeyboardArrowUpIcon sx={{ fontSize: 12, color: sortConfig.key === "company" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db" }} />
              <KeyboardArrowDownIcon sx={{ fontSize: 12, color: sortConfig.key === "company" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db", mt: -0.5 }} />
            </Box>
          </Box>
        </Box>
      ),
      width: "2.8fr",
      render: (r: Restaurant) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {r.logo?.[0]?.url ? (
            <Tooltip title="Click to view logo">
              <IconButton onClick={() => handleImagePreview(r.logo![0].url, r.name, "logo", false)} sx={{ "&:hover": { transform: "scale(1.1)" }, transition: "all 0.2s ease", p: 0 }}>
                <Avatar src={r.logo[0].url} alt={r.name} sx={{ width: 40, height: 40, border: "2px solid #e5e7eb" }} />
              </IconButton>
            </Tooltip>
          ) : (
            <Avatar sx={{ bgcolor: "grey.400", width: 40, height: 40 }}>{r.name?.[0] || "?"}</Avatar>
          )}
          <Box>
            <TextCell text={r.name} fontWeight={600} />
            <TextCell text={r.email} color="#6b7280" fontSize="0.875rem" />
          </Box>
        </Box>
      ),
    },
    {
      id: "taxcard",
      label: (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", width: "100%", height: "100%", minHeight: "25px", borderRight: '2px solid #e2e8f0' }}>
          <Box sx={{ display: "flex", alignItems: "center", width: "90%", height: "100%" }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", lineHeight: 1.2 }}>TAX CARD</Typography>
          </Box>
        </Box>
      ),
      width: "1fr",
      align: "center",
      render: (r: Restaurant) => (
        <>
          {r.taxcard?.[0]?.url ? (
            <Button variant="outlined" size="small" startIcon={<Eye size={16} />} onClick={() => {
              const url = r.taxcard![0].url;
              const isPDF = url.toLowerCase().endsWith('.pdf') || r.taxcard![0].url.includes('application/pdf');
              handleImagePreview(url, r.name, "taxcard", isPDF);
            }} sx={{ borderRadius: "8px", textTransform: "none", fontSize: "0.8125rem", borderColor: "#e5e7eb", color: "#6b7280", "&:hover": { borderColor: "#93c7c1", bgcolor: "#f9fafb" } }}>
              View
            </Button>
          ) : (
            <StatusChip label="N/A" colorMap={{ "N/A": { bg: "#f3f4f6", text: "#6b7280" } }} />
          )}
        </>
      ),
    },
    {
      id: "status",
      label: (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", cursor: "pointer", height: "100%", minHeight: "25px", borderRight: '2px solid #e2e8f0' }} onClick={() => handleSort("status")}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "90%", height: "100%" }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", lineHeight: 1.2 }}>STATUS</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <KeyboardArrowUpIcon sx={{ fontSize: 12, color: sortConfig.key === "status" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db" }} />
              <KeyboardArrowDownIcon sx={{ fontSize: 12, color: sortConfig.key === "status" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db", mt: -0.5 }} />
            </Box>
          </Box>
        </Box>
      ),
      width: "1fr",
      align: "center",
      render: (r: Restaurant) => {
        const statusColors = { Blocked: { bg: "#fee2e2", text: "#dc2626" }, Active: { bg: "#dcfce7", text: "#15803d" } };
        const status = r.blocked ? "Blocked" : "Active";
        const colors = statusColors[status as keyof typeof statusColors];
        return (
          <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", px: 2, py: 0.5, borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, bgcolor: colors.bg, color: colors.text, minWidth: "85px", width: "85px" }}>{status}</Box>
        );
      },
    },
    {
      id: "verified",
      label: (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", cursor: "pointer", height: "100%", minHeight: "25px", borderRight: '2px solid #e2e8f0' }} onClick={() => handleSort("verified")}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "90%", height: "100%" }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", lineHeight: 1.2 }}>VERIFIED</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <KeyboardArrowUpIcon sx={{ fontSize: 12, color: sortConfig.key === "verified" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db" }} />
              <KeyboardArrowDownIcon sx={{ fontSize: 12, color: sortConfig.key === "verified" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db", mt: -0.5 }} />
            </Box>
          </Box>
        </Box>
      ),
      width: "1.2fr",
      align: "center",
      render: (r: Restaurant) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
          {r.isVerified ? (
            <>
              <ShieldCheck size={16} style={{ color: "#15803d" }} />
              <Typography variant="body2" fontSize="0.875rem" color="#15803d" fontWeight={600}>Verified</Typography>
            </>
          ) : (
            <StatusChip label="Not Verified" colorMap={{ "Not Verified": { bg: "#fef3c7", text: "#ca8a04" } }} />
          )}
        </Box>
      ),
    },
    {
      id: "joined",
      label: (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", cursor: "pointer", height: "100%", minHeight: "25px", borderRight: '2px solid #e2e8f0' }} onClick={() => handleSort("joined")}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "90%", height: "100%" }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", lineHeight: 1.2 }}>JOINED</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <KeyboardArrowUpIcon sx={{ fontSize: 12, color: sortConfig.key === "joined" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db" }} />
              <KeyboardArrowDownIcon sx={{ fontSize: 12, color: sortConfig.key === "joined" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db", mt: -0.5 }} />
            </Box>
          </Box>
        </Box>
      ),
      width: "1.2fr",
      align: "center",
      render: (r: Restaurant) => (
        <TextCell text={r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"} color="#6b7280" />
      ),
    },
    {
      id: "actions",
      label: (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>ACTIONS</Typography>
        </Box>
      ),
      width: "0.8fr",
      align: "center",
      render: (r: Restaurant) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Button size="small" color="error" variant="outlined" onClick={() => { setSelectedForDelete(r); setDeleteConfirmOpen(true); }} sx={{ textTransform: 'none' }}>
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  // Create handler
  const handleCreateSubmit = async () => {
    try {
      setCreating(true);
      const formData = new FormData();
      formData.append('id', newRestaurant.id);
      formData.append('name', newRestaurant.name);
      formData.append('email', newRestaurant.email);
      formData.append('password', newRestaurant.password);
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      await api.post('/admin/restraunts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCreateOpen(false);
      setNewRestaurant({ id: '', name: '', email: '', password: '' });
      setLogoFile(null);
      fetchRestaurants();
    } catch (err) {
      console.error('Create restaurant failed', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!selectedForDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/restraunts/${selectedForDelete._id}`);
      setDeleteConfirmOpen(false);
      setSelectedForDelete(null);
      fetchRestaurants();
    } catch (err) {
      console.error('Delete restaurant failed', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <BasicLayout menuItems={menuItems}>
        <Box sx={{ minHeight: "100vh" }}>
          {/* Hero Section */}
          <Box sx={{ position: "relative", background: "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1600')", backgroundSize: "cover", backgroundPosition: "center", minHeight: "320px", display: "flex", alignItems: "center", mb: 4, borderRadius: 3, overflow: "hidden", "&::before": { content: '""', position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(147, 199, 193, 0.1) 0%, rgba(0, 61, 82, 0.2) 100%)" } }}>
            <Box sx={{ position: "relative", zIndex: 1, px: 4, py: 6, width: "100%" }}>
              <Typography variant="h3" sx={{ color: "white", fontWeight: 700, mb: 2, fontSize: { xs: "2rem", md: "2.5rem" } }}> 🏢 All Restaurants</Typography>
              <Typography variant="body1" sx={{ color: "rgba(255, 255, 255, 0.9)", mb: 3, maxWidth: "700px", fontSize: "1rem", lineHeight: 1.6 }}>Manage all registered restaurants and view their information.</Typography>

              <Button variant="outlined" startIcon={<RefreshCw size={18} />} onClick={fetchRestaurants} disabled={loading} sx={{ px: 3, py: 1.25, borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: "0.9375rem", borderColor: "rgba(255, 255, 255, 0.5)", color: "white", backgroundColor: "transparent", "&:hover": { borderColor: "white", backgroundColor: "rgba(255, 255, 255, 0.1)" } }}>
                Refresh
              </Button>
              <Button variant="contained" onClick={() => setCreateOpen(true)} sx={{ ml: 2, px: 3, py: 1.25, borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: "0.9375rem", bgcolor: "#0f766e", boxShadow: 'none', '&:hover': { bgcolor: '#0b6a63' } }}>
                Create Restaurant
              </Button>
            </Box>
          </Box>

          {/* Filter Section */}
          <Box sx={{ px: 4, mb: 3 }}>
            <Box sx={{ mx: -4, px: 4, py: 3, bgcolor: "white", borderRadius: 2.5, border: "1px solid #e5e7eb" }}>
              <Typography variant="h6" fontWeight={700} mb={3} color="#111827" fontSize="1.125rem">Filter Options</Typography>

              <Grid container spacing={2} alignItems="center">
                <Grid size={{xs: 12, sm: 6, md: 6}}>
                  <TextField fullWidth placeholder="Search by Restaurant Name or Email..." value={searchText} onChange={(e) => setSearchText(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment>), sx: { borderRadius: 2, bgcolor: "#f9fafb", "& fieldset": { border: "1px solid #e5e7eb" }, "&:hover fieldset": { borderColor: "#d1d5db" }, "&.Mui-focused fieldset": { borderColor: "#93c7c1" } } }} sx={{ "& .MuiInputBase-input": { fontSize: "0.875rem", py: 1.25 } }} />
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 3}}>
                  <FormControl fullWidth>
                    <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} displayEmpty sx={{ borderRadius: 2, bgcolor: "#f9fafb", fontSize: "0.875rem", "& fieldset": { border: "1px solid #e5e7eb" }, "&:hover fieldset": { borderColor: "#d1d5db" }, "&.Mui-focused fieldset": { borderColor: "#93c7c1" }, "& .MuiSelect-select": { py: 1.25 } }}>
                      <MenuItem value="" sx={{ fontSize: "0.875rem", color: "#9ca3af" }}>All Status</MenuItem>
                      <MenuItem value="Active" sx={{ fontSize: "0.875rem" }}>Active</MenuItem>
                      <MenuItem value="Blocked" sx={{ fontSize: "0.875rem" }}>Blocked</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 1.5}}>
                  <Button variant="contained" onClick={handleApplyFilters} fullWidth sx={{ py: 1, borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: "0.875rem", bgcolor: "#003d52", boxShadow: "none", "&:hover": { bgcolor: "#002a3a", boxShadow: "0 2px 8px rgba(0, 61, 82, 0.24)" } }}>Apply Filters</Button>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 1.5}}>
                  <Button variant="outlined" onClick={handleClearFilters} fullWidth sx={{ py: 1, borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: "0.875rem", color: "#6b7280", borderColor: "#e5e7eb", "&:hover": { borderColor: "#d1d5db", bgcolor: "#f9fafb" } }}>Clear Filters</Button>
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* Content Area */}
          <Box sx={{ px: 4, pb: 4 }}>
            <Box sx={{ mx: -4 }}>
              <DataTable columns={restaurantColumns} data={restaurants} loading={loading} emptyMessage="No restaurants found" keyExtractor={(r: Restaurant) => r._id} horizontalPadding={4} />
            </Box>
          </Box>

          {/* Image/PDF Preview Dialog */}
          <Dialog open={imagePreviewOpen} onClose={() => setImagePreviewOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: previewImage?.isPDF ? '90vh' : 'auto' } }}>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" fontWeight={600}>{previewImage?.type === "logo" ? "Company Logo" : "Tax Card"} - {previewImage?.name}{previewImage?.isPDF && (<Typography component="span" sx={{ ml: 2, fontSize: "0.875rem", color: "#6b7280" }}>(PDF Document)</Typography>)}</Typography>
              <IconButton onClick={() => setImagePreviewOpen(false)} size="small"><X size={20} /></IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: previewImage?.isPDF ? "600px" : "400px", backgroundColor: "#f5f5f5", borderRadius: "8px", p: 2 }}>
                {previewImage && (
                  <>
                    {previewImage.isPDF ? (
                      <iframe src={previewImage.url} style={{ width: "100%", height: "600px", border: "none", borderRadius: "8px" }} title={`${previewImage.name} ${previewImage.type}`} />
                    ) : (
                      <img src={previewImage.url} alt={`${previewImage.name} ${previewImage.type}`} style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain", borderRadius: "8px" }} />
                    )}
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setImagePreviewOpen(false)} sx={{ textTransform: "none" }}>Close</Button>
              <Button variant="contained" startIcon={<Download size={18} />} onClick={handleDownloadFromPreview} sx={{ textTransform: "none", borderRadius: "10px" }}>Download {previewImage?.isPDF ? "PDF" : "Image"}</Button>
            </DialogActions>
          </Dialog>

          {/* Create Restaurant Dialog */}
          <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Create Restaurant</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField label="ID" value={newRestaurant.id} onChange={(e) => setNewRestaurant({ ...newRestaurant, id: e.target.value })} fullWidth />
                <TextField label="Name" value={newRestaurant.name} onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })} fullWidth />
                <TextField label="Email" value={newRestaurant.email} onChange={(e) => setNewRestaurant({ ...newRestaurant, email: e.target.value })} fullWidth />
                <TextField label="Password" type="password" value={newRestaurant.password} onChange={(e) => setNewRestaurant({ ...newRestaurant, password: e.target.value })} fullWidth />

                {/* Logo Upload */}
                <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="logo-upload-file"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setLogoFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="logo-upload-file">
                    <Button variant="outlined" component="span" startIcon={<BusinessIcon />}>
                      Upload Logo
                    </Button>
                  </label>
                  {logoFile && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Selected: {logoFile.name}
                    </Typography>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
              <Button variant="contained" onClick={handleCreateSubmit} disabled={creating} sx={{ textTransform: 'none' }}>Create</Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>Are you sure you want to delete {selectedForDelete?.name}?</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
              <Button variant="contained" color="error" onClick={handleDeleteConfirmed} disabled={deleting} sx={{ textTransform: 'none' }}>Delete</Button>
            </DialogActions>
          </Dialog>

        </Box>
      </BasicLayout>
    </AuthGuard>
  );
}
