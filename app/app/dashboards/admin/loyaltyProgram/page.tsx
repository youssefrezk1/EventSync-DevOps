"use client";

import {
  ThemeProvider,
  Box,
  Typography,
  Paper,
  Container,
  Button,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { EventAvailable, LocalOffer } from "@mui/icons-material";
import WorkIcon from "@mui/icons-material/Work";
import BasicLayout from "@/components/layouts/basicLayout2";
import LoyaltyPartnersView from "../../../shared/components/WIR";
import theme from "@/lib/theme";
import { Vote, RefreshCw } from "lucide-react";
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart";

// 🧭 Sidebar menu with Loyalty Program tab
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

export default function LoyaltyProgramPage() {
  return (
    <BasicLayout menuItems={menuItems}>
      <ThemeProvider theme={theme}>
        <Box sx={{ minHeight: "100vh", mt: 0, pt: 0 }}>
          {/* Hero Section */}
          <Box
            sx={{
              position: "relative",
              background:
                "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('/images/wir3.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              minHeight: "320px",
              display: "flex",
              alignItems: "center",
              mb: 4,
              borderRadius: 3,
              overflow: "hidden",
              mt: 0,
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
            <Box sx={{ position: "relative", zIndex: 1, px: 4, width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
            <Typography
  variant="h3"
  sx={{
    color: "white",
    fontWeight: 700,
    mb: 2,
    fontSize: { xs: "2rem", md: "2.5rem" },
  }}
>
  🎫 GUC Loyalty Program
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
                Exclusive discounts and offers for GUC students
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw size={18} />}
                  onClick={() => window.location.reload()}
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

          {/* Instructions Banner */}
          <Box sx={{ px: 4, mb: 3 }}>
            <Container maxWidth="lg" disableGutters>
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
          </Box>

{/* Loyalty Partners Content */}
<Box sx={{ mt: 2 }}>
  <Box sx={{ borderRadius: 3, overflow: "hidden" }}>
    <LoyaltyPartnersView />
  </Box>
</Box>
        </Box>
      </ThemeProvider>
    </BasicLayout>
  );
}