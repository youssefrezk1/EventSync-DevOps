"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import EventBreadcrumb from "@/shared/components/breadcrumb";


import {
  Box,
  Container,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SchoolIcon from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

import { api } from "@/api";
import AgendaPreview from "@/shared/components/AgendaPreview2";
import GUCCard from "@/components/GucCairo";
import GUCBerlinCard from "@/components/GucBerlin";
import WorkshopMainContent from "@/shared/components/WorkshopMainContent";
import BasicLayout from "@/components/layouts/basicLayout2";

import { getMenuItemsByRole } from "@/shared/components/getMenuItemsByRole";
import MultiStepRegistrationDialog from "../../shared/components/MultiStepRegistrationDialog";

import { useUser } from "../../shared/services";
import EventComments from "../../shared/components/Eventcomments";
import AddCommentAndRating from "../../shared/components/AddCommentAndRating";

import FavoriteButton from "@/components/FavoriteButton";

interface DecodedToken {
  role?: string;
  staffRole?: string;
}

interface Workshop {
  _id: string;
  name: string;
  location: "GUC Cairo" | "GUC Berlin";
  start: string;
  end: string;
  shortDescription?: string;
  fullagenda?: string;
  facultyResponsible: string;
  professorsParticipating: string[];
  requiredBudget?: number;
  fundingSource: "external" | "GUC";
  extraRequiredResources?: string;
  capacity: number;
  registrationDeadline: string;
  registeredCount: number;
  ProfCreator: {
    firstName: string;
    lastName: string;
  };
  status: string;
}

export default function WorkshopDetailPage() {
  const user = useUser();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFeedbackSuccess = () => {
  setRefreshKey(prev => prev + 1); // This will force EventComments to refresh
  };

  const params = useParams();
  const router = useRouter();
  const workshopId = params.id as string;

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);

  // ----------------------------------------
  // 1️⃣ Load menu from JWT role
  // ----------------------------------------
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const decoded = jwtDecode<DecodedToken>(token);

      const items = getMenuItemsByRole(decoded.role, decoded.staffRole);
      setMenuItems(items);
      if (decoded.role === "TA") {
        setUserRole("TA");
      } else if (decoded.role === "Staff" && decoded.staffRole === "Professor") {
        setUserRole("Professor");
      } else {
        setUserRole(decoded.role);
      }
    } catch (err) {
      console.error("Failed to decode token", err);
    }
  }, []);

  // ----------------------------------------
  // 2️⃣ Fetch workshop data
  // ----------------------------------------
  const fetchWorkshop = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/workshops/workshop/${workshopId}`);
      setWorkshop(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load workshop");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshop();
  }, [workshopId]);

  // ----------------------------------------
  // Helper Functions
  // ----------------------------------------
  const formatTime = (date: string) => {
    const d = new Date(date);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const getDateTimeDisplay = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = startDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const endMonth = endDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const startTime = formatTime(start);
    const endTime = formatTime(end);

    if (startMonth === endMonth && startDay === endDay) {
      return `${startDay} ${startMonth} | ${startTime} - ${endTime}`;
    } else if (startMonth === endMonth) {
      return `${startDay}-${endDay} ${startMonth} | ${startTime} - ${endTime}`;
    } else {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} | ${startTime} - ${endTime}`;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // ----------------------------------------
  // Loading UI
  // ----------------------------------------
  if (loading) {
    return (
      <BasicLayout menuItems={menuItems}>
        <Box
          sx={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={60} />
        </Box>
      </BasicLayout>
    );
  }

  // ----------------------------------------
  // Error UI
  // ----------------------------------------
  if (error || !workshop) {
    return (
      <BasicLayout menuItems={menuItems}>
        <Box
          sx={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Alert severity="error">{error || "Workshop not found"}</Alert>
        </Box>
      </BasicLayout>
    );
  }

  const placesLeft = workshop.capacity - workshop.registeredCount;

  // ----------------------------------------
  // FINAL RENDER
  // ----------------------------------------
  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
        <EventBreadcrumb workshopId={workshopId} />

        {/* HERO SECTION */}
        <Box
  sx={{
    position: "relative",
    height: "500px",
    backgroundImage:
      "url(https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    mb: 6,
    borderRadius: "32px",
    overflow: "hidden",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))",
    },
  }}
>
           {/* INSERT THIS RIGHT HERE */}
  

          <Container maxWidth="lg" sx={{ position: "relative", height: "100%", zIndex: 1 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
                py: 3,
              }}
            >
              {/* Back Button Removed – Spacer Added */}
              <Box sx={{ height: 40 }} />

              {/* Title */}
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 36, md: 52 },
                    fontWeight: 800,
                    color: "white",
                    mb: 2,
                    letterSpacing: "-1px",
                  }}
                >
                  {workshop.name}
                </Typography>

                {/* Date / Time */}
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                    bgcolor: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <CalendarTodayIcon sx={{ color: "white", fontSize: 20 }} />
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: "white" }}>
                    {getDateTimeDisplay(workshop.start, workshop.end)}
                  </Typography>
                </Box>

                {/* Chips */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  <Chip
                    icon={<LocationOnIcon />}
                    label={workshop.location}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.15)",
                      color: "white",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />

                  <Chip
                    icon={<SchoolIcon />}
                    label={workshop.facultyResponsible}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.15)",
                      color: "white",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />

                  <Chip
                    label={workshop.status}
                    sx={{
                      bgcolor:
                        workshop.status === "confirmed"
                          ? "rgba(16,185,129,0.25)"
                          : "rgba(245,158,11,0.25)",
                      color: "white",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg">
          {/* Deadline + Favorites */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 3,
              mb: 4,
            }}
          >
            {/* Deadline Card */}
            <Box
              sx={{
                bgcolor: "white",
                borderRadius: 3,
                p: 3,
                border: "1px solid #e2e8f0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <EventAvailableIcon sx={{ color: "#475569", fontSize: 32 }} />
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Registration Deadline
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                    {formatDate(workshop.registrationDeadline)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Favorite Button */}
            <FavoriteButton eventId={workshop._id} eventType="workshop" />
          </Box>

          {/* MAIN CONTENT */}
          <WorkshopMainContent
            workshop={workshop}
            registering={false}
            onRegister={() => setShowRegistrationDialog(true)}
            userId={user?.id}
            role={userRole}
          />

          {/* Agenda */}
          {workshop.fullagenda && (
            <Box sx={{ mb: 4 }}>
              <AgendaPreview
                agenda={workshop.fullagenda || "[]"}
                workshopStart={workshop.start}
                workshopEnd={workshop.end}
                title="Workshop Agenda"
                subtitle="Day-by-day schedule"
              />
            </Box>
          )}

          {/* Venue Title */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700 }}>Venue</Typography>
          </Box>

          {/* Location Card */}
          <Box sx={{ mb: 6 }}>
            {workshop.location === "GUC Cairo" ? <GUCCard /> : <GUCBerlinCard />}
          </Box>

          <Box sx={{ mb: 0 }}>
            <EventComments
              key={refreshKey}
              eventType="workshop"
              eventId={workshop._id}
              eventName={workshop.name}
              onSuccess={handleFeedbackSuccess}
              userRole={user?.role}
              userId={user?.id}
            />
          </Box>

          
        </Container>
      </Box>

      {/* Multi-Step Registration Dialog */}
      <MultiStepRegistrationDialog
        open={showRegistrationDialog}
        onClose={() => setShowRegistrationDialog(false)}
        workshopId={workshopId}
        workshopName={workshop.name}
        itemType="workshop"
        onRegistrationSuccess={() => {
          setShowRegistrationDialog(false);
          fetchWorkshop();
        }}
      />
    </BasicLayout>
  );
}