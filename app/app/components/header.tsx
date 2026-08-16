"use client";
import { AppBar, Toolbar, Box, IconButton, Badge, Button, Typography } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { usePathname } from "next/navigation";
import { useTheme } from "@mui/material/styles";

export default function Header() {
  const pathname = usePathname();
  const theme = useTheme();

  // 🧭 Determine which dashboard we’re in
  const getDashboardTitle = () => {
    if (!pathname) return "";
    if (pathname.includes("/dashboards/student")) return "Student Dashboard";
    if (pathname.includes("/dashboards/professor")) return "Professor Dashboard";
    if (pathname.includes("/dashboards/vendor")) return "Vendor Dashboard";
    if (pathname.includes("/dashboards/staff")) return "Staff Dashboard";
    if (pathname.includes("/dashboards/eventOffice")) return "Event Office Dashboard";
    if (pathname.includes("/dashboards/admin")) return "Admin Dashboard";
    return "";
  };

  const dashboardTitle = getDashboardTitle();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    window.location.href = "/dashboards/auth/login";
    console.log("User logged out");
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left Section — Logo Text + Dashboard Title */}
        <Box display="flex" alignItems="center" >
          {/* EventSync Logo Text */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              paddingRight:2,
              letterSpacing: 0.5,
              color: theme.palette.warning.main,
              cursor: "pointer",
              "&:hover": {
                opacity: 0.9,
              },
            }}
          >
            EventSync
          </Typography>

          {/* Dashboard Title */}
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.primary.contrastText,
              opacity: 0.9,
              fontWeight: 700,
            }}
          >
            {dashboardTitle}
          </Typography>
        </Box>

        {/* Right Section — Notifications + Logout */}
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Button
            variant="outlined"
            onClick={handleLogout}
            sx={{
              borderColor: theme.palette.primary.contrastText,
              color: theme.palette.primary.contrastText,
              textTransform: "none",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                borderColor: theme.palette.primary.contrastText,
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
