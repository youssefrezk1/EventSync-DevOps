"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Paper,
  Stack,
  Chip,
  alpha,
  Fade,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EastIcon from "@mui/icons-material/East";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { api } from "@/api";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/restraunt" },
  { text: "Menu", icon: <MenuBookIcon />, href: "/dashboards/restraunt/menu" },
  { text: "Orders", icon: <ReceiptLongIcon />, href: "/dashboards/restraunt/orders" },
];

/**
 * FEATURE CARD COMPONENT
 * Copied and adapted from Vendor Dashboard for consistency
 */
const FeatureCard = ({ icon, title, badge, description, features, href, buttonText }: any) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.08),
        bgcolor: "white",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.12)}`,
          borderColor: theme.palette.primary.light,
          "& .arrow-icon": {
            transform: "translateX(4px)",
          },
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            {icon}
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              {title}
            </Typography>
            <Chip
              label={badge}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: "primary.main",
                fontWeight: 700,
                fontSize: "0.65rem",
                height: 22,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            />
          </Stack>

          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6, mb: 3 }}>
            {description}
          </Typography>
        </Box>

        <Stack spacing={1.5} mb={4}>
          {features.map((feature: string, idx: number) => (
            <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "primary.main" }} />
              <Typography variant="body2" color="text.primary" fontWeight={500}>
                {feature}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Button
          variant="outlined"
          fullWidth
          endIcon={<EastIcon className="arrow-icon" />}
          href={href}
          sx={{
            py: 1.2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            borderWidth: 1.5,
            "&:hover": {
              borderWidth: 1.5,
            },
          }}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

/**
 * STATS CARD COMPONENT
 */
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
        gap: 2.5,
        height: "100%",
        transition: "transform 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(color, 0.3),
        },
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 2.5,
          bgcolor: alpha(color, 0.08),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h3" fontWeight={800} color="text.primary" sx={{ mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
};

export default function RestrauntHome() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  // Stats State
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [menuSize, setMenuSize] = useState(0);
  const [restaurantName, setRestaurantName] = useState("Partner");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Orders to calculate Revenue & Counts
      // Use restaurantGetConfirmedOrders endpoint (status 'Confirmed' + 'Completed')
      const ordersRes = await api.get("/restraunt/orders");
      const orders = ordersRes.data.orders || [];

      let revenue = 0;
      let active = 0;
      let completed = 0;

      orders.forEach((order: any) => {
        if (order.status === "Completed") {
          completed++;
          revenue += (order.price || 0);
        } else if (order.status == "Confirmed") {
          active++;
           revenue += (order.price || 0);
        }
      });
console.log("Fetched Orders:", orders);
console.log("Calculated Revenue:", revenue, "Active Orders:", active, "Completed Orders:", completed);
      setTotalRevenue(revenue);
      setActiveOrders(active);
      setCompletedOrders(completed);

      // 2. Fetch Menu to count items
      const menuRes = await api.get("/restraunt/menu/mine");
      if (menuRes.data && menuRes.data.Menu) {
        setMenuSize(menuRes.data.Menu.FoodItems?.length || 0);
        // Attempt to get restaurant name if available in the menu object, otherwise default
        // The menu object often has a 'Restraunt' field which might be populated or just an ID
        // For now, we'll keep "Partner" generic or try to extract if populated
      } else if (menuRes.data && menuRes.data.menu) {
        // Sometimes it returns { menu: ... } depending on controller
        setMenuSize(menuRes.data.menu.FoodItems?.length || 0);
      }

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      value: `${totalRevenue.toLocaleString()} EGP`,
      label: "Total Revenue",
      icon: <TrendingUpIcon sx={{ fontSize: 32, color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
    },
    {
      value: activeOrders,
      label: "Active Orders",
      icon: <AccessTimeIcon sx={{ fontSize: 32, color: theme.palette.warning.main }} />,
      color: theme.palette.warning.main,
    },
    {
      value: menuSize,
      label: "Menu Items",
      icon: <FastfoodIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main,
    },
  ];

  if (loading) {
    return (
      <BasicLayout menuItems={menuItems}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </BasicLayout>
    )
  }

  return (
    <BasicLayout menuItems={menuItems}>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
          height: { xs: 300, md: 400 },
          mb: 5,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        {/* Background Image */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600')`, // Restaurant ambiance
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.6)",
            zIndex: 1,
          }}
        />

        {/* Gradient Overlay */}
        {/* <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          //   background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.4)} 100%)`,
          //   zIndex: 2,
          // }}
        /> */}

        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 3,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            color: "white",
          }}
        >
          <Chip
            label="RESTAURANT PORTAL"
            sx={{
              bgcolor: alpha("#fff", 0.2),
              backdropFilter: "blur(10px)",
              color: "white",
              fontWeight: 700,
              fontSize: "0.75rem",
              letterSpacing: 2,
              mb: 3,
              alignSelf: "flex-start",
              border: `1px solid ${alpha("#fff", 0.3)}`,
            }}
          />
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{
              fontSize: { xs: "2rem", md: "3.5rem" },
              letterSpacing: "-1px",
              mb: 2,
                color: "white",
              lineHeight: 1.1,
            }}
          >
            Welcome Back, <br />
            {restaurantName}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              maxWidth: 600,
              fontWeight: 400,
              opacity: 0.9,
              color: "white",
              mb: 4,
            }}
          >
            Track your sales, manage incoming orders, and update your menu all from your command center.
          </Typography>
        </Container>
      </Box>

      {/* Stats Grid */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid size={{xs: 12, md: 4}} key={index}>
              <Fade in timeout={500 + (index * 200)}>
                <Box>
                  <StatCard {...stat} />
                </Box>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>


      {/* Quick Actions / Features */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={4}>
          <Grid size={{xs: 12, md: 6}}>
            <FeatureCard
              icon={<ReceiptLongIcon sx={{ fontSize: 30, color: "primary.main" }} />}
              title="Manage Orders"
              badge="HIGH PRIORITY"
              description="View incoming orders."
              features={["Real-time order tracking", "Status updates", "Order history"]}
              href="/dashboards/restraunt/orders"
              buttonText="Go to Orders"
            />
          </Grid>
          <Grid size={{xs: 12, md: 6}}>
            <FeatureCard
              icon={<MenuBookIcon sx={{ fontSize: 30, color: "primary.main" }} />}
              title="Update Menu"
              badge="ESSENTIAL"
              description="Keep your menu fresh and up to date."
              features={["Add/Edit items", "Manage availability", "Set images & prices"]}
              href="/dashboards/restraunt/menu"
              buttonText="Edit Menu"
            />
          </Grid>
        </Grid>
      </Container>
    </BasicLayout>
  );
}
