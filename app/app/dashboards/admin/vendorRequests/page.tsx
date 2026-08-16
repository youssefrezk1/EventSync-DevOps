

"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  alpha,
  Menu,
  Grid,           // ADD THIS
  TextField,      // ADD THIS
  InputAdornment, // ADD THIS
  Select,         // ADD THIS
  MenuItem,       // ADD THIS
  FormControl,    // ADD THIS
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from "@mui/icons-material/Search"; // ADD THIS
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business";
import EventIcon from "@mui/icons-material/Event";
import WorkIcon from "@mui/icons-material/Work";
import BarChartIcon from "@mui/icons-material/BarChart";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { RefreshCw } from "lucide-react";
import { api } from "@/api";
import AttendeesListPopup from "@/shared/components/AttendeesListPopup";
import DataTable, { TableColumn } from "@/components/DataTable";
import { TextCell, StatusChip, SecondaryTextCell } from "@/components/TableComponents";
import { LocationOn, CalendarToday, People, Store ,LocalOffer} from "@mui/icons-material";
import axios from "axios";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";


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

interface VendorRequest {
  _id: string;
  VendorName: any;
  VendorID: any;
  BazaarName: any;
  StartDate: string;
  Location: string;
  Attendees: any[];
  PhotoIDs: any[];
  Pending: string;
}

export default function AdminVendorRequestsPage() {
  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VendorRequest | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [searchText, setSearchText] = useState(""); // Search by event name or vendor email
const [searchLocation, setSearchLocation] = useState(""); // Search by location
const [filterType, setFilterType] = useState(""); // Filter by Bazaar or Booth
const [allRequests, setAllRequests] = useState<VendorRequest[]>([]); // Store original data
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "accept" | "reject" | null;
    request: VendorRequest | null;
  }>({ open: false, type: null, request: null });
  const [snackbar, setSnackbar] = useState<{
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null,
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:4000/api/admin/participation-requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const fetchedRequests = res.data.data || [];
        setAllRequests(fetchedRequests); // Store original
        setRequests(fetchedRequests);    // Display all initially
      }
    } catch (err) {
      console.error("Error fetching vendor requests:", err);
      setSnackbar({ open: true, message: "Failed to load vendor requests", severity: "error" });
    } finally {
      setLoading(false);
    }
  };
const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
const [menuOpenVendorRequest, setMenuOpenVendorRequest] = useState<VendorRequest | null>(null); // Renamed state
const isMenuOpen = Boolean(anchorEl);
// Add the following helper functions from your request
const handleMenuClick = (event: React.MouseEvent<HTMLElement>, vendorRequest: VendorRequest) => {
    setAnchorEl(event.currentTarget);
    setMenuOpenVendorRequest(vendorRequest);
};

const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOpenVendorRequest(null);
};
// Assuming handleActionClick is a function that takes a VendorRequest and an action string ("Accept" or "Reject")
// handleActionClick: (req: VendorRequest, action: 'Accept' | 'Reject') => void;

const handleAcceptFromMenu = () => {
    handleMenuClose();
    if (menuOpenVendorRequest) {
        handleActionClick(menuOpenVendorRequest, "Accept");
    }
};

const handleRejectFromMenu = () => {
    handleMenuClose();
    if (menuOpenVendorRequest) {
        handleActionClick(menuOpenVendorRequest, "Reject");
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
      setRequests([...allRequests]);
      return;
    }
  
    let sorted = [...requests];
    sorted = applySorting(sorted, key, direction);
    setRequests(sorted);
  };

  const applySorting = (data: VendorRequest[], key: string, direction: "asc" | "desc") => {
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;
  
      switch (key) {

         case "vendor": // 🛠️ ADDED LOGIC FOR VENDOR SORTING
          aValue = (a.VendorName?.companyName || a.VendorID?.companyName || "").toLowerCase();
          bValue = (b.VendorName?.companyName || b.VendorID?.companyName || "").toLowerCase();
          break;
        case "type":
          aValue = (a.BazaarName ? "Bazaar" : "Booth").toLowerCase();
          bValue = (b.BazaarName ? "Bazaar" : "Booth").toLowerCase();
          break;
        case "event":
          aValue = (a.BazaarName?.name || a.BazaarName?.Name || "Booth Setup").toLowerCase();
          bValue = (b.BazaarName?.name || b.BazaarName?.Name || "Booth Setup").toLowerCase();
          break;
        case "date":
          aValue = new Date(a.BazaarName?.start || a.BazaarName?.StartDate || a.StartDate || 0).getTime();
          bValue = new Date(b.BazaarName?.start || b.BazaarName?.StartDate || b.StartDate || 0).getTime();
          break;
        case "location":
          aValue = (a.BazaarName?.location || a.BazaarName?.Location || a.Location || "").toLowerCase();
          bValue = (b.BazaarName?.location || b.BazaarName?.Location || b.Location || "").toLowerCase();
          break;
        case "attendees":
          aValue = (a.Attendees || []).length;
          bValue = (b.Attendees || []).length;
          break;
        default:
          return 0;
      }
  
      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };
  const handleApplyFilters = () => {
    let filtered = [...allRequests];
  
    // Search by event name or vendor email
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((req) => {
        const vendor = req.VendorName || req.VendorID;
        const vendorEmail = vendor?.email?.toLowerCase() || "";
        const eventName = (req.BazaarName?.name || req.BazaarName?.Name || "Booth Setup").toLowerCase();
        
        return vendorEmail.includes(search) || eventName.includes(search);
      });
    }
  
    // Search by location
    if (searchLocation.trim()) {
      const locationSearch = searchLocation.toLowerCase();
      filtered = filtered.filter((req) => {
        const location = (req.BazaarName?.location || req.BazaarName?.Location || req.Location || "").toLowerCase();
        return location.includes(locationSearch);
      });
    }
  
    // Filter by type (Bazaar or Booth)
    if (filterType) {
      if (filterType === "Bazaar") {
        filtered = filtered.filter((req) => req.BazaarName);
      } else if (filterType === "Booth") {
        filtered = filtered.filter((req) => !req.BazaarName);
      }
    }
  

    // Apply column sorting if active
if (sortConfig.key && sortConfig.direction) {
  filtered = applySorting(filtered, sortConfig.key, sortConfig.direction);
}
  
    setRequests(filtered);
  };
  
  const handleClearFilters = () => {
    setSearchText("");
    setSearchLocation("");
    setFilterType("");
    setSortConfig({ key: "", direction: null });
    setRequests(allRequests); // Reset to all requests
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleActionClick = (request: VendorRequest, action: "Accept" | "Reject") => {
    setConfirmDialog({ 
      open: true, 
      type: action.toLowerCase() as "accept" | "reject", 
      request 
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.request || !confirmDialog.type) return;

    // Store values locally before clearing confirmDialog
    const requestId = confirmDialog.request._id;
    const type = confirmDialog.request.BazaarName ? "bazaar" : "booth";
    const status = confirmDialog.type === "accept" ? "Accept" : "Reject";

    // Reset dialog
    setConfirmDialog({ open: false, type: null, request: null });
    setUpdatingId(requestId);

    // Get token safely
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      console.error("❌ No auth token found");
      setSnackbar({ open: true, message: "Authentication token missing", severity: "error" });
      setUpdatingId(null);
      return;
    }

    // Debug log
    console.log("PUT request info:", {
      url: `http://localhost:4000/api/admin/${type}-request/${requestId}/status`,
      body: { status },
      token,
    });

    try {
      const res = await axios.put(
        `http://localhost:4000/api/admin/${type}-request/${requestId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Response:", res.data);

      if (res.data.success) {
        setSnackbar({ open: true, message: `Request ${status}ed successfully`, severity: "success" });
        await fetchRequests(); // refresh list
      } else {
        setSnackbar({ open: true, message: res.data.message || "Failed to update status", severity: "error" });
      }
    } catch (err: any) {
      console.error("❌ Error updating status:", err.response || err);
      const message = err.response?.data?.message || "Error updating status";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewAttendees = (request: VendorRequest) => {
    setSelectedRequest(request);
    setPopupOpen(true);
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

  // Define table columns
 // Define table columns
const vendorColumns: TableColumn<VendorRequest>[] = [
  {
    id: "vendor",
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
        onClick={() => handleSort("vendor")}
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
            VENDOR
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "vendor" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "vendor" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "2fr",
    render: (req: VendorRequest) => {
      const vendor = req.VendorName || req.VendorID;
      const logoUrl = vendor?.logo && vendor.logo.length > 0 ? vendor.logo[0].url : null;

      return (
        <Box sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          height: '100%',
        }}>
          {logoUrl ? (
            <Box
              component="img"
              src={logoUrl}
              alt={vendor.companyName}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid #e5e7eb",
              }}
            />
          ) : (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e5e7eb",
              }}
            >
              <Typography variant="body2" fontWeight={600} color="#9ca3af">
                {vendor?.companyName?.[0]?.toUpperCase() || "V"}
              </Typography>
            </Box>
          )}
          <Box>
            <TextCell text={vendor?.companyName || "Unknown Vendor"} fontWeight={600} />
            <SecondaryTextCell text={vendor?.email || "-"} />
          </Box>
        </Box>
      );
    },
  },
  {
    id: "type",
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
        onClick={() => handleSort("type")}
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
            TYPE
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "type" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "type" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "1fr",
    render: (req: VendorRequest) => (
      <StatusChip
        label={req.BazaarName ? "Bazaar" : "Booth"}
        colorMap={{
          Bazaar: { bg: "#fef3c7", text: "#ca8a04" },
          Booth: { bg: "#ede9fe", text: "#7c3aed" },
        }}
      />
    ),
  },
  {
    id: "event",
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
        onClick={() => handleSort("event")}
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
            EVENT
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "event" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "event" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "1.0fr",
    render: (req: VendorRequest) => {
      const eventName = req.BazaarName?.name || req.BazaarName?.Name || "Booth Setup";
      return <TextCell text={eventName} />;
    },
  },
  {
    id: "date",
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
        onClick={() => handleSort("date")}
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
            START DATE
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "date" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "date" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "1.3fr",
    render: (req: VendorRequest) => {
      const startDate =
        req.BazaarName?.start || req.BazaarName?.StartDate || req.StartDate;
      return (
        <SecondaryTextCell
          text={startDate ? new Date(startDate).toLocaleDateString() : "N/A"}
        />
      );
    },
  },
  {
    id: "location",
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
        onClick={() => handleSort("location")}
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
            LOCATION
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "location" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "location" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "1.1fr",
    render: (req: VendorRequest) => {
      const location = req.BazaarName?.location || req.BazaarName?.Location || req.Location || "N/A";
      return <SecondaryTextCell text={location} />;
    },
  },
  {
    id: "attendees",
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
        onClick={() => handleSort("attendees")}
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
            ATTENDEES
          </Typography>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 0.25,
          }}>
            <KeyboardArrowUpIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "attendees" && sortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 12,
                color: sortConfig.key === "attendees" && sortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                transition: "color 0.2s",
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    ),
    width: "1.1fr",
    render: (req: VendorRequest) => (
      <TextCell text={(req.Attendees || []).length} fontWeight={600} color="#2563eb" />
    ),
  },
  {
    id: "status",
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
            STATUS
          </Typography>
        </Box>
      </Box>
    ),
    width: "1fr",
    render: (req: VendorRequest) => (
      <StatusChip
        label={req.Pending || "Pending"}
        colorMap={{
          Accept: { bg: "#dcfce7", text: "#15803d" },
          Reject: { bg: "#fee2e2", text: "#dc2626" },
          Pending: { bg: "#fef3c7", text: "#ca8a04" },
        }}
      />
    ),
  },
  {
    id: "details",
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
            DETAILS
          </Typography>
        </Box>
      </Box>
    ),
    width: "1fr",
    render: (req: VendorRequest) => (
      <Button
        variant="contained"
        size="small"
        onClick={() => handleViewAttendees(req)}
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
            {/* Empty label for actions column */}
          </Typography>
        </Box>
      </Box>
    ),
    width: "0.5fr",
    align: "center",
    render: (req: VendorRequest) => (
      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
        <IconButton
          size="small"
          onClick={(e) => handleMenuClick(e, req)}
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
        {/* Hero Section */}
        <Box
          sx={{
            position: "relative",
            background:
              "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1600')",
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
              🏪 Vendor Participation Requests
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
              Review and manage vendor participation requests for bazaars and booths. Accept or reject requests and view attendee information.
            </Typography>

            <Button
              variant="outlined"
              startIcon={<RefreshCw size={18} />}
              onClick={fetchRequests}
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
      {/* Search by Event Name or Vendor Email */}
      <Grid size={{xs: 12, sm: 6, md: 3}}>
        <TextField
          fullWidth
          placeholder="Search by Event or Vendor Email..."
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

      {/* Search by Location */}
      <Grid size={{xs: 12, sm: 6, md: 2.5}}>
        <TextField
          fullWidth
          placeholder="Search Location..."
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
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

      {/* Filter by Type */}
      <Grid size={{xs: 12, sm: 6, md: 2}}>
        <FormControl fullWidth>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
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
              Filter by Type
            </MenuItem>
            <MenuItem value="Bazaar" sx={{ fontSize: "0.875rem" }}>Bazaar</MenuItem>
            <MenuItem value="Booth" sx={{ fontSize: "0.875rem" }}>Booth</MenuItem>
          </Select>
        </FormControl>
      </Grid>



      {/* Apply Filters Button */}
      <Grid size={{xs: 12, sm: 6, md: 1.25}}>
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
      <Grid size={{xs: 12, sm: 6, md: 1.25}}>
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
              data={requests}
              loading={loading}
              emptyMessage="No vendor requests found"
              keyExtractor={(req: VendorRequest) => req._id}
              horizontalPadding={4}
            />
          </Box>
        </Box>

        {/* Confirmation Dialog - Workshop Style */}
        <Dialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ open: false, type: null, request: null })}
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
                {confirmDialog.type === "accept" ? "Accept Request" : "Reject Request"}
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
              Are you sure you want to {confirmDialog.type} this vendor participation request?
            </Typography>
            {confirmDialog.request && (
              <Box
                sx={{
                  p: 3,
                  bgcolor: "#f8fafc",
                  borderRadius: 2,
                  border: "2px solid #e2e8f0",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {(() => {
                    const vendor = confirmDialog.request.VendorName || confirmDialog.request.VendorID;
                    return vendor?.companyName || "Unknown Vendor";
                  })()}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Store sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Type:</strong> {confirmDialog.request.BazaarName ? "Bazaar" : "Booth"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EventIcon sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Event:</strong> {confirmDialog.request.BazaarName?.name || confirmDialog.request.BazaarName?.Name || "Booth Setup"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Location:</strong> {confirmDialog.request.BazaarName?.location || confirmDialog.request.BazaarName?.Location || confirmDialog.request.Location || "N/A"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarToday sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Start:</strong> {(() => {
                        const startDate = confirmDialog.request.BazaarName?.start || confirmDialog.request.BazaarName?.StartDate || confirmDialog.request.StartDate;
                        return startDate ? formatDateTime(startDate) : "N/A";
                      })()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <People sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Attendees:</strong> {(confirmDialog.request.Attendees || []).length}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 4, py: 3, bgcolor: "#f8fafc", gap: 2 }}>
            <Button
              onClick={() => setConfirmDialog({ open: false, type: null, request: null })}
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
              {confirmDialog.type === "accept" ? "Accept Request" : "Reject Request"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Attendees Popup */}
        {selectedRequest && (
          <AttendeesListPopup
            open={popupOpen}
            onClose={() => {
              setPopupOpen(false);
              setSelectedRequest(null);
            }}
            attendees={selectedRequest.Attendees || []}
            photoIDs={selectedRequest.PhotoIDs || []}
          />
        )}
      </Box>
      {/* --- Action Menu for Vendor Requests --- */}
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
              disabled={menuOpenVendorRequest?.Pending !== 'Pending' || updatingId === menuOpenVendorRequest?._id}
              sx={{ color: '#15803d', '&:hover': { bgcolor: '#dcfce7' } }}
          >
              <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
              Accept
          </MenuItem>
          
          
          {/* Reject Action */}
          <MenuItem 
              onClick={handleRejectFromMenu} 
              disabled={menuOpenVendorRequest?.Pending !== 'Pending' || updatingId === menuOpenVendorRequest?._id}
              sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}
          >
              <CancelIcon fontSize="small" sx={{ mr: 1 }} />
              Reject
          </MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </BasicLayout>
  );
}