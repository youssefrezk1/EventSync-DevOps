"use client";

import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Tabs,
  Tab,
  useMediaQuery,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { useState, useEffect } from "react";
import type { TMenuItem } from "@/components/sidebars/sideBar";
import LogoutIcon from "@mui/icons-material/Logout";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import NotificationBell from "@/components/notifications/NotificationBell";
import FavoritesButton from "@/components/favorites/FavoritesButton";
import ArchivedEventsButton from "@/components/archived/ArchivedEventsButton";
import WalletButton from "@/components/WalletButton";
import Image from "next/image";

// Define which items should be in the "Users" dropdown (ONLY for admin)
const usersDropdownItems = [
  { text: "Admins", href: "/dashboards/admin/admins" },
  { text: "Event Office", href: "/dashboards/admin/eventoffice" },
  { text: "All GUC`S Accounts", href: "/dashboards/admin/all-users" },
  { text: "All Vendors", href: "/dashboards/admin/vendors" },
];
// Dropdown items for Event Office
const eventOfficeDropdownItems = [
  { text: "Workshop Requests", href: "/dashboards/eventOffice/workshopRequests" },
  { text: "Vendor Requests", href: "/dashboards/eventOffice/vendorRequests" },
  { text: "Invitation Requests", href: "/dashboards/eventOffice/invitationRequests" },
];

// Items to exclude from main tabs when in Event Office dashboard
const excludeFromEventOfficeTabs = ["Workshop Requests", "Vendor Requests", "Invitation Requests"];
// Items to exclude from main tabs when in admin dashboard
const excludeFromAdminTabs = ["Admins", "Event Office", "All Users", "All Vendors"];

export default function Header({ menuItems }: { menuItems: TMenuItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [value, setValue] = useState(0);
  const [userRole, setUserRole] = useState<string>("");

  // Dropdown state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const dropdownOpen = Boolean(anchorEl);

  // Check if we're in admin dashboard
  const isAdminDashboard = pathname?.includes("/dashboards/admin");
  const isEventOfficeDashboard = pathname?.includes("/dashboards/eventOffice");

  // Check if wallet should be shown (student, staff, professor, vendor)
  const showWallet = 
    userRole === "student" || 
    userRole === "Staff" || 
    userRole === "Professor" ||
    userRole === "TA" ||
    userRole === "vendor";

  // Filter menu items - only apply dropdown logic for admin dashboard
  const filteredMenuItems = isAdminDashboard
    ? menuItems.filter((item) => !excludeFromAdminTabs.includes(item.text))
    : isEventOfficeDashboard
    ? menuItems.filter((item) => !excludeFromEventOfficeTabs.includes(item.text))
    : menuItems;

  // Check if current path is in dropdown items (only for admin and eventoffice)
  const isDropdownItemActive =
    isAdminDashboard &&
    usersDropdownItems.some((item) => pathname === item.href);

  const isEventOfficeDropdownItemActive =
    isEventOfficeDashboard &&
    eventOfficeDropdownItems.some((item) => pathname === item.href);

  const getDashboardTitle = () => {
    if (!pathname) return "";
    if (pathname.includes("/dashboards/student")) return "Student Dashboard";
    if (pathname.includes("/dashboards/professor"))
      return "Professor Dashboard";
    if (pathname.includes("/dashboards/vendor")) return "Vendor Dashboard";
    if (pathname.includes("/dashboards/staff")) return "Staff Dashboard";
    if (pathname.includes("/dashboards/eventOffice"))
      return "Event Office Dashboard";
    if (pathname.includes("/dashboards/admin")) return "Admin Dashboard";
    return "";
  };

  const dashboardTitle = getDashboardTitle();

useEffect(() => {
  const currentIndex = filteredMenuItems.findIndex((item) => {
    // Only match exact dashboard pages
    return pathname === item.href;
  });

  if (currentIndex !== -1) {
    setValue(currentIndex);
  }else if ( isDropdownItemActive|| isEventOfficeDropdownItemActive) {
      setValue(filteredMenuItems.length);} else {
    // If you're in a route like /app/workshop/123 → clear selection
    setValue(false as any);
  }
}, [
  pathname,
  filteredMenuItems,
  isDropdownItemActive,
  isEventOfficeDropdownItemActive,
]);


  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role) {
      setUserRole(role);
    }
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    // If clicking on the dropdown tab (admin only), don't navigate
    if (isAdminDashboard && newValue === filteredMenuItems.length) {
      return;
    }
    setValue(newValue);
    router.push(filteredMenuItems[newValue].href);
  };

  const handleDropdownClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setAnchorEl(null);
  };

  const handleDropdownItemClick = (href: string) => {
    router.push(href);
    handleDropdownClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    window.location.href = "/dashboards/auth/login";
  };

  return (
    <AppBar
      position="fixed"
      elevation={isMobile ? 1 : 3}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              cursor: "pointer",
              "&:hover": { opacity: 0.9 },
              display: "flex",
              alignItems: "center",
            }}
            onClick={() => router.push("/")}
          >
            <Image
              src="/images/logo2.png"
              alt="EventSync Logo"
              width={200}
              height={200}
              style={{ objectFit: "contain" }}
            />
          </Box>

        
        </Box>

        {!isMobile && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tabs
              value={value}
              onChange={handleChange}
              textColor="inherit"
              indicatorColor="secondary"
              sx={{
                ".MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  color: theme.palette.primary.dark,
                  minWidth: "auto",
                  px: 2,
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
              {filteredMenuItems.map((item) => (
                <Tab key={item.text} label={item.text} />
              ))}
              {/* Event Office Requests dropdown */}
              {isEventOfficeDashboard && (
                <Tab
                  label={
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      onClick={handleDropdownClick}
                    >
                      Requests
                      <KeyboardArrowDownIcon
                        sx={{
                          fontSize: 18,
                          transition: "transform 0.2s",
                          transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      />
                    </Box>
                  }
                  sx={{
                    color: isEventOfficeDropdownItemActive
                      ? `${theme.palette.secondary.main} !important`
                      : theme.palette.primary.dark,
                    fontWeight: isEventOfficeDropdownItemActive ? 600 : 500,
                  }}
                />
              )}

              {/* Add Users dropdown tab - ONLY for admin dashboard */}
              {isAdminDashboard && (
                <Tab
                  label={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                      onClick={handleDropdownClick}
                    >
                      Users
                      <KeyboardArrowDownIcon
                        sx={{
                          fontSize: 18,
                          transition: "transform 0.2s",
                          transform: dropdownOpen
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        }}
                      />
                    </Box>
                  }
                  sx={{
                    color: isDropdownItemActive
                      ? `${theme.palette.secondary.main} !important`
                      : theme.palette.primary.dark,
                    fontWeight: isDropdownItemActive ? 600 : 500,
                  }}
                />
              )}
            </Tabs>

            {/* Dropdown Menu - ONLY for admin dashboard */}
            {isAdminDashboard && (
              <Menu
                anchorEl={anchorEl}
                open={dropdownOpen}
                onClose={handleDropdownClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "center",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "center",
                }}
                sx={{
                  "& .MuiPaper-root": {
                    borderRadius: 2,
                    minWidth: 180,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    mt: 1,
                  },
                }}
              >
                {usersDropdownItems.map((item) => (
                  <MenuItem
                    key={item.text}
                    onClick={() => handleDropdownItemClick(item.href)}
                    sx={{
                      fontSize: "0.875rem",
                      py: 1.25,
                      px: 2.5,
                      fontWeight: pathname === item.href ? 600 : 400,
                      color:
                        pathname === item.href
                          ? theme.palette.secondary.main
                          : theme.palette.text.primary,
                      bgcolor:
                        pathname === item.href
                          ? "rgba(147, 199, 193, 0.1)"
                          : "transparent",
                      "&:hover": {
                        bgcolor: "rgba(147, 199, 193, 0.15)",
                      },
                    }}
                  >
                    {item.text}
                  </MenuItem>
                ))}
              </Menu>
            )}
            {/* Event Office dropdown menu */}
            {isEventOfficeDashboard && (
              <Menu
                anchorEl={anchorEl}
                open={dropdownOpen}
                onClose={handleDropdownClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
                sx={{
                  "& .MuiPaper-root": {
                    borderRadius: 2,
                    minWidth: 180,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    mt: 1,
                  },
                }}
              >
                {eventOfficeDropdownItems.map((item) => (
                  <MenuItem
                    key={item.text}
                    onClick={() => handleDropdownItemClick(item.href)}
                    sx={{
                      fontSize: "0.875rem",
                      py: 1.25,
                      px: 2.5,
                      fontWeight: pathname === item.href ? 600 : 400,
                      color:
                        pathname === item.href
                          ? theme.palette.secondary.main
                          : theme.palette.text.primary,
                      bgcolor:
                        pathname === item.href
                          ? "rgba(147, 199, 193, 0.1)"
                          : "transparent",
                      "&:hover": {
                        bgcolor: "rgba(147, 199, 193, 0.15)",
                      },
                    }}
                  >
                    {item.text}
                  </MenuItem>
                ))}
              </Menu>
            )}
          </Box>
        )}

        <Box display="flex" alignItems="center" gap={2}>
          <ArchivedEventsButton userRole={userRole} />
          <FavoritesButton userRole={userRole} />
          <NotificationBell userRole={userRole} />
          
          {/* Wallet button - only for Student, Staff, Professor, TA */}
          {showWallet && <WalletButton />}

          <Button
            variant="contained"
            color="primary"
            onClick={handleLogout}
            sx={{
              gap: 1,
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { backgroundColor: theme.palette.secondary.dark },
            }}
          >
            Logout
            <LogoutIcon />
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}