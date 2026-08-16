"use client";

import React, { useEffect, useState } from "react";
import BasicLayout from "@/components/layouts/basicLayout2";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Paper,
  Chip,
  Avatar,
  Container
} from "@mui/material";

import { api } from "@/api";
import { useRouter } from "next/navigation";

import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import EventAvailable from "@mui/icons-material/EventAvailable";
import SportsFootball from "@mui/icons-material/SportsFootball";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import Storefront from "@mui/icons-material/Storefront";
import RestaurantMenu from "@mui/icons-material/RestaurantMenu";
import CreditCard from "@mui/icons-material/CreditCard";
import QrCode from "@mui/icons-material/QrCode";
import Verified from "@mui/icons-material/Verified";
import ArrowForward from "@mui/icons-material/ArrowForward";

import theme from "@/lib/theme";
import { ThemeProvider } from "@mui/material/styles";

const steps = [
  { icon: <Storefront sx={{ fontSize: 36 }} />, title: "Choose Restaurant", description: "Browse dining options." },
  { icon: <RestaurantMenu sx={{ fontSize: 36 }} />, title: "Pick Items", description: "Select & customize meals." },
  { icon: <CreditCard sx={{ fontSize: 36 }} />, title: "Pay Securely", description: "Make online payment easily." },
  { icon: <QrCode sx={{ fontSize: 36 }} />, title: "Pickup with QR", description: "Use your QR at the counter." },
];

type Restaurant = {
  _id: string;
  name: string;
  email?: string;
  logo?: { url: string }[];
  isVerified?: boolean;
};

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/student" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/student/events" },
  { text: "Registered events", icon: <EventAvailable />, href: "/dashboards/student/registeredEvents" },
  { text: "Courts", icon: <SportsFootball />, href: "/dashboards/student/courts" },
    {
        text: "Tournaments",
        icon: <FitnessCenterIcon />,
        href: "/dashboards/student/tournaments",
      },
  { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/student/gym" },
  { text: "Loyalty Program", href: "/dashboards/student/loyaltyProgram" },
  { text: "Restaurants", href: "/dashboards/student/restaurants" },
];

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchRestaurants(); }, []);

  async function fetchRestaurants() {
    try {
      setLoading(true);
      const res = await api.get("/restraunt/list");
      const data = res.data?.restaurants || res.data?.restraunts || [];
      setRestaurants(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <BasicLayout menuItems={menuItems}>
      <ThemeProvider theme={theme}>

        {/* HERO */}
        <Box
          sx={{
            height: 480,
            mx: 4,
            mt: 2,
            mb: 4,
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 12px 50px rgba(0,0,0,0.25)"
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url('https://images.unsplash.com/photo-1550547660-d9450f859349?w=1600')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.55)",
            }}
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              px: 6
            }}
          >
            <Typography variant="h3" fontWeight={800} color="white" sx={{ mb: 1 }}>
              Campus Dining
            </Typography>
            <Typography variant="h6" color="rgba(255,255,255,0.85)" sx={{ maxWidth: 600 }}>
              Order ahead, skip the line, and enjoy faster service at all your campus restaurants.
            </Typography>
          </Box>
        </Box>

        {/* STEPS */}
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h5" fontWeight={800} color="primary.main">
              How It Works
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Simple, fast, and convenient.
            </Typography>
          </Box>

          <Grid container spacing={2} justifyContent="center">
            {steps.map((step, i) => (
              <Grid size={{xs: 6, sm: 4, md: 3}} key={i}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    textAlign: "center",
                    borderRadius: 3,
                    border: "1px solid rgba(0,0,0,0.07)",
                    transition: "0.3s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 14px 32px rgba(0,0,0,0.15)"
                    }
                  }}
                >
                  <Box sx={{ mb: 1, color: "primary.main" }}>{step.icon}</Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* RESTAURANTS GRID (Banner + Avatar) */}
        <Box sx={{ px: 4, mt: 6, pb: 8 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 1, color: "#1a202c" }}>
              Available Restaurants
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Explore all dining options on campus.
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={4}>
              {restaurants.map((r) => {
                const logoUrl = r.logo?.[0]?.url;
                return (
                  <Grid size={{xs: 12, sm: 12, md: 6, lg: 4}} key={r._id}>
                    <Card
                      onClick={() => router.push(`/dashboards/student/menu?restrauntId=${r._id}`)}
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 5,
                        overflow: "visible",
                        position: "relative",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        cursor: "pointer",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                        "&:hover": {
                          transform: "translateY(-8px)",
                          boxShadow: "0 16px 32px -4px rgba(0, 0, 0, 0.15)",
                          "& .banner-overlay": {
                            opacity: 0.1
                          }
                        }
                      }}
                    >
                      {/* Banner Background */}
                      <Box
                        sx={{
                          height: 140,
                          width: "100%",
                          borderTopLeftRadius: 20,
                          borderTopRightRadius: 20,
                          background: "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)",
                          position: "relative",
                          overflow: "hidden"
                        }}
                      >
                        {/* Decorative Circles in Banner */}
                        <Box sx={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />
                        <Box sx={{ position: "absolute", bottom: -10, left: 10, width: 60, height: 60, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />
                        <Box className="banner-overlay" sx={{ position: "absolute", inset: 0, bgcolor: "white", opacity: 0, transition: "0.3s" }} />
                      </Box>

                      {/* Floating Avatar */}
                      <Box sx={{ px: 2, display: "flex", justifyContent: "center", mt: -7, position: "relative", zIndex: 2 }}>
                        <Avatar
                          src={logoUrl}
                          alt={r.name}
                          sx={{
                            width: 100,
                            height: 100,
                            border: "5px solid white",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            bgcolor: "white",
                            "& img": { objectFit: "contain" }
                          }}
                        />
                      </Box>

                      {/* Content */}
                      <CardContent sx={{ pt: 2, pb: 4, textAlign: "center", flexGrow: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.5 }}>
                          <Typography variant="h5" fontWeight={800} sx={{ color: "#1a202c", lineHeight: 1.2 }}>
                            {r.name}
                          </Typography>
                          {r.isVerified && (
                            <Verified sx={{ fontSize: 20, color: "primary.main" }} />
                          )}
                        </Box>

                        <Typography variant="body1" color="text.secondary" sx={{
                          mb: 3,
                          lineHeight: 1.6,
                          fontSize: "0.95rem",
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          px: 2
                        }}>
                          {r.email || "Experience premium campus dining with a variety of fresh options."}
                        </Typography>

                        <Chip
                          label="View Menu"
                          clickable
                          color="primary"
                          sx={{
                            fontWeight: 700,
                            px: 2,
                            py: 2.5,
                            borderRadius: 3,
                            fontSize: "0.9rem",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </ThemeProvider>
    </BasicLayout>
  );
}
