"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BasicLayout from "@/components/layouts/basicLayout2";
import { api } from "@/api";
import { getMenuItemsByRole } from "@/shared/components/getMenuItemsByRole";
import FavoriteButton from "@/components/FavoriteButton";
import VendorGrid from "@/shared/components/VendorList";
import LocationCard from "@/shared/components/LocationCard"; // Import the new component
import BazaarBreadcrumb from "@/shared/components/BazaarBreadCrum";

interface DecodedToken {
  role?: string;
  staffRole?: string;
}

interface VendorLogo {
  public_id: string;
  url: string;
}

interface Vendor {
  companyName: string;
  logo: VendorLogo[];
}

interface Bazaar {
  _id: string;
  name: string;
  start: string;
  endDate: string;
  time: string;
  location: string;
  shortDescription?: string;
}

export default function BazaarDetailPage() {
  const params = useParams();
  const bazaarId = params.id as string;

  const [bazaar, setBazaar] = useState<Bazaar | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [menuItems, setMenuItems] = useState<ReturnType<typeof getMenuItemsByRole>>([]);

  // Load menu from JWT
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const decoded = jwtDecode<DecodedToken>(token);
      const items = getMenuItemsByRole(decoded.role, decoded.staffRole);
      setMenuItems(items);
    } catch (err) {
      console.error("Failed to decode token", err);
    }
  }, []);

  // Fetch Bazaar Details
  const fetchBazaar = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/bazaarbyid/${bazaarId}`);

      setBazaar(data.bazaar);
      setVendors(data.registeredVendors || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Failed to load bazaar"
        );
      } else {
        setError("Failed to load bazaar");
      }
    } finally {
      setLoading(false);
    }
  }, [bazaarId]);

  useEffect(() => {
    fetchBazaar();
  }, [fetchBazaar]);

  // Helpers
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

  if (error || !bazaar) {
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
          <Alert severity="error">{error || "Bazaar not found"}</Alert>
        </Box>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
        <BazaarBreadcrumb bazaarId={bazaarId} />
        {/* HERO SECTION */}
        <Box
  sx={{
    position: "relative",
    height: "500px",
    backgroundImage:
      "url(https://images.unsplash.com/photo-1571060492916-93b251851ca5?q=80&w=2086&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
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
              <Box sx={{ height: 40 }} /> {/* Spacer for top */}

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
                  {bazaar.name}
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
                    {getDateTimeDisplay(bazaar.start, bazaar.endDate)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg">
          {/* About Section + Favorites Button */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
              gap: 3,
              mb: 6,
            }}
          >
            {/* About this Bazaar */}
            {bazaar.shortDescription && (
              <Box
                sx={{
                  bgcolor: "white",
                  borderRadius: 3,
                  p: 3,
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography sx={{ fontSize: 22, fontWeight: 700, mb: 2 }}>
                  About this Bazaar
                </Typography>
                <Typography sx={{ fontSize: 16, color: "#374151", lineHeight: 1.7 }}>
                  {bazaar.shortDescription}
                </Typography>
              </Box>
            )}

            {/* Favorite Button */}
            <FavoriteButton eventId={bazaar._id} eventType="bazaar" />
          </Box>

          {/* LOCATION CARD - Dynamically renders based on bazaar.location */}
           <Typography sx={{ fontSize: 32, fontWeight: 700, mb: 3 }}>
              Venue
            </Typography>
          {bazaar.location && (
            <Box sx={{ mb: 6, display: "flex", justifyContent: "center" }}>
              <LocationCard location={bazaar.location} />
            </Box>
          )}

          {/* Fallback Simple Location Display (if location not in LocationCard data) */}
           
          {bazaar.location && !["Green Area", "Admission"].includes(bazaar.location) && (
            <Box
              sx={{
                bgcolor: "white",
                borderRadius: 3,
                p: 3,
                border: "1px solid #e2e8f0",
                mb: 6,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <LocationOnIcon sx={{ color: "#475569", fontSize: 32 }} />
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
                    Location
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                    {bazaar.location}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* REGISTERED VENDORS */}
          <Box sx={{ mt: 6, mb: 10 }}>
            <Typography sx={{ fontSize: 32, fontWeight: 700, mb: 3 }}>
              Registered Vendors
            </Typography>
            <VendorGrid registeredVendors={vendors} />
          </Box>
        </Container>
      </Box>
    </BasicLayout>
  );
}