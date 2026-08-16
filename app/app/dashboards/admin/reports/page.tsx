"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Grid,
  InputAdornment,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Chip,
} from "@mui/material";

import { IconButton } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";import { RefreshCw } from "lucide-react";
import DataTable, { TableColumn } from "@/components/DataTable";
import {
  TextCell,
  CurrencyCell,
  NumberCell,
  StatusChip,
  DateRangeCell,
} from "@/components/TableComponents";
import {LocalOffer} from "@mui/icons-material";

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

const eventTypes = ["Trip", "Workshop", "Bazaar", "Booth"];

type ReportEvent = {
  eventId: string;
  eventName: string;
  eventType: string;
  revenue?: number;
  attendeesCount?: number;
  start?: string | Date;
  end?: string | Date;
};

export default function ReportsPage() {
  const [view, setView] = useState<"revenue" | "attendees">("revenue");
  const [data, setData] = useState<ReportEvent[]>([]);
  const [totalsByType, setTotalsByType] = useState<Record<string, number>>({});
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState<ReportEvent[]>([]);
  const [filterName, setFilterName] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;



  const [revenueSortConfig, setRevenueSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null,
  });
  const [attendeesSortConfig, setAttendeesSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null,
  });

  const revenueColumns: TableColumn<ReportEvent>[] = [
    {
      id: "eventName",
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
          onClick={() => handleRevenueSort("eventName")}
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
              EVENT NAME
            </Typography>
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 0.25,
            }}>
              <KeyboardArrowUpIcon
                sx={{
                  fontSize: 12,
                  color: revenueSortConfig.key === "eventName" && revenueSortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color: revenueSortConfig.key === "eventName" && revenueSortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "2.0fr",
      render: (row: ReportEvent) => <TextCell text={row.eventName || "N/A"} fontWeight={600} />,
    },
    {
      id: "eventType",
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
          onClick={() => handleRevenueSort("eventType")}
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
              EVENT TYPE
            </Typography>
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 0.25,
            }}>
              <KeyboardArrowUpIcon
                sx={{
                  fontSize: 12,
                  color: revenueSortConfig.key === "eventType" && revenueSortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color: revenueSortConfig.key === "eventType" && revenueSortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "2.0fr",
      render: (row: ReportEvent) => {
        const colorMap: Record<string, { bg: string; text: string }> = {
          Trip: { bg: "#dbeafe", text: "#1e40af" },
          Workshop: { bg: "#ede9fe", text: "#7c3aed" },
          Bazaar: { bg: "#fef3c7", text: "#ca8a04" },
          Booth: { bg: "#fce7f3", text: "#be185d" },
        };
        const colors = colorMap[row.eventType] || { bg: "#f3f4f6", text: "#6b7280" };
        
        return (
          <Chip
            label={row.eventType}
            size="small"
            sx={{
              minWidth: "90px",
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
          onClick={() => handleRevenueSort("date")}
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
              DATE
            </Typography>
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 0.25,
            }}>
              <KeyboardArrowUpIcon
                sx={{
                  fontSize: 12,
                  color: revenueSortConfig.key === "date" && revenueSortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color: revenueSortConfig.key === "date" && revenueSortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "2.0fr",
      render: (row: ReportEvent) => <DateRangeCell start={row.start} end={row.end} />,
    },
    {
      id: "revenue",
      label: (
        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            width: "100%",
            cursor: "pointer",
            height: "100%",
            minHeight: "25px"
          }} 
          onClick={() => handleRevenueSort("revenue")}
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
              REVENUE
            </Typography>
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 0.25,
            }}>
              <KeyboardArrowUpIcon
                sx={{
                  fontSize: 12,
                  color: revenueSortConfig.key === "revenue" && revenueSortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color: revenueSortConfig.key === "revenue" && revenueSortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "1.5fr",
      render: (row: ReportEvent) => <CurrencyCell amount={row.revenue || 0} />,
    },
  ];
  
  const attendeesColumns: TableColumn<ReportEvent>[] = [
    {
      id: "eventName",
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
          onClick={() => handleAttendeesSort("eventName")}
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
              EVENT NAME
            </Typography>
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 0.25,
            }}>
              <KeyboardArrowUpIcon
                sx={{
                  fontSize: 12,
                  color: attendeesSortConfig.key === "eventName" && attendeesSortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color: attendeesSortConfig.key === "eventName" && attendeesSortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "2.0fr",
      render: (row: ReportEvent) => <TextCell text={row.eventName || "N/A"} fontWeight={600} />,
    },
    {
      id: "eventType",
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
          onClick={() => handleAttendeesSort("eventType")}
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
              EVENT TYPE
            </Typography>
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 0.25,
            }}>
              <KeyboardArrowUpIcon
                sx={{
                  fontSize: 12,
                  color: attendeesSortConfig.key === "eventType" && attendeesSortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color: attendeesSortConfig.key === "eventType" && attendeesSortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "2.0fr",
      render: (row: ReportEvent) => {
        const colorMap: Record<string, { bg: string; text: string }> = {
          Trip: { bg: "#dbeafe", text: "#1e40af" },
          Workshop: { bg: "#ede9fe", text: "#7c3aed" },
          Bazaar: { bg: "#fef3c7", text: "#ca8a04" },
          Booth: { bg: "#fce7f3", text: "#be185d" },
        };
        const colors = colorMap[row.eventType] || { bg: "#f3f4f6", text: "#6b7280" };
        
        return (
          <Chip
            label={row.eventType}
            size="small"
            sx={{
              minWidth: "90px",
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
          onClick={() => handleAttendeesSort("date")}
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
              DATE
            </Typography>
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 0.25,
            }}>
              <KeyboardArrowUpIcon
                sx={{
                  fontSize: 12,
                  color: attendeesSortConfig.key === "date" && attendeesSortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color: attendeesSortConfig.key === "date" && attendeesSortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "2.0fr",
      render: (row: ReportEvent) => <DateRangeCell start={row.start} end={row.end} />,
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
          onClick={() => handleAttendeesSort("attendees")}
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
                  color: attendeesSortConfig.key === "attendees" && attendeesSortConfig.direction === "asc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                }}
              />
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 12,
                  color: attendeesSortConfig.key === "attendees" && attendeesSortConfig.direction === "desc" ? "#003d52" : "#d1d5db",
                  transition: "color 0.2s",
                  mt: -0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      ),
      width: "1.5fr",
      render: (row: ReportEvent) => <NumberCell value={row.attendeesCount || 0} />,
    },
    {
      id: "export",
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
              EXPORT
            </Typography>
          </Box>
        </Box>
      ),
      width: "0.8fr",
      align: "center",
      render: (row: ReportEvent) => (
        <IconButton
          size="small"
          onClick={() => handleExport(row.eventId, row.eventType)}
          sx={{
            color: "#059669",
            bgcolor: "#ecfdf5",
            width: 32,
            height: 32,
            "&:hover": {
              bgcolor: "#d1fae5",
            },
          }}
        >
          <FileDownloadIcon sx={{ fontSize: 18 }} />
        </IconButton>
      ),
    },
  ];

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterName.trim()) params.name = filterName.trim();
      if (filterType) params.type = filterType;
      if (filterDateFrom) params.from = filterDateFrom;
      if (filterDateTo) params.to = filterDateTo;
      const res = await axios.get(`http://localhost:4000/admin/reports/${view}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      });
      const json = res.data;

      if (view === "revenue") {
        const details = json.details || [];
        setData(details);
        setOriginalData(details); // Must save original
        setTotalsByType(json.totalsByType || {});
        setGrandTotal(json.grandTotal || 0);
      } else {
        const results = json.results || [];
        setData(results);
        setOriginalData(results); // Must save original
        setTotalsByType(json.totalsByType || {});
        setGrandTotal(json.grandTotal || 0);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, token]);

const handleAttendeesSort = (key: string) => {
  let direction: "asc" | "desc" | null = "asc";

  if (attendeesSortConfig.key === key) {
    if (attendeesSortConfig.direction === "asc") {
      direction = "desc";
    } else if (attendeesSortConfig.direction === "desc") {
      direction = null;
    }
  }

  setAttendeesSortConfig({ key, direction });

  if (direction === null) {
    setData([...originalData]); // ✅ Correct - no loading
    return;
  }

  const sorted = applyAttendeesSorting([...data], key, direction);
  setData(sorted);
};

const handleRevenueSort = (key: string) => {
  let direction: "asc" | "desc" | null = "asc";

  if (revenueSortConfig.key === key) {
    if (revenueSortConfig.direction === "asc") {
      direction = "desc";
    } else if (revenueSortConfig.direction === "desc") {
      direction = null;
    }
  }

  setRevenueSortConfig({ key, direction });

  if (direction === null) {
    setData([...originalData]); // ✅ Instant reset, no loading
    return;
  }

  const sorted = applyRevenueSorting([...data], key, direction);
  setData(sorted);
};

  const applyRevenueSorting = (data: any[], key: string, direction: "asc" | "desc") => {
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;
  
      switch (key) {
        case "eventName":
          aValue = (a.eventName || a.EventName || "").toLowerCase();
          bValue = (b.eventName || b.EventName || "").toLowerCase();
          break;
        case "eventType":
          aValue = (a.eventType || a.EventType || "").toLowerCase();
          bValue = (b.eventType || b.EventType || "").toLowerCase();
          break;
          case "date":
            aValue = new Date(a.start || a.StartDate || a.date || 0).getTime();
            bValue = new Date(b.start || b.StartDate || b.date || 0).getTime();
            break;
        case "revenue":
          aValue = parseFloat(a.revenue || a.Revenue || 0);
          bValue = parseFloat(b.revenue || b.Revenue || 0);
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
    fetchData();
  };
  const applyAttendeesSorting = (data: any[], key: string, direction: "asc" | "desc") => {
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;
  
      switch (key) {
        case "eventName":
          aValue = (a.eventName || a.EventName || "").toLowerCase();
          bValue = (b.eventName || b.EventName || "").toLowerCase();
          break;
        case "eventType":
          aValue = (a.eventType || a.EventType || "").toLowerCase();
          bValue = (b.eventType || b.EventType || "").toLowerCase();
          break;
          case "date":
            aValue = new Date(a.start || a.StartDate || a.date || 0).getTime();
            bValue = new Date(b.start || b.StartDate || b.date || 0).getTime();
            break;
        case "attendees":
          aValue = parseInt(a.attendees || a.Attendees || 0);
          bValue = parseInt(b.attendees || b.Attendees || 0);
          break;
        default:
          return 0;
      }
  
      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleClearFilters = async () => {
    setFilterName("");
    setFilterType("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setRevenueSortConfig({ key: "", direction: null });
    setAttendeesSortConfig({ key: "", direction: null });
  
    await new Promise((resolve) => setTimeout(resolve, 0));
    // ... rest of function
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:4000/admin/reports/${view}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {},
      });
      const json = res.data;

      if (view === "revenue") {
        setData(json.details || []);
        setTotalsByType(json.totalsByType || {});
        setGrandTotal(json.grandTotal || 0);
      } else {
        setData(json.results || []);
        setTotalsByType(json.totalsByType || {});
        setGrandTotal(json.grandTotal || 0);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleExport = async (eventId: string, eventType: string) => {
  try {
    // Normalize event type to lowercase for API endpoint
    const normalizedType = eventType.toLowerCase();
    
    // Make the API call
    const response = await axios.get(
      `http://localhost:4000/exports/${normalizedType}/${eventId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Important: tells axios to expect a binary file
      }
    );

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header or create default
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `${normalizedType}-registrations.xlsx`;
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
      }
    }
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log('Export successful:', fileName);
  } catch (error) {
    console.error('Export failed:', error);
    
    // Show user-friendly error message
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        alert('No registrations found for this event.');
      } else if (error.response?.status === 400) {
        alert('Invalid event type for export.');
      } else {
        alert('Failed to export data. Please try again.');
      }
    } else {
      alert('An unexpected error occurred during export.');
    }
  }
};

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ minHeight: "100vh" }}>
        {/* Hero Section */}
        <Box
          sx={{
            position: "relative",
            background:
              "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600')",
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
                fontSize: { xs: "2rem", md: "2.5rem" },
              }}
            >
              📊 Analytics & Reports
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
              Track event performance, revenue insights, and attendee engagement across all your
              events.
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant={view === "revenue" ? "contained" : "outlined"}
                onClick={() => setView("revenue")}
                startIcon={<TrendingUpIcon />}
                sx={{
                  px: 3,
                  py: 1.25,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  bgcolor: view === "revenue" ? "white" : "transparent",
                  color: view === "revenue" ? "#003d52" : "white",
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  "&:hover": {
                    bgcolor: view === "revenue" ? "#f5f5f5" : "rgba(255, 255, 255, 0.1)",
                    borderColor: "white",
                  },
                }}
              >
                Revenue Report
              </Button>
              <Button
                variant={view === "attendees" ? "contained" : "outlined"}
                onClick={() => setView("attendees")}
                startIcon={<PeopleIcon />}
                sx={{
                  px: 3,
                  py: 1.25,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  bgcolor: view === "attendees" ? "white" : "transparent",
                  color: view === "attendees" ? "#003d52" : "white",
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  "&:hover": {
                    bgcolor: view === "attendees" ? "#f5f5f5" : "rgba(255, 255, 255, 0.1)",
                    borderColor: "white",
                  },
                }}
              >
                Attendees Report
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={fetchData}
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

{/* Stats Cards - Centered and styled like Admin Dashboard */}
<Box sx={{ mb: 5, display: "flex", justifyContent: "center", px: 4 }}>
  <Box sx={{ 
    display: "flex", 
    gap: 2.5, 
    maxWidth: view === "revenue" ? "1200px" : "auto", // Different behavior for each view
    width: view === "revenue" ? "100%" : "auto",
    justifyContent: "center",
    flexWrap: "wrap", // Allow wrapping if needed on small screens
  }}>
    {/* Grand Total Card */}
    <Box
      sx={{
        cursor: "pointer",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
        transition: "all 0.3s ease",
        minHeight: "140px",
        width: view === "revenue" 
          ? "auto" // Grid item in revenue view
          : "200px", // Fixed width in attendees view
        flex: view === "revenue" ? 1 : "0 0 200px", // Grow in revenue, fixed in attendees
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        p: 2.5,
        textAlign: "center",
        bgcolor: "white",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
          borderColor: "#10b981",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
        <Box sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: "#ecfdf5",
          color: "#10b981",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <BarChartIcon sx={{ fontSize: 32 }} />
        </Box>
      </Box>
      <Typography sx={{ 
        fontWeight: 700, 
        color: "#111827", 
        mb: 0.5, 
        fontSize: "1.75rem", 
      }}>
        {view === "revenue"
          ? `$${grandTotal.toLocaleString()}`
          : grandTotal.toLocaleString()}
      </Typography>
      <Typography sx={{ 
        color: "#6b7280", 
        fontSize: "0.8rem", 
        fontWeight: 500, 
      }}>
        Grand Total
      </Typography>
    </Box>

    {/* Type-specific Cards */}
    {Object.entries(totalsByType)
      .slice(0, 4)
      .map(([type, total], index) => {
        const colors = [
          { bg: "#eff6ff", color: "#3b82f6" },
          { bg: "#f5f3ff", color: "#8b5cf6" },
          { bg: "#ecfeff", color: "#06b6d4" },
          { bg: "#fffbeb", color: "#f59e0b" },
        ];
        const colorScheme = colors[index % colors.length];
        
        return (
          <Box
            key={type}
            sx={{
              cursor: "pointer",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
              transition: "all 0.3s ease",
              minHeight: "140px",
              width: view === "revenue" 
                ? "auto" // Grid item in revenue view
                : "200px", // Fixed width in attendees view
              flex: view === "revenue" ? 1 : "0 0 200px", // Grow in revenue, fixed in attendees
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              p: 2.5,
              textAlign: "center",
              bgcolor: "white",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                borderColor: colorScheme.color,
              },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
              <Box sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: colorScheme.bg,
                color: colorScheme.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {view === "revenue" ? (
                  <TrendingUpIcon sx={{ fontSize: 32 }} />
                ) : (
                  <PeopleIcon sx={{ fontSize: 32 }} />
                )}
              </Box>
            </Box>
            <Typography sx={{ 
              fontWeight: 700, 
              color: "#111827", 
              mb: 0.5, 
              fontSize: "1.75rem", 
            }}>
              {view === "revenue"
                ? `$${(total as number).toLocaleString()}`
                : (total as number).toLocaleString()}
            </Typography>
            <Typography sx={{ 
              color: "#6b7280", 
              fontSize: "0.8rem", 
              fontWeight: 500, 
            }}>
              {type}
            </Typography>
          </Box>
        );
      })}
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

            <Grid container spacing={2} alignItems="center">              <Grid size={{xs: 12, sm: 6, md: 2.4}}>
                <TextField
                  fullWidth
                  placeholder="Search Event Name..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
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

              <Grid size={{xs: 12, sm: 6, md: 2.4}}>
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
                      Event Type
                    </MenuItem>
                    {(view === "attendees" 
    ? ["Trip", "Workshop"] 
    : eventTypes
  ).map((type) => (
                      <MenuItem key={type} value={type} sx={{ fontSize: "0.875rem" }}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{xs: 12, sm: 6, md: 2.4}}>
                <TextField
                  fullWidth
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
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

              <Grid size={{xs: 12, sm: 6, md: 2.4}}>
                <TextField
                  fullWidth
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
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

        {/* DataTable */}
        <Box sx={{ px: 4, pb: 4 }}>
          <Box sx={{ mx: -4 }}>
            <DataTable
              columns={view === "revenue" ? revenueColumns : attendeesColumns}
              data={data}
              loading={loading}
              emptyMessage="No reports available"
              keyExtractor={(row: ReportEvent, index: number) => `${row.eventId}-${index}`}
            />
          </Box>
        </Box>
      </Box>
    </BasicLayout>
  );
}