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
  Menu,
  Grid,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Avatar,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { RefreshCw } from "lucide-react";
import DataTable, { TableColumn } from "@/components/DataTable";
import { TextCell, StatusChip, SecondaryTextCell } from "@/components/TableComponents";
import { LocationOn, CalendarToday, People } from "@mui/icons-material";
import axios from "axios";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ImageIcon from "@mui/icons-material/Image";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/eventOffice" },
  {
    text: "Events",
    icon: <EventIcon />,
    href: "/dashboards/eventOffice/events",
  },
  {
    text: "Gym",
    icon: <FitnessCenterIcon />,
    href: "/dashboards/eventOffice/gym",
  },
  {
    text: "Workshop Requests",
    icon: <WorkIcon />,
    href: "/dashboards/eventOffice/workshopRequests",
  },
  {
    text: "Vendor Requests",
    icon: <BusinessIcon />,
    href: "/dashboards/eventOffice/vendorRequests",
  },
  {
    text: "Reports",
    icon: <BarChartIcon />,
    href: "/dashboards/eventOffice/reports",
  },
  {
    text: "Overlapping Booths",
    icon: <HomeIcon />,
    href: "/dashboards/eventOffice/overlappingBooths",
  },
  {
    text: "Loyalty Program",
    icon: <LocalOfferIcon />,
    href: "/dashboards/eventOffice/loyaltyProgram",
  },
  {
    text: "Invitation Requests",
    icon: <PersonIcon />,
    href: "/dashboards/eventOffice/invitationRequests",
    active: true,
  },
];

interface InvitationRequest {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentId?: string;
  };
  inviteeName: string;
  inviteePhoto: string;
  issueDate: string;
  expirationDate: string;
  status: "pending" | "active" | "expired" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export default function InvitationRequestsPage() {
  const [requests, setRequests] = useState<InvitationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchStudentId, setSearchStudentId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [allRequests, setAllRequests] = useState<InvitationRequest[]>([]);

const [viewDialog, setViewDialog] = useState<{
  open: boolean;
  request: InvitationRequest | null;
}>({
  open: false,
  request: null,
});



  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "accept" | "reject" | null;
    request: InvitationRequest | null;
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOpenRequest, setMenuOpenRequest] = useState<InvitationRequest | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  }>({
    key: "",
    direction: null,
  });

  const handleViewRequest = (request: InvitationRequest) => {
  setViewDialog({
    open: true,
    request,
  });
};

const handleCloseViewDialog = () => {
  setViewDialog({
    open: false,
    request: null,
  });
};

const handleDownloadPhoto = async () => {
  if (!viewDialog.request?.inviteePhoto) return;
  
  try {
    // Fetch the image as a blob
    const response = await fetch(viewDialog.request.inviteePhoto);
    const blob = await response.blob();
    
    // Create a temporary URL for the blob
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${viewDialog.request.inviteeName.replace(/\s+/g, '_')}_photo.jpg`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    
    setSnackbar({
      open: true,
      message: "Photo downloaded successfully",
      severity: "success",
    });
  } catch (error) {
    console.error("Download error:", error);
    setSnackbar({
      open: true,
      message: "Failed to download photo",
      severity: "error",
    });
  }
};

  // Function to sort requests with pending first
  const sortRequestsWithPendingFirst = (requests: InvitationRequest[]): InvitationRequest[] => {
    return [...requests].sort((a, b) => {
      // Priority 1: Status sorting (pending comes first)
      const statusPriority: Record<string, number> = {
        pending: 1,
        active: 2,
        expired: 3,
        rejected: 4
      };
      
      // If statuses are different, sort by priority
      if (statusPriority[a.status] !== statusPriority[b.status]) {
        return statusPriority[a.status] - statusPriority[b.status];
      }
      
      // Priority 2: For same status, show newest first (by createdAt)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/invitations/admin/all-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const fetchedRequests = res.data.data || [];
        
        // Filter out any requests with "used" status
        const filteredRequests = fetchedRequests.filter(req => req.status !== "used");
        
        // Sort with pending first
        const sortedRequests = sortRequestsWithPendingFirst(filteredRequests);
        
        setAllRequests(sortedRequests);
        setRequests(sortedRequests);
      }
    } catch (err) {
      console.error("Error fetching invitation requests:", err);
      setSnackbar({
        open: true,
        message: "Failed to load invitation requests",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, request: InvitationRequest) => {
    setAnchorEl(event.currentTarget);
    setMenuOpenRequest(request);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOpenRequest(null);
  };

  const handleAcceptFromMenu = () => {
    handleMenuClose();
    if (menuOpenRequest) {
      handleActionClick(menuOpenRequest, "Accept");
    }
  };

  const handleRejectFromMenu = () => {
    handleMenuClose();
    if (menuOpenRequest) {
      handleActionClick(menuOpenRequest, "Reject");
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
      // When clearing sort, apply pending-first sorting
      const pendingFirstRequests = sortRequestsWithPendingFirst(allRequests);
      setRequests(pendingFirstRequests);
      return;
    }

    let sorted = [...requests];
    sorted = applySorting(sorted, key, direction);
    setRequests(sorted);
  };

  const applySorting = (
    data: InvitationRequest[],
    key: string,
    direction: "asc" | "desc"
  ) => {
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (key) {
        case "student":
          aValue = `${a.studentId.firstName} ${a.studentId.lastName}`.toLowerCase();
          bValue = `${b.studentId.firstName} ${b.studentId.lastName}`.toLowerCase();
          break;
        case "studentId":
          aValue = (a.studentId.studentId || "").toLowerCase();
          bValue = (b.studentId.studentId || "").toLowerCase();
          break;
        case "invitee":
          aValue = a.inviteeName.toLowerCase();
          bValue = b.inviteeName.toLowerCase();
          break;
        case "issueDate":
          aValue = new Date(a.issueDate).getTime();
          bValue = new Date(b.issueDate).getTime();
          break;
        case "expiry":
          aValue = new Date(a.expirationDate).getTime();
          bValue = new Date(b.expirationDate).getTime();
          break;
        case "status":
          // For status sorting, we still want pending first
          const statusPriority: Record<string, number> = {
            pending: 1,
            active: 2,
            expired: 3,
            rejected: 4
          };
          aValue = statusPriority[a.status];
          bValue = statusPriority[b.status];
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

    // Search by student name or email
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((req) => {
        const studentName = `${req.studentId.firstName} ${req.studentId.lastName}`.toLowerCase();
        const studentEmail = req.studentId.email.toLowerCase();
        const inviteeName = req.inviteeName.toLowerCase();

        return (
          studentName.includes(search) ||
          studentEmail.includes(search) ||
          inviteeName.includes(search)
        );
      });
    }

    // Search by student ID
    if (searchStudentId.trim()) {
      const search = searchStudentId.toLowerCase();
      filtered = filtered.filter((req) => {
        const studentId = (req.studentId.studentId || "").toLowerCase();
        return studentId.includes(search);
      });
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter((req) => req.status === filterStatus);
    }

    // Apply sorting if active
    if (sortConfig.key && sortConfig.direction) {
      filtered = applySorting(filtered, sortConfig.key, sortConfig.direction);
    } else {
      // If no sorting is applied, ensure pending comes first
      filtered = sortRequestsWithPendingFirst(filtered);
    }

    setRequests(filtered);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setSearchStudentId("");
    setFilterStatus("");
    setSortConfig({ key: "", direction: null });
    // Reset to pending-first order
    const pendingFirstRequests = sortRequestsWithPendingFirst(allRequests);
    setRequests(pendingFirstRequests);
  };

  const handleActionClick = (request: InvitationRequest, action: "Accept" | "Reject") => {
    setConfirmDialog({
      open: true,
      type: action.toLowerCase() as "accept" | "reject",
      request,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.request || !confirmDialog.type) return;

    const requestId = confirmDialog.request._id;
    const status = confirmDialog.type === "accept" ? "Accept" : "Reject";

    setConfirmDialog({ open: false, type: null, request: null });
    setUpdatingId(requestId);

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No auth token found");
      setSnackbar({
        open: true,
        message: "Authentication token missing",
        severity: "error",
      });
      setUpdatingId(null);
      return;
    }

    try {
      const res = await axios.put(
        `/api/invitations/admin/${requestId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Response:", res.data);

      if (res.data.success) {
        setSnackbar({
          open: true,
          message: `Invitation ${status}ed successfully`,
          severity: "success",
        });
        await fetchRequests(); // This will re-sort with pending first
      } else {
        setSnackbar({
          open: true,
          message: res.data.message || "Failed to update status",
          severity: "error",
        });
      }
    } catch (err: any) {
      console.error("❌ Error updating status:", err.response || err);
      const message = err.response?.data?.message || "Error updating status";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  const invitationColumns: TableColumn<InvitationRequest>[] = [
    {
      id: "student",
      label: (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            cursor: "pointer",
            borderRight: "1px solid #e2e8f0",
          }}
          onClick={() => handleSort("student")}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "90%",
            }}
          >
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>
              STUDENT
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <KeyboardArrowUpIcon
                sx={{
                  fontSize: 12,
                  color:
                    sortConfig.key === "student" && sortConfig.direction === "asc"
                      ? "#003d52"
                      : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color:
                    sortConfig.key === "student" && sortConfig.direction === "desc"
                      ? "#003d52"
                      : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "3fr",
      render: (req: InvitationRequest) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            height: "100%",
            py: 2, // Add padding top/bottom
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "#003d52",
              fontWeight: 600,
              fontSize: "0.875rem",
              flexShrink: 0, // Add this - prevents avatar from shrinking
            }}
          >
            {req.studentId.firstName[0]}
            {req.studentId.lastName[0]}
          </Avatar>
          <Box sx={{ 
            flex: 1, 
            minWidth: 0, // Add this - allows text truncation
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}>
            <Typography sx={{ 
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#111827',
              lineHeight: 1.4
            }}>
              {`${req.studentId.firstName} ${req.studentId.lastName}`}
            </Typography>
            <Typography sx={{ 
              fontSize: '0.8125rem',
              color: '#6b7280',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2, // Limits to 2 lines
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word'
            }}>
              {req.studentId.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: "studentId",
      label: (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            cursor: "pointer",
            borderRight: "1px solid #e2e8f0",
          }}
          onClick={() => handleSort("studentId")}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "90%",
            }}
          >
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>
              STUDENT ID
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <KeyboardArrowUpIcon
                sx={{
                  fontSize: 12,
                  color:
                    sortConfig.key === "studentId" && sortConfig.direction === "asc"
                      ? "#003d52"
                      : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color:
                    sortConfig.key === "studentId" && sortConfig.direction === "desc"
                      ? "#003d52"
                      : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "1.1fr",
      render: (req: InvitationRequest) => (
        <TextCell text={req.studentId.studentId || "N/A"} fontWeight={600} />
      ),
    },
    {
      id: "invitee",
      label: (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            cursor: "pointer",
            borderRight: "1px solid #e2e8f0",
          }}
          onClick={() => handleSort("invitee")}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "90%",
            }}
          >
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>
              INVITEE
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <KeyboardArrowUpIcon
                sx={{
                  fontSize: 12,
                  color:
                    sortConfig.key === "invitee" && sortConfig.direction === "asc"
                      ? "#003d52"
                      : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color:
                    sortConfig.key === "invitee" && sortConfig.direction === "desc"
                      ? "#003d52"
                      : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "2.4fr",
      render: (req: InvitationRequest) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            component="img"
            src={req.inviteePhoto}
            alt={req.inviteeName}
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid #e5e7eb",
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/api/placeholder/40/40";
            }}
          />
          <TextCell text={req.inviteeName} fontWeight={600} />
        </Box>
      ),
    },
    {
      id: "issueDate",
      label: (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            cursor: "pointer",
            borderRight: "1px solid #e2e8f0",
          }}
          onClick={() => handleSort("issueDate")}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "90%",
            }}
          >
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>
              ISSUE DATE
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <KeyboardArrowUpIcon
                sx={{
                  fontSize: 12,
                  color:
                    sortConfig.key === "issueDate" && sortConfig.direction === "asc"
                      ? "#003d52"
                      : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color:
                    sortConfig.key === "issueDate" && sortConfig.direction === "desc"
                      ? "#003d52"
                      : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "1.3fr",
      render: (req: InvitationRequest) => (
        <SecondaryTextCell text={formatDate(req.issueDate)} />
      ),
    },
    {
      id: "expiry",
      label: (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            cursor: "pointer",
            borderRight: "1px solid #e2e8f0",
          }}
          onClick={() => handleSort("expiry")}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "90%",
            }}
          >
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>
              EXPIRY DATE
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <KeyboardArrowUpIcon
                sx={{
                  fontSize: 12,
                  color:
                    sortConfig.key === "expiry" && sortConfig.direction === "asc"
                      ? "#003d52"
                      : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color:
                    sortConfig.key === "expiry" && sortConfig.direction === "desc"
                      ? "#003d52"
                      : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "1.3fr",
      render: (req: InvitationRequest) => {
        const isExpired = new Date() > new Date(req.expirationDate);
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <SecondaryTextCell text={formatDate(req.expirationDate)} />
            {isExpired && req.status !== "expired" && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "#ef4444",
                }}
              />
            )}
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
            width: "100%",
            borderRight: "1px solid #e2e8f0",
            pr: 2,
          }}
        >
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>
            STATUS
          </Typography>
        </Box>
      ),
      width: "1fr",
      render: (req: InvitationRequest) => {
        const statusMap = {
          pending: { label: "Pending", color: { bg: "#fef3c7", text: "#ca8a04" } },
          active: { label: "Active", color: { bg: "#dcfce7", text: "#15803d" } },
          expired: { label: "Expired", color: { bg: "#f3f4f6", text: "#6b7280" } },
          rejected: { label: "Rejected", color: { bg: "#fee2e2", text: "#dc2626" } },
        };

        const statusInfo = statusMap[req.status] || statusMap.pending;
        return (
          <StatusChip
            label={statusInfo.label}
            colorMap={{
              [statusInfo.label]: statusInfo.color,
            }}
          />
        );
      },
    },
    
    {
  id: "details",
  label: (
    <Box 
      sx={{ 
        display: "flex", 
        alignItems: "center", 
        width: "100%", 
        borderRight: '1px solid #e2e8f0', 
        pr: 2 
      }}
    >
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>
        DETAILS
      </Typography>
    </Box>
  ), 
  width: "1fr",
  render: (req: InvitationRequest) => (
    <Button
      variant="contained"
      size="small"
      onClick={() => handleViewRequest(req)}
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
      render: (req: InvitationRequest) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <IconButton
            size="small"
            onClick={(e) => handleMenuClick(e, req)}
            disabled={req.status !== "pending"}
            sx={{
              color: "#64748b",
              "&:hover": { backgroundColor: "rgba(0, 61, 82, 0.1)" },
              "&.Mui-disabled": { color: "#d1d5db" },
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
              "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600')",
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
              🎟️ Invitation Requests
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
              Review and manage student invitation requests. Pending requests are shown first. Accept requests to send QR codes to students or reject with appropriate reasons.
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
                "&.Mui-disabled": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "rgba(255, 255, 255, 0.5)",
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
              {/* Search by Student/Invitee */}
              <Grid size={{xs: 12, sm: 6, md: 3}}>
                <TextField
                  fullWidth
                  placeholder="Search by Student or Invitee..."
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

              {/* Search by Student ID */}
              <Grid size={{xs: 12, sm: 6, md: 2.5}}>
                <TextField
                  fullWidth
                  placeholder="Student ID..."
                  value={searchStudentId}
                  onChange={(e) => setSearchStudentId(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: "#9ca3af", fontSize: 20 }} />
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
              <Grid size={{xs: 12, sm: 6, md: 2}}>
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
                      Filter by Status
                    </MenuItem>
                    <MenuItem value="pending" sx={{ fontSize: "0.875rem" }}>
                      Pending
                    </MenuItem>
                    <MenuItem value="active" sx={{ fontSize: "0.875rem" }}>
                      Active
                    </MenuItem>
                    <MenuItem value="expired" sx={{ fontSize: "0.875rem" }}>
                      Expired
                    </MenuItem>
                    <MenuItem value="rejected" sx={{ fontSize: "0.875rem" }}>
                      Rejected
                    </MenuItem>
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
            <Box sx={{
              '& table': {
                tableLayout: 'fixed', // Makes columns respect width ratios
              },
              '& tbody tr': {
                '& > td': {
                  verticalAlign: 'top',
                  py: 2,
                }
              }
            }}>
              <DataTable
                columns={invitationColumns}
                data={requests}
                loading={loading}
                emptyMessage="No invitation requests found"
                keyExtractor={(req: InvitationRequest) => req._id}
                horizontalPadding={4}
              />
            </Box>
          </Box>
        </Box>

{/* View Dialog - Simple Version */}
<Dialog
  open={viewDialog.open}
  onClose={handleCloseViewDialog}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle
    sx={{
      bgcolor: "#003d52",
      color: "white",
      py: 2,
      px: 3,
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
      <VisibilityIcon />
      Invitee ID Photo
    </Typography>
  </DialogTitle>

  <DialogContent sx={{ p: 3 }}>
    {viewDialog.request && (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 3 }}>
        <Box
          component="img"
          src={viewDialog.request.inviteePhoto}
          alt={`${viewDialog.request.inviteeName}'s photo`}
          sx={{
            width: "100%",
            maxWidth: 400,
            height: "auto",
            borderRadius: 2,
            border: "2px solid #e5e7eb",
            mb: 4,
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}>
            INVITEE NAME:
          </Typography>
          <Typography variant="body1" sx={{ color: "#374151", fontWeight: 600, fontSize: "1rem" }}>
            {viewDialog.request.inviteeName}
          </Typography>
        </Box>
      </Box>
    )}
  </DialogContent>

  <DialogActions sx={{ p: 2, borderTop: "1px solid #e5e7eb" }}>
    <Button
      onClick={handleCloseViewDialog}
      variant="outlined"
      sx={{
        textTransform: "none",
        borderRadius: 2,
        px: 3,
        borderColor: "#cbd5e1",
        color: "#64748b",
      }}
    >
      Close
    </Button>
    <Button
      variant="contained"
      startIcon={<DownloadIcon />}
      onClick={handleDownloadPhoto}
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
      Download Photo
    </Button>
  </DialogActions>
</Dialog>

        {/* Confirmation Dialog */}
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
                  color: confirmDialog.type === "accept" ? "#166534" : "#991b1b",
                }}
              >
                {confirmDialog.type === "accept" ? "Accept Invitation" : "Reject Invitation"}
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
              Are you sure you want to {confirmDialog.type} this invitation request?
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
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Invitation Details
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Student Info */}
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                      STUDENT
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 16, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        {confirmDialog.request.studentId.firstName}{" "}
                        {confirmDialog.request.studentId.lastName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <EmailIcon sx={{ fontSize: 16, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        {confirmDialog.request.studentId.email}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Invitee Info */}
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                      INVITEE
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 16, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        {confirmDialog.request.inviteeName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <ImageIcon sx={{ fontSize: 16, color: "#64748b" }} />
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#475569",
                          textDecoration: "underline",
                          cursor: "pointer",
                          "&:hover": { color: "#003d52" },
                        }}
                        onClick={() => window.open(confirmDialog.request!.inviteePhoto, "_blank")}
                      >
                        View Photo
                      </Typography>
                    </Box>
                  </Box>

                  {/* Dates */}
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                      DATES
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        <strong>Issued:</strong> {formatDate(confirmDialog.request.issueDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <EventAvailableIcon sx={{ fontSize: 16, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        <strong>Expires:</strong> {formatDate(confirmDialog.request.expirationDate)}
                      </Typography>
                    </Box>
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
              disabled={updatingId === confirmDialog.request?._id}
              sx={{
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: confirmDialog.type === "accept" ? "#22c55e" : "#ef4444",
                "&:hover": {
                  bgcolor: confirmDialog.type === "accept" ? "#16a34a" : "#dc2626",
                },
                "&.Mui-disabled": {
                  bgcolor: confirmDialog.type === "accept" ? "#86efac" : "#fca5a5",
                  color: "white",
                },
              }}
            >
              {updatingId === confirmDialog.request?._id
                ? "Processing..."
                : confirmDialog.type === "accept"
                ? "Accept Request"
                : "Reject Request"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem
            onClick={handleAcceptFromMenu}
            disabled={
              menuOpenRequest?.status !== "pending" || updatingId === menuOpenRequest?._id
            }
            sx={{
              color: "#15803d",
              "&:hover": { bgcolor: "#dcfce7" },
              "&.Mui-disabled": { color: "#86efac" },
            }}
          >
            <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
            Accept
          </MenuItem>
          <MenuItem
            onClick={handleRejectFromMenu}
            disabled={
              menuOpenRequest?.status !== "pending" || updatingId === menuOpenRequest?._id
            }
            sx={{
              color: "#dc2626",
              "&:hover": { bgcolor: "#fee2e2" },
              "&.Mui-disabled": { color: "#fca5a5" },
            }}
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
      </Box>
    </BasicLayout>
  );
}