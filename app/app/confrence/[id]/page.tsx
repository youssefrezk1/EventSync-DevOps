"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";

import {
  Box,
  Container,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Card
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PublicIcon from "@mui/icons-material/Public";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AgendaPreview from "@/shared/components/ConfrenceAgendaPreview";
import FavoriteButton from "@/components/FavoriteButton";

import { api } from "@/api";
import BasicLayout from "@/components/layouts/basicLayout2";
import { getMenuItemsByRole } from "@/shared/components/getMenuItemsByRole";
import ConferenceBreadcrumb from "@/shared/components/confrenceBreadCrum";
interface DecodedToken {
  role?: string;
  staffRole?: string;
}

interface Conference {
  _id: string;
  name: string;
  start: string;
  endDate: string;
  time: string;
  shortDescription: string;
  fullAgenda: string;
  conferenceWebsiteLink: string;
  requiredBudget: number;
  sourceOfFunding: "external" | "GUC";
  extraRequiredResources: string;
  isArchived: boolean;
  restrictedTo: string[];
}

export default function ConferenceDetailPage() {
  const params = useParams();
  const conferenceId = params.id as string;

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [conference, setConference] = useState<Conference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string | undefined>(undefined);

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

  const fetchConference = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/conferences/${conferenceId}`);
      setConference(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load conference");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConference();
  }, [conferenceId]);

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

  if (error || !conference) {
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
          <Alert severity="error">{error || "Conference not found"}</Alert>
        </Box>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
  <ConferenceBreadcrumb conferenceId={conferenceId} />
  {/* HERO SECTION */}
  <Box
    sx={{
      position: "relative",
      height: "500px",
      backgroundImage:
        "url(https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&fit=crop)",
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
              <Box sx={{ height: 40 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: { xs: 36, md: 52 },
                      fontWeight: 800,
                      color: "white",
                      mb: 2,
                      letterSpacing: "-1px",
                    }}
                  >
                    {conference.name}
                  </Typography>

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
                      {getDateTimeDisplay(conference.start, conference.endDate)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                    <Chip
                      icon={<PublicIcon />}
                      label={conference.sourceOfFunding === "GUC" ? "GUC Funded" : "External Funded"}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.15)",
                        color: "white",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    />
                    {conference.isArchived && (
                      <Chip
                        label="Archived"
                        sx={{
                          bgcolor: "rgba(220, 38, 38, 0.2)",
                          color: "white",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(220, 38, 38, 0.5)",
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Visit Website Button - Bottom Right */}
                <Button
                  href={conference.conferenceWebsiteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon />}
                  sx={{
                    bgcolor: "white",
                    color: "#1e293b",
                    fontWeight: 700,
                    fontSize: 14,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    transition: "all 0.3s ease",
                    mb: 2,
                    ml: 2,
                    "&:hover": {
                      bgcolor: "#f1f5f9",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  Visit Website
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg">
          {/* Description + Favorites Section */}
          {conference.shortDescription && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
                gap: 3,
                mb: 6,
              }}
            >
              {/* About Conference Card */}
              <Box
                sx={{
                  bgcolor: "white",
                  borderRadius: 3,
                  p: 3,
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography sx={{ fontSize: 22, fontWeight: 700, mb: 2 }}>
                  About this Conference
                </Typography>
                <Typography sx={{ fontSize: 16, color: "#374151", lineHeight: 1.7 }}>
                  {conference.shortDescription}
                </Typography>
              </Box>

              {/* Favorite Button */}
              <FavoriteButton eventId={conference._id} eventType="conference" />
            </Box>
          )}

          {/* If no description, show favorites in a single column layout */}
          {!conference.shortDescription && (
            <Box sx={{ mb: 6, maxWidth: "600px" }}>
              <FavoriteButton eventId={conference._id} eventType="conference" />
            </Box>
          )}

          {/* Agenda Section */}
          {conference.fullAgenda && (
            <Box sx={{ mb: 6 }}>
              <AgendaPreview
                agenda={conference.fullAgenda || "[]"}
                workshopStart={conference.start}
                workshopEnd={conference.endDate}
                title="Conference Agenda"
                subtitle="Complete schedule breakdown"
              />
            </Box>
          )}
        </Container>
      </Box>
    </BasicLayout>
  );
}