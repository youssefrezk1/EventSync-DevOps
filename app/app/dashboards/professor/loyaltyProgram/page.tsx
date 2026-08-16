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
import { EventAvailable, LocalOffer } from "@mui/icons-material";
import WorkIcon from "@mui/icons-material/Work";
import BasicLayout from "@/components/layouts/basicLayout2";
import LoyaltyPartnersView from "../../../shared/components/WIR";
import theme from "@/lib/theme";
import { Vote } from "lucide-react";

// 🧭 Sidebar menu with Loyalty Program tab
const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/professor" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/professor/events" },
  { text: "Registered events", icon: <EventAvailable />, href: "/dashboards/professor/registeredEvents" },
  { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/professor/gym" },
  { text: "Workshops", icon: <WorkIcon />, href: "/dashboards/professor/workshops" },
   {text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/professor/loyaltyProgram"},
];
 


export default function LoyaltyProgramPage() {
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
              backgroundImage: `url('/images/wir3.jpg')`,
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
            <Typography variant="h3" fontWeight={700} color="rgba(251, 251, 251, 0.9)" sx={{ mb: 1 }}>
              GUC Loyalty Program
            </Typography>
            <Typography variant="h6" color="rgba(252, 252, 252, 0.9)">
              Exclusive discounts and offers for GUC students
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
              Discover amazing discounts from our partner businesses below
            </Typography>
          </Paper>
        </Container>

        {/* Loyalty Partners Content */}
        <Box sx={{ mt: 2 }}>
          <LoyaltyPartnersView />
        </Box>
      </ThemeProvider>
    </BasicLayout>
  );
}