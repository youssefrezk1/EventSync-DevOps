"use client";

import {
  ThemeProvider,
  Box,
  Typography,
  Paper,
  Container,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { EventAvailable, TouchApp, Mouse } from "@mui/icons-material";
import { SportsSoccer, SportsFootball, LocalOffer } from "@mui/icons-material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import BasicLayout from "@/components/layouts/basicLayout2";
import CourtsList from "@/shared/components/CourtsList";
import theme from "@/lib/theme";

import { Vote } from "lucide-react";

// 🧭 Sidebar menu
const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/student" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/student/events" },
  {
    text: "Registered events",
    icon: <EventAvailable />,
    href: "/dashboards/student/registeredEvents",
  },
  {
    text: "Courts",
    icon: <SportsSoccer />,
    href: "/dashboards/student/courts",
  },
    {
    text: "Tournaments",
    icon: <FitnessCenterIcon />,
    href: "/dashboards/student/tournaments",
  },
  { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/student/gym" },
  { text: "Loyalty Program", icon: <LocalOffer />, href: "/dashboards/student/loyaltyProgram" },
{ text: "Restaurants", icon: <RestaurantIcon />, href: "/dashboards/student/restaurants" },
];

interface Court {
  _id: string;
  name: string;
  type: "basketball" | "tennis" | "football";
  availableSlots: string[];
}

// 🎨 Court images
const courtImages: Record<string, string> = {
  basketball: "/images/basketball.jpg",
  tennis: "/images/tennis.jpeg",
  football: "/images/football.jpeg",
};

// 🎨 Court color chips
const getCourtColor = (type: string) => {
  const colors: Record<
    string,
    "primary" | "secondary" | "success" | "warning"
  > = {
    basketball: "warning",
    tennis: "secondary",
    football: "success",
  };
  return colors[type] || "primary";
};

export default function CourtsPage() {
  return (
    <BasicLayout menuItems={menuItems}>
      <ThemeProvider theme={theme}>
        {/* Hero Section */}
        <Box
          sx={{
            position: "relative",
            borderRadius: 3,
            overflow: "hidden",
            height: 400,
            mb: 4,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `url('/images/tennis2.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.5)",
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              px: 4,
            }}
          >
            <Typography
              variant="h3"
              fontWeight={700}
              color="white"
              sx={{ mb: 1 }}
            >
              GUC Sports Complex
            </Typography>
            <Typography
              variant="h6"
              color="rgba(255,255,255,0.9)"
              sx={{ mb: 4 }}
            >
              Reserve your court in seconds
            </Typography>


          </Box>
        </Box>

        {/* Instructions Banner */}
        <Container maxWidth="lg" sx={{ mb: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              background: "linear-gradient(135deg, #003d52 0%, #125b73ff 100%)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "white",
                animation: "pulse 2s infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1, transform: "scale(1)" },
                  "50%": { opacity: 0.5, transform: "scale(1.2)" },
                },
              }}
            />
            <Typography
              variant="body1"
              color="white"
              fontWeight={500}
              textAlign="center"
            >
              Interactive map below - Move your mouse over any field on the map
              to preview it
            </Typography>
          </Paper>
        </Container>

        {/* Courts Map Component */}
        <Box sx={{ mt: 2 }}>
          <CourtsList />
        </Box>
      </ThemeProvider>
    </BasicLayout>
  );
}
