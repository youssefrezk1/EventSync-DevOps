"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AddIcon from "@mui/icons-material/Add";
import { LocalOffer } from "@mui/icons-material";
import { RefreshCw, ArrowRight } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
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
  { text: "Invitation Requests", icon: <BusinessIcon />, href: "/dashboards/eventOffice/invitationRequests" },
  { text: "Reports", icon: <BarChartIcon />, href: "/dashboards/eventOffice/reports" },
  { text: "Overlapping Booths", icon: <HomeIcon />, href: "/dashboards/eventOffice/overlappingBooths" },
  { text: "Loyalty Program", icon: <LocalOffer />, href: "/dashboards/eventOffice/loyaltyProgram" },
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

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    gymClasses: 0,
    pendingWorkshopsCount: 0,
    pendingVendorsCount: 0,
  });
  const [upcomingGym, setUpcomingGym] = useState<GymClass[]>([]);
  const [topPendingWorkshops, setTopPendingWorkshops] = useState<Workshop[]>([]);
  const [topPendingVendors, setTopPendingVendors] = useState<VendorRequest[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchStats = async () => {
    if (!token) {
      console.error("Authentication token is missing.");
      return;
    }

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [revenueRes, gymRes, wsRes, vendorRes] = await Promise.all([
        axios.get("http://localhost:4000/admin/reports/revenue", { headers }),
        axios.get("http://localhost:4000/eventOffice/gym", { headers }),
        axios.get("http://localhost:4000/event-office/workshops", { headers }),
        axios.get("http://localhost:4000/api/admin/participation-requests", { headers }),
      ]);

      const workshops: Workshop[] = wsRes.data?.workshops || [];
      const requests: VendorRequest[] = vendorRes.data?.data || [];
      const gymClasses: GymClass[] = gymRes.data || [];

      const pendingWorkshops = workshops.filter((w: Workshop) => w.status === "Pending");
      const pendingVendors = requests.filter((r: VendorRequest) => r.Pending === "Pending");

      setStats({
        totalRevenue: revenueRes.data?.grandTotal || 0,
        gymClasses: gymClasses.length,
        pendingWorkshopsCount: pendingWorkshops.length,
        pendingVendorsCount: pendingVendors.length,
      });

      const now = new Date();
      const upcoming = gymClasses
        .filter((cls) => new Date(cls.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);
      setUpcomingGym(upcoming);

      const topWorkshops = pendingWorkshops
        .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
        .slice(0, 5);
      setTopPendingWorkshops(topWorkshops);

      const topVendors = pendingVendors
        .sort((a, b) => new Date(b.StartDate).getTime() - new Date(a.StartDate).getTime())
        .slice(0, 5);
      setTopPendingVendors(topVendors);

    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getEnrollmentColor = (counter: number, max: number) => {
    const percentage = (counter / max) * 100;
    if (percentage >= 90) return "#ef4444"; // Red - Almost/Full
    if (percentage >= 70) return "#f59e0b"; // Orange - Getting full
    return "#6b7280"; // Gray - Normal
  };

  const keyStatCards = [
    { title: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: TrendingUpIcon, color: "#10b981", bgColor: "#ecfdf5" },
    { title: "Total Gym Classes", value: stats.gymClasses, icon: FitnessCenterIcon, color: "#8b5cf6", bgColor: "#f5f3ff" },
    { title: "Pending Workshops", value: stats.pendingWorkshopsCount, icon: WorkIcon, color: "#f59e0b", bgColor: "#fffbeb" },
    { title: "Pending Vendors", value: stats.pendingVendorsCount, icon: BusinessIcon, color: "#3b82f6", bgColor: "#eff6ff" },
  ];

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ minHeight: "100vh" }}>
        {/* Hero Section */}
        <Box
          sx={{
            position: "relative",
            background:
              "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600')",
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
              👋 Welcome to Event Office
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
              Monitor events, gym sessions, workshop and vendor requests all in one place.
            </Typography>

            <Button
              variant="outlined"
              startIcon={<RefreshCw size={18} />}
              onClick={fetchStats}
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
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </Box>
        </Box>

        {/* Summary Stats Cards - Centered */}
        <Box sx={{ mb: 5, display: "flex", justifyContent: "center", px: 4 }}>
          <Box sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 3,
            maxWidth: "1000px",
            width: "100%",
          }}>
            {keyStatCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <Box
                  key={card.title}
                  sx={{
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    border: "1px solid #e5e7eb",
                    transition: "all 0.3s ease",
                    minHeight: "140px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    p: 2.5,
                    textAlign: "center",
                    bgcolor: "white",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                      borderColor: card.color,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: card.bgColor,
                        color: card.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconComponent sx={{ fontSize: 32 }} />
                    </Box>
                  </Box>
                  <Typography sx={{ fontWeight: 700, color: "#111827", mb: 0.5, fontSize: "1.75rem" }}>
                    {card.value}
                  </Typography>
                  <Typography sx={{ color: "#6b7280", fontSize: "0.8rem", fontWeight: 500 }}>
                    {card.title}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Three Column Section */}
        <Box sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: 3,
          mb: 4,
        }}>
          {/* Workshop Requests */}
          <Box
            sx={{
              borderRadius: "12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
              minHeight: "450px",
              display: "flex",
              flexDirection: "column",
              bgcolor: "white",
            }}
          >
            <Box sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2.5,
              borderBottom: "1px solid #e5e7eb",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: "#fffbeb",
                  color: "#f59e0b",
                  display: "flex",
                }}>
                  <WorkIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>
                  Pending Workshops
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowRight size={14} />}
                onClick={() => router.push("/dashboards/eventOffice/workshopRequests")}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#6b7280",
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                View All
              </Button>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto" }}>
              {topPendingWorkshops.length === 0 ? (
                <Box sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  p: 5,
                  color: "#9ca3af",
                }}>
                  <WorkIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.5 }} />
                  <Typography sx={{ fontSize: "0.875rem", textAlign: "center" }}>
                    No pending workshop requests
                  </Typography>
                </Box>
              ) : (
                topPendingWorkshops.map((ws, index) => (
                  <Box
                    key={ws._id}
                    onClick={() => router.push("/dashboards/eventOffice/workshopRequests")}
                    sx={{
                      p: 2.5,
                      cursor: "pointer",
                      borderBottom: index < topPendingWorkshops.length - 1 ? "1px solid #f3f4f6" : "none",
                      "&:hover": { bgcolor: "#f9fafb" },
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827", mb: 0.5 }}>
                      {ws.name}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography sx={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        {ws.location}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>•</Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        Capacity: {ws.capacity}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>•</Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                        {formatDate(ws.start)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>

          {/* Vendor Requests */}
          <Box
            sx={{
              borderRadius: "12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
              minHeight: "450px",
              display: "flex",
              flexDirection: "column",
              bgcolor: "white",
            }}
          >
            <Box sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2.5,
              borderBottom: "1px solid #e5e7eb",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: "#eff6ff",
                  color: "#3b82f6",
                  display: "flex",
                }}>
                  <BusinessIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>
                  Pending Vendors
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowRight size={14} />}
                onClick={() => router.push("/dashboards/eventOffice/vendorRequests")}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#6b7280",
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                View All
              </Button>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto" }}>
              {topPendingVendors.length === 0 ? (
                <Box sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  p: 5,
                  color: "#9ca3af",
                }}>
                  <BusinessIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.5 }} />
                  <Typography sx={{ fontSize: "0.875rem", textAlign: "center" }}>
                    No pending vendor requests
                  </Typography>
                </Box>
              ) : (
                topPendingVendors.map((vendor, index) => {
                  const vendorData = vendor.VendorName || vendor.VendorID;
                  const logoUrl = vendorData?.logo && vendorData.logo.length > 0 ? vendorData.logo[0].url : null;
                  const bazaarData = vendor.BazaarName;
                  const eventType = bazaarData ? "Bazaar" : "Booth";
                  const eventTypeColors = {
                    Bazaar: { bg: "#fef3c7", text: "#ca8a04" },
                    Booth: { bg: "#fce7f3", text: "#be185d" },
                  };

                  return (
                    <Box
                      key={vendor._id}
                      onClick={() => router.push("/dashboards/eventOffice/vendorRequests")}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        p: 2.5,
                        cursor: "pointer",
                        borderBottom: index < topPendingVendors.length - 1 ? "1px solid #f3f4f6" : "none",
                        "&:hover": { bgcolor: "#f9fafb" },
                      }}
                    >
                      {logoUrl ? (
                        <Box
                          component="img"
                          src={logoUrl}
                          alt={vendorData?.companyName}
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #e5e7eb",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            bgcolor: "#f3f4f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid #e5e7eb",
                            flexShrink: 0,
                          }}
                        >
                          <Typography sx={{ fontSize: "1rem", fontWeight: 600, color: "#9ca3af" }}>
                            {vendorData?.companyName?.[0]?.toUpperCase() || "V"}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827", mb: 0.5 }}>
                          {vendorData?.companyName || "Unknown Vendor"}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography sx={{ fontSize: "0.75rem", color: "#6b7280" }}>
                            {typeof bazaarData === 'object' && bazaarData?.name 
                              ? bazaarData.name 
                              : vendor.Location || "No location"}
                          </Typography>
                          <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>•</Typography>
                          <Box
                            sx={{
                              display: "inline-flex",
                              px: 1.5,
                              py: 0.25,
                              borderRadius: 1,
                              bgcolor: eventTypeColors[eventType].bg,
                              color: eventTypeColors[eventType].text,
                            }}
                          >
                            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600 }}>
                              {eventType}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>•</Typography>
                          <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                            {formatDate(vendor.StartDate)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          {/* Upcoming Gym Classes */}
          <Box
            sx={{
              borderRadius: "12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
              minHeight: "450px",
              display: "flex",
              flexDirection: "column",
              bgcolor: "white",
            }}
          >
            <Box sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2.5,
              borderBottom: "1px solid #e5e7eb",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: "#f5f3ff",
                  color: "#8b5cf6",
                  display: "flex",
                }}>
                  <FitnessCenterIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>
                  Upcoming Classes
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowRight size={14} />}
                onClick={() => router.push("/dashboards/eventOffice/gym")}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#6b7280",
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                View All
              </Button>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto" }}>
              {upcomingGym.length === 0 ? (
                <Box sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  p: 5,
                  color: "#9ca3af",
                }}>
                  <FitnessCenterIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.5 }} />
                  <Typography sx={{ fontSize: "0.875rem", textAlign: "center" }}>
                    No upcoming classes scheduled
                  </Typography>
                </Box>
              ) : (
                upcomingGym.map((cls, idx) => {
                  const enrollmentCount = cls.counter || 0;
                  const maxCount = cls.maxParticipants;
                  const enrollmentColor = getEnrollmentColor(enrollmentCount, maxCount);

                  return (
                    <Box
                      key={cls._id}
                      onClick={() => router.push("/dashboards/eventOffice/gym")}
                      sx={{
                        p: 2.5,
                        cursor: "pointer",
                        borderBottom: idx < upcomingGym.length - 1 ? "1px solid #f3f4f6" : "none",
                        "&:hover": { bgcolor: "#f9fafb" },
                      }}
                    >
                      <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: "0.9rem", mb: 0.5, textTransform: "capitalize" }}>
                        {cls.type}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography sx={{ fontSize: "0.75rem", color: "#6b7280" }}>
                          {cls.time}
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>•</Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#6b7280" }}>
                          {cls.duration}
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>•</Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}>
                          {maxCount} spots
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>•</Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          {formatDate(cls.date)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </BasicLayout>
  );
}