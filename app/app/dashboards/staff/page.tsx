"use client";

import {
  Box,
  Typography,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  alpha,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTheme } from "@mui/material/styles";
import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { LocalOffer, EventAvailable } from "@mui/icons-material";
import { Vote } from "lucide-react";
import { useState, useEffect } from "react";
import PollCarouselSection from '@/shared/components/pollCarousel';
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EastIcon from "@mui/icons-material/East";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/staff" },
  {
    text: "Events",
    icon: <EventIcon />,
    href: "/dashboards/staff/events",
  },
  {
    text: "Registered events",
    icon: <EventAvailable />,
    href: "/dashboards/staff/registeredEvents",
  },
  {
    text: "Gym",
    icon: <FitnessCenterIcon />,
    href: "/dashboards/staff/gym",
  },
  {
    text: "Loyalty Program",
    icon: <LocalOffer />,
    href: "/dashboards/staff/loyaltyProgram"
  },
];

const slideshowImages = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&fit=crop",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&fit=crop",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&fit=crop",
  "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1600&fit=crop",
];

const faqs = [
  {
    question: "How do I register for an event?",
    answer:
      "Navigate to the Events page, browse available events, and click the 'Register' button on any event you're interested in attending.",
  },
  {
    question: "Can I access gym facilities?",
    answer:
      "Yes! Staff members have access to campus gym facilities. Visit the Gym page to view schedules, book sessions, and check availability.",
  },
  {
    question: "What are the gym operating hours?",
    answer:
      "The gym is open from 6 AM to 10 PM on weekdays and 8 AM to 8 PM on weekends. Check the Gym page for holiday schedules and special hours.",
  },
  {
    question: "Can I cancel my event registration?",
    answer:
      "Yes, you can cancel your registration up to 24 hours before the event starts from your Registered Events page without any penalties.",
  },
];

// Stats Card Component
const StatCard = ({ value, label, icon, color }: any) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        bgcolor: "white",
        display: "flex",
        alignItems: "center",
        gap: 2,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
        },
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 2,
          bgcolor: alpha(color, 0.08),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={700} color="text.primary">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
};

export default function HomePage() {
  const theme = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  const statistics = [
    {
      value: "500+",
      label: "Staff Members",
      icon: <HomeIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main,
    },
    {
      value: "50+",
      label: "Monthly Events",
      icon: <EventIcon sx={{ fontSize: 28, color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
    },
    {
      value: "24/7",
      label: "Campus Access",
      icon: <FitnessCenterIcon sx={{ fontSize: 28, color: theme.palette.secondary.dark }} />,
      color: theme.palette.secondary.dark,
    },
  ];

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ width: "100%", overflow: "hidden" }}>
        {/* ===== HERO SECTION ===== */}
        <Box
          sx={{
            position: "relative",
            height: "600px",
            overflow: "hidden",
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            mb: 4,
          }}
        >
          {slideshowImages.map((image, index) => (
            <Box
              key={index}
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${image})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                opacity: currentSlide === index ? 1 : 0,
                transition: "opacity 1.5s ease-in-out",
              }}
            />
          ))}

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%)",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              top: "20%",
              left: "10%",
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              background: `${theme.palette.primary.main}20`,
              animation: "float 6s ease-in-out infinite",
              "@keyframes float": {
                "0%, 100%": { transform: "translateY(0px)" },
                "50%": { transform: "translateY(-30px)" },
              },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: "15%",
              right: "15%",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: `${theme.palette.primary.dark}15`,
              animation: "float 8s ease-in-out infinite",
              animationDelay: "1s",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: "40%",
              right: "25%",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: `${theme.palette.primary.main}25`,
              animation: "float 7s ease-in-out infinite",
              animationDelay: "2s",
            }}
          />

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              px: 4,
            }}
          >
            <Typography
              variant="h1"
              sx={{
                color: "white",
                fontWeight: 800,
                textShadow: "3px 3px 8px rgba(0,0,0,0.6)",
                letterSpacing: "2px",
                fontSize: { xs: "3rem", md: "5rem" },
                mb: 3,
              }}
            >
              Your Campus. Your Wellness.
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color: "rgba(255,255,255,0.95)",
                fontWeight: 400,
                textShadow: "2px 2px 6px rgba(0,0,0,0.5)",
                maxWidth: "800px",
                lineHeight: 1.5,
                mb: 4,
              }}
            >
              Empowering GUC staff through fitness, wellness, and enriching campus experiences
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: 2,
              }}
            >
              <Box
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                }}
              >
                500+ Staff Members
              </Box>
              <Box
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                }}
              >
                50+ Events Monthly
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ===== STATISTICS ===== */}
        <Container maxWidth="lg" sx={{ mb: 6 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {statistics.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </Box>
        </Container>

        {/* ===== SCROLLING TEXT ===== */}
        <Box sx={{ py: 4, px: 3, position: "relative", overflow: "hidden" }}>
          <Box
            sx={{
              display: "flex",
              whiteSpace: "nowrap",
              animation: "scroll 30s linear infinite",
              "@keyframes scroll": {
                "0%": { transform: "translateX(0)" },
                "100%": { transform: "translateX(-50%)" },
              },
            }}
          >
            <Typography
              component="span"
              sx={{
                display: "inline-block",
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                fontWeight: 800,
                color: "primary.main",
                px: 3,
              }}
            >
              Supporting Staff Excellence Through Wellness & Engagement.
            </Typography>
            <Typography
              component="span"
              sx={{
                display: "inline-block",
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                fontWeight: 800,
                color: "primary.main",
                px: 4,
              }}
            >
              Supporting Staff Excellence Through Wellness & Engagement.
            </Typography>
          </Box>
        </Box>

        {/* ===== POLL SECTION ===== */}
        <PollCarouselSection />

        {/* ===== LOYALTY PROGRAM SECTION ===== */}
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              bgcolor: alpha(theme.palette.secondary.main, 0.04),
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, flexWrap: "wrap" }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LocalOffer sx={{ fontSize: 36, color: "secondary.dark" }} />
                </Box>
                
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={2} flexWrap="wrap">
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                      GUC Staff Loyalty Program
                    </Typography>
                    <Chip
                      label="EXCLUSIVE DISCOUNTS"
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.secondary.main, 0.2),
                        color: "secondary.dark",
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        height: 22,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                      }}
                    />
                  </Stack>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 3, lineHeight: 1.7 }}
                  >
                    Access exclusive discounts from participating vendors across campus and enjoy special offers designed for GUC staff members.
                  </Typography>

                  <Stack spacing={1.5} mb={3}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CheckCircleOutlineIcon
                        sx={{ fontSize: 18, color: "secondary.dark" }}
                      />
                      <Typography variant="body2" color="text.primary" fontWeight={500}>
                        Exclusive staff member discounts
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CheckCircleOutlineIcon
                        sx={{ fontSize: 18, color: "secondary.dark" }}
                      />
                      <Typography variant="body2" color="text.primary" fontWeight={500}>
                        Multiple participating campus vendors
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CheckCircleOutlineIcon
                        sx={{ fontSize: 18, color: "secondary.dark" }}
                      />
                      <Typography variant="body2" color="text.primary" fontWeight={500}>
                        Easy redemption with promo codes
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    variant="contained"
                    endIcon={<EastIcon />}
                    href="/dashboards/staff/loyaltyProgram"
                    sx={{
                      borderRadius: 2,
                      bgcolor: "secondary.dark",
                      textTransform: "none",
                      fontWeight: 700,
                      "&:hover": { bgcolor: "secondary.main" },
                    }}
                  >
                    View Offers
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Container>

        {/* ===== FAQ ===== */}
        <Container maxWidth="lg" sx={{ py: 6, pb: 8 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              mb: 5,
              textAlign: "center",
            }}
          >
            Frequently Asked Questions
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
              gap: 3,
            }}
          >
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                sx={{
                  background: theme.palette.background.paper,
                  borderRadius: "24px !important",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                  "&:before": { display: "none" },
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.12)}`,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: "primary.main" }} />}
                  sx={{
                    borderRadius: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "primary.main",
                    }}
                  >
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>
    </BasicLayout>
  );
}

