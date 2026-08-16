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
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";import { api } from "@/api";
import BasicLayout from "@/components/layouts/basicLayout2";
import BusinessIcon from "@mui/icons-material/Business";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import WorkIcon from "@mui/icons-material/Work";
import AuthGuard from "@/components/AuthGuard";
import BarChartIcon from "@mui/icons-material/BarChart";
import DataTable, { TableColumn } from "@/components/DataTable";
import { TextCell, StatusChip } from "@/components/TableComponents";
import {LocalOffer} from "@mui/icons-material";

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

type Vendor = {
  _id: string;
  name: string;
  email: string;
  logo?: { url: string }[];
  taxcard?: { url: string }[];
  blocked: boolean;
  isVerified: boolean;
  createdAt?: string;
};

export default function AllVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [actionType, setActionType] = useState<"blockVendor" | "unblockVendor" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null,
  });
  // Image preview states
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ 
    url: string; 
    name: string; 
    type: string;
    isPDF?: boolean;
  } | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    try {
      setLoading(true);
      const res = await api.get("/api/vendorgetter");
      const fetchedVendors = res.data.users || [];
      setAllVendors(fetchedVendors);
      setVendors(fetchedVendors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleApplyFilters = () => {
    let filtered = [...allVendors];

    // Search by name or email
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(search) ||
          vendor.email.toLowerCase().includes(search)
      );
    }

    // Filter by status
    if (filterStatus) {
      if (filterStatus === "Active") {
        filtered = filtered.filter((vendor) => !vendor.blocked);
      } else if (filterStatus === "Blocked") {
        filtered = filtered.filter((vendor) => vendor.blocked);
      }
    }


    

    setVendors(filtered);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setFilterStatus("");
    setSortConfig({ key: "", direction: null });
    setVendors(allVendors);
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
      setVendors([...allVendors]);
      return;
    }
  
    const sorted = [...vendors].sort((a, b) => {
      let aValue: any;
      let bValue: any;
  
      switch (key) {
        case "company":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
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
  
    setVendors(sorted);
  };

  const handleActionClick = (vendor: Vendor, type: "blockVendor" | "unblockVendor") => {
    setSelectedVendor(vendor);
    setActionType(type);
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedVendor || !actionType) return;
    try {
      setProcessing(true);
      const url = `/admin/${actionType}/${selectedVendor._id}`;
      await api.patch(url);
      setConfirmOpen(false);
      await fetchVendors();
    } catch (err) {
      console.error("Error performing action:", err);
    } finally {
      setProcessing(false);
    }
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

const handleImagePreview = (url: string, vendorName: string, type: "logo" | "taxcard", isPDF: boolean = false) => {
  setPreviewImage({ url, name: vendorName, type, isPDF });
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
// Define table columns
const vendorColumns: TableColumn<Vendor>[] = [
  {
    id: "company",
    label: (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between", // Keep space-between
          width: "100%",
          cursor: "pointer",
          height: "100%",
          minHeight: "25px",
          borderRight: '2px solid #e2e8f0' // Full width border
        }}
        onClick={() => handleSort("company")}
      >
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          width: "90%", // Content takes 90% width
          height: "100%",
        }}>
          <Typography sx={{ 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            color: "#6b7280",
            lineHeight: 1.2
          }}>
            COMPANY
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "company" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "company" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "2.8fr",
    render: (vendor: Vendor) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {vendor.logo?.[0]?.url ? (
          <Tooltip title="Click to view logo">
            <IconButton
              onClick={() => handleImagePreview(vendor.logo![0].url, vendor.name, "logo", false)}
              sx={{
                "&:hover": { transform: "scale(1.1)" },
                transition: "all 0.2s ease",
                p: 0,
              }}
            >
              <Avatar
                src={vendor.logo[0].url}
                alt={vendor.name}
                sx={{ width: 40, height: 40, border: "2px solid #e5e7eb" }}
              />
            </IconButton>
          </Tooltip>
        ) : (
          <Avatar sx={{ bgcolor: "grey.400", width: 40, height: 40 }}>
            {vendor.name?.[0] || "?"}
          </Avatar>
        )}
        
        <Box>
          <TextCell text={vendor.name} fontWeight={600} />
          <TextCell 
            text={vendor.email} 
            color="#6b7280" 
            fontSize="0.875rem"
          />
        </Box>
      </Box>
    ),
  },
  {
    id: "taxcard",
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
          width: "90%", // Also 90% for consistency (non-sortable)
          height: "100%",
        }}>
          <Typography sx={{ 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            color: "#6b7280",
            lineHeight: 1.2
          }}>
            TAX CARD
          </Typography>
        </Box>
      </Box>
    ),
    width: "1fr",
    align: "center",
    render: (vendor: Vendor) => (
      <>
        {vendor.taxcard?.[0]?.url ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Eye size={16} />}
            onClick={() => {
              const url = vendor.taxcard![0].url;
              const isPDF = url.toLowerCase().endsWith('.pdf') || 
                           vendor.taxcard![0].url.includes('application/pdf');
              handleImagePreview(url, vendor.name, "taxcard", isPDF);
            }}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "0.8125rem",
              borderColor: "#e5e7eb",
              color: "#6b7280",
              "&:hover": {
                borderColor: "#93c7c1",
                bgcolor: "#f9fafb",
              },
            }}
          >
            View
          </Button>
        ) : (
          <StatusChip
            label="N/A"
            colorMap={{
              "N/A": { bg: "#f3f4f6", text: "#6b7280" },
            }}
          />
        )}
      </>
    ),
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
          width: "90%", // 90% width
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
    render: (vendor: Vendor) => {
      const statusColors = {
        Blocked: { bg: "#fee2e2", text: "#dc2626" },
        Active: { bg: "#dcfce7", text: "#15803d" },
      };
      const status = vendor.blocked ? "Blocked" : "Active";
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
            minWidth: "85px",
            width: "85px",
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
          width: "90%", // 90% width
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
    render: (vendor: Vendor) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
        {vendor.isVerified ? (
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
          width: "90%", // 90% width
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
    render: (vendor: Vendor) => (
      <TextCell
        text={vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "-"}
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
          width: "90%", // Also 90% for consistency
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
    render: (vendor: Vendor) => (
      <Button
        variant="outlined"
        size="small"
        onClick={() => handleActionClick(vendor, vendor.blocked ? "unblockVendor" : "blockVendor")}
        sx={{
          textTransform: "none",
          borderRadius: "8px",
          fontSize: "0.8125rem",
          fontWeight: 600,
          minWidth: "90px",
          width: "90px",
          px: 2,
          py: 0.75,
          borderColor: vendor.blocked ? "#15803d" : "#dc2626",
          color: vendor.blocked ? "#15803d" : "#dc2626",
          "&:hover": {
            borderColor: vendor.blocked ? "#15803d" : "#dc2626",
            bgcolor: vendor.blocked ? "#f0fdf4" : "#fef2f2",
          },
        }}
      >
        {vendor.blocked ? "Unblock" : "Block"}
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
                "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1600')",
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
                🏢 All Vendors
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
                Manage all registered vendors, view their information, and control access to the platform.
              </Typography>

              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={fetchVendors}
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

 {/* Filter Section - Match All Users Style */}
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
      {/* Search by Company Name/Email */}
      <Grid size={{xs: 12, sm: 6, md: 6}}>
        <TextField
          fullWidth
          placeholder="Search by Company Name or Email..."
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

      {/* Apply Filters Button - Same width as All Users */}
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

      {/* Clear Filters Button - Same width as All Users */}
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
                columns={vendorColumns}
                data={vendors}
                loading={loading}
                emptyMessage="No vendors found"
                keyExtractor={(vendor: Vendor) => vendor._id}
                horizontalPadding={4}
              />
            </Box>
          </Box>

{/* Image/PDF Preview Dialog */}
<Dialog 
  open={imagePreviewOpen} 
  onClose={() => setImagePreviewOpen(false)} 
  maxWidth="md" 
  fullWidth
  PaperProps={{
    sx: {
      maxHeight: previewImage?.isPDF ? '90vh' : 'auto',
    }
  }}
>
  <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <Typography variant="h6" fontWeight={600}>
      {previewImage?.type === "logo" ? "Company Logo" : "Tax Card"} - {previewImage?.name}
      {previewImage?.isPDF && (
        <Typography component="span" sx={{ ml: 2, fontSize: "0.875rem", color: "#6b7280" }}>
          (PDF Document)
        </Typography>
      )}
    </Typography>
    <IconButton onClick={() => setImagePreviewOpen(false)} size="small">
      <X size={20} />
    </IconButton>
  </DialogTitle>
  <DialogContent>
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: previewImage?.isPDF ? "600px" : "400px",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        p: 2,
      }}
    >
      {previewImage && (
        <>
          {previewImage.isPDF ? (
            <iframe
              src={previewImage.url}
              style={{
                width: "100%",
                height: "600px",
                border: "none",
                borderRadius: "8px",
              }}
              title={`${previewImage.name} ${previewImage.type}`}
            />
          ) : (
            <img
              src={previewImage.url}
              alt={`${previewImage.name} ${previewImage.type}`}
              style={{
                maxWidth: "100%",
                maxHeight: "500px",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
          )}
        </>
      )}
    </Box>
  </DialogContent>
  <DialogActions sx={{ p: 2 }}>
    <Button onClick={() => setImagePreviewOpen(false)} sx={{ textTransform: "none" }}>
      Close
    </Button>
    <Button
      variant="contained"
      startIcon={<Download size={18} />}
      onClick={handleDownloadFromPreview}
      sx={{ textTransform: "none", borderRadius: "10px" }}
    >
      Download {previewImage?.isPDF ? "PDF" : "Image"}
    </Button>
  </DialogActions>
</Dialog>

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
      bgcolor: actionType === "blockVendor" ? "#fef2f2" : "#f0fdf4",
      borderBottom: actionType === "blockVendor" ? "2px solid #fecaca" : "2px solid #bbf7d0",
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        bgcolor: actionType === "blockVendor" ? "#ef4444" : "#22c55e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      {actionType === "blockVendor" ? (
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
          color: actionType === "blockVendor" ? "#991b1b" : "#166534"
        }}
      >
        {actionType === "blockVendor" ? "Block Vendor" : "Unblock Vendor"}
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ color: actionType === "blockVendor" ? "#dc2626" : "#16a34a" }}
      >
        Please confirm your action
      </Typography>
    </Box>
  </DialogTitle>

  <DialogContent sx={{ px: 4, py: 3 }}>
    <Typography sx={{ mb: 3, color: "#475569" }}>
      {actionType === "blockVendor"
        ? `Are you sure you want to block ${selectedVendor?.name}?`
        : `Are you sure you want to unblock ${selectedVendor?.name}?`}
    </Typography>
    {selectedVendor && (
      <Box
        sx={{
          p: 3,
          bgcolor: "#f8fafc",
          borderRadius: 2,
          border: "2px solid #e2e8f0",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          {selectedVendor.logo?.[0]?.url ? (
            <Avatar
              src={selectedVendor.logo[0].url}
              alt={selectedVendor.name}
              sx={{ width: 48, height: 48, border: "2px solid #e5e7eb" }}
            />
          ) : (
            <Avatar sx={{ bgcolor: "grey.400", width: 48, height: 48 }}>
              {selectedVendor.name?.[0] || "?"}
            </Avatar>
          )}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#111827" }}>
            {selectedVendor.name}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BusinessIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="body2" sx={{ color: "#475569" }}>
              <strong>Email:</strong> {selectedVendor.email}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShieldCheck size={18} color="#64748b" />
            <Typography variant="body2" sx={{ color: "#475569" }}>
              <strong>Status:</strong> {selectedVendor.blocked ? "Blocked" : "Active"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShieldCheck size={18} color="#64748b" />
            <Typography variant="body2" sx={{ color: "#475569" }}>
              <strong>Verified:</strong> {selectedVendor.isVerified ? "Yes" : "No"}
            </Typography>
          </Box>
          {selectedVendor.taxcard?.[0]?.url && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BusinessIcon sx={{ fontSize: 18, color: "#64748b" }} />
              <Typography variant="body2" sx={{ color: "#475569" }}>
                <strong>Tax Card:</strong> Available
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <Typography variant="caption" sx={{ color: "#64748b", fontStyle: "italic" }}>
            {actionType === "blockVendor"
              ? "⚠️ This vendor will lose access to the system immediately."
              : "✅ This vendor will regain full access to the system."}
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
        bgcolor: actionType === "blockVendor" ? "#ef4444" : "#22c55e",
        "&:hover": {
          bgcolor: actionType === "blockVendor" ? "#dc2626" : "#16a34a",
        },
      }}
    >
      {processing ? "Processing..." : actionType === "blockVendor" ? "Block Vendor" : "Unblock Vendor"}
    </Button>
  </DialogActions>
</Dialog>
        </Box>
      </BasicLayout>
    </AuthGuard>
  );
}