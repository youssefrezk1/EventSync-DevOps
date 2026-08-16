"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Container,
  Stack,
  Grid,
  Chip,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  useMediaQuery,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/lib/theme";
import {
  CalendarToday,
  LocationOn,
  AccessTime,
  Event,
  Groups,
  School,
  TrendingUp,
  ArrowForward,
  Lightbulb,
  Explore,
  Rocket,
} from "@mui/icons-material";
import Image from "next/image";

function HomeContent() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:900px)");
  const [tabValue, setTabValue] = useState(0);

  // Dynamic tab highlighting based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero-section", "experience-section", "about-section", "cta-section"];
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      // Check if we're at the bottom of the page for the last section
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
      
      if (isAtBottom) {
        setTabValue(sections.length - 1);
        return;
      }

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section && scrollPosition >= section.offsetTop) {
          setTabValue(i);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: <Lightbulb sx={{ fontSize: 50 }} />,
      title: "Innovation & Learning",
      description: "Engage in cutting-edge workshops and educational programs designed to expand your knowledge and skills"
    },
    {
      icon: <Explore sx={{ fontSize: 50 }} />,
      title: "Adventure & Discovery",
      description: "Explore new destinations and cultures through our carefully curated trips and excursions"
    },
    {
      icon: <Rocket sx={{ fontSize: 50 }} />,
      title: "Network & Grow",
      description: "Connect with industry leaders and fellow students at conferences and networking events"
    },
    {
      icon: <Groups sx={{ fontSize: 50 }} />,
      title: "Community Engagement",
      description: "Join vibrant campus communities and participate in diverse cultural and social activities"
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: theme.palette.background.default }}>
      {/* Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar sx={{ py: 1, display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "64px !important" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }} onClick={() => router.push("/")}>
            <Image
              src="/images/logo2.png"
              alt="EventSync Logo"
              width={200}
              height={200}
              style={{ objectFit: "contain" }}
            />
          </Box>

          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1, justifyContent: "center" }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => {
                  setTabValue(newValue);
                  const sections = ["hero-section", "experience-section", "about-section", "cta-section"];
                  const element = document.getElementById(sections[newValue]);
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
                textColor="inherit"
                indicatorColor="secondary"
                sx={{
                  ".MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 500,
                    color: theme.palette.primary.dark,
                    minWidth: "auto",
                    px: 2,
                    py: 1,
                  },
                  ".Mui-selected": {
                    color: theme.palette.secondary.main,
                    fontWeight: 600,
                  },
                  ".MuiTabs-indicator": {
                    height: 3,
                    borderRadius: 3,
                    backgroundColor: theme.palette.secondary.main,
                  },
                }}
              >
                <Tab label="Welcome" />
                <Tab label="Why Choose Us" />
                <Tab label="About Us" />
                <Tab label="Get Started" />
              </Tabs>
            </Box>
          )}

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              sx={{
                color: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 2,
                py: 0.5,
                borderWidth: 2,
                fontSize: "0.875rem",
                "&:hover": {
                  borderWidth: 2,
                  bgcolor: "rgba(0, 61, 82, 0.08)",
                  borderColor: theme.palette.primary.dark,
                },
              }}
              onClick={() => router.push("/dashboards/auth/login")}
            >
              Login
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{
                bgcolor: theme.palette.primary.main,
                color: "#fff",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 2,
                py: 0.5,
                fontSize: "0.875rem",
                "&:hover": {
                  bgcolor: theme.palette.primary.dark,
                },
              }}
              onClick={() => router.push("/dashboards/auth/signup")}
            >
              Sign Up
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        id="hero-section"
        sx={{
          position: "relative",
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          background: `
            linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)),
            url('/images/main2.png')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          overflow: "hidden",
          pt: 2,
          pb: 4,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0.1,
            backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 50%)",
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{xs: 12, md: 6}}>
              <Chip
                label="Feel The Experience"
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  mb: 2,
                  fontWeight: 500,
                  backdropFilter: "blur(10px)",
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                  fontWeight: 800,
                  color: "#fff",
                  mb: 2,
                  lineHeight: 1.2,
                  letterSpacing: "-1px",
                }}
              >
                Discover Campus Events That Inspire
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "rgba(255, 255, 255, 0.9)",
                  mb: 3,
                  lineHeight: 1.7,
                  maxWidth: "90%",
                }}
              >
                Join thousands of students exploring workshops, conferences,
                sports events, and cultural activities. Your next adventure
                starts here.
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  sx={{
                    bgcolor: "#fff",
                    color: theme.palette.primary.main,
                    px: 4,
                    py: 1.5,
                    fontWeight: 700,
                    borderRadius: 3,
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: theme.palette.secondary.light,
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => router.push("/dashboards/auth/signup")}
                >
                  Start Exploring
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: "#fff",
                    color: "#fff",
                    borderWidth: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: 3,
                    textTransform: "none",
                    "&:hover": {
                      borderWidth: 2,
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                  onClick={() => router.push("/dashboards/auth/login")}
                >
                  Sign In
                </Button>
              </Stack>

              <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationOn sx={{ color: theme.palette.secondary.light }} />
                  <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    GUC Campus
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccessTime sx={{ color: theme.palette.secondary.light }} />
                  <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    Year-round events
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarToday sx={{ color: theme.palette.secondary.light }} />
                  <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    Weekly updates
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid size={{xs: 12, md: 6}}>
              <Box
                sx={{
                  position: "relative",
                  height: { xs: 250, md: 400 },
                  borderRadius: 4,
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.light} 100%)`,
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Experience Section */}
      <Box id="experience-section" sx={{ py: 12, bgcolor: theme.palette.background.default, position: "relative", overflow: "hidden" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Chip
              label="Why Choose Us"
              sx={{
                bgcolor: theme.palette.secondary.light,
                color: theme.palette.primary.main,
                mb: 3,
                fontWeight: 600,
                px: 2,
                py: 0.5,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 3,
                fontSize: { xs: "2rem", md: "2.8rem" },
              }}
            >
              Experience The Adventure
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 700, mx: "auto", lineHeight: 1.8, fontSize: "1.1rem" }}
            >
              Unlock extraordinary opportunities and create unforgettable memories through our diverse range of campus experiences
            </Typography>
          </Box>
          
          <Grid container spacing={4} justifyContent="center" sx={{ maxWidth: 1000, mx: "auto" }}>
          
            {features.map((feature, index) => (
              <Grid size={{xs: 12, md: 6}} key={index} display={"flex"}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 4,
                    height: 320,
                    width:480,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 4,
                    border: `2px solid ${theme.palette.primary.light}20`,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: `0 12px 28px ${theme.palette.primary.main}20`,
                      borderColor: theme.palette.secondary.main,
                    },
                  }}
                >
                  
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      background: index % 2 === 0
                        ? `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`
                        : `linear-gradient(135deg, ${theme.palette.secondary.main}20 0%, ${theme.palette.primary.main}20 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 3,
                      transition: "all 0.3s ease",
                      flexShrink: 0,
                      "&:hover": {
                        transform: index % 2 === 0 ? "scale(1.1) rotate(5deg)" : "scale(1.1) rotate(-5deg)",
                      },
                    }}
                  >
                    <Box sx={{ color: index % 2 === 0 ? theme.palette.primary.main : theme.palette.secondary.main }}>
                      {feature.icon}
                    </Box>
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.primary.main,
                      mb: 2,
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, flexGrow: 1 }}>
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
            
          </Grid>
        </Container>
      </Box>

      {/* About Us Section */}
      <Box id="about-section" sx={{ py: 12, bgcolor: theme.palette.background.paper, position: "relative" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip
              label="About EventSync"
              sx={{
                bgcolor: theme.palette.secondary.light,
                color: theme.palette.primary.main,
                mb: 3,
                fontWeight: 600,
                px: 2,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                color: theme.palette.primary.main,
                mb: 4,
                fontSize: { xs: "2rem", md: "2.5rem" },
              }}
            >
              Your Complete University Event Management Platform
            </Typography>
          </Box>
          <Grid container spacing={4} justifyContent="center">
            <Grid size={{xs: 12, md: 10}}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  lineHeight: 2,
                  fontSize: "1.05rem",
                  mb: 3,
                  textAlign: "center",
                }}
              >
                EventSync is the comprehensive event management solution designed specifically for university communities. Our platform seamlessly connects students, staff, professors, teaching assistants, event coordinators, administrators, and vendors in one unified ecosystem.
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  lineHeight: 2,
                  fontSize: "1.05rem",
                  textAlign: "center",
                }}
              >
                Whether you're organizing academic workshops, planning exciting campus trips, hosting professional conferences, setting up vibrant bazaars, managing exhibition booths, or reserving sports fields and gym classes—EventSync streamlines every aspect of campus event management. From creation and reservation to attendance tracking and feedback, we empower every member of the university community to discover, participate in, and create meaningful experiences that enrich campus life.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        id="cta-section"
        sx={{
          py: 10,
          bgcolor: theme.palette.primary.main,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "#fff",
              mb: 2,
            }}
          >
            Ready to Get Started?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255, 255, 255, 0.9)",
              mb: 4,
              lineHeight: 1.8,
            }}
          >
            Join thousands of students already discovering amazing campus
            events and experiences.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: "#fff",
                color: theme.palette.primary.main,
                px: 4,
                py: 1.5,
                fontWeight: 700,
                borderRadius: 3,
                textTransform: "none",
                "&:hover": {
                  bgcolor: theme.palette.secondary.light,
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
              onClick={() => router.push("/dashboards/auth/signup")}
            >
              Create Account
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: "#fff",
                color: "#fff",
                borderWidth: 2,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                borderRadius: 3,
                textTransform: "none",
                "&:hover": {
                  borderWidth: 2,
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                },
              }}
              onClick={() => router.push("/dashboards/auth/login")}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default function Home() {
  return (
    <ThemeProvider theme={theme}>
      <HomeContent />
    </ThemeProvider>
  );
}