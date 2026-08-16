"use client";

import { Box, Typography, Breadcrumbs, Chip } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Home, 
  Event as EventIcon, 
  School,
  NavigateNext 
} from "@mui/icons-material";
import { roleToDashboard } from "@/utils/roleToPath";

interface EventBreadcrumbProps {
  workshopId: string | number;
}

export default function EventBreadcrumb({ workshopId }: EventBreadcrumbProps) {
  const router = useRouter();
  const [dashboardRole, setDashboardRole] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("role");
      if (storedRole) {
        setDashboardRole(roleToDashboard(storedRole));
      }
    }
  }, []);

  if (!dashboardRole) return null;

  const breadcrumbItems = [
    {
      label: "Dashboard",
      icon: <Home sx={{ fontSize: "1.1rem" }} />,
      path: `/dashboards/${dashboardRole}`,
    },
    {
      label: "Events",
      icon: <EventIcon sx={{ fontSize: "1.1rem" }} />,
      path: `/dashboards/${dashboardRole}/events`,
    },
    {
      label: "Workshops",
      icon: <School sx={{ fontSize: "1.1rem" }} />,
      path: `/dashboards/${dashboardRole}/events?type=workshops`,
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
        py: 2.5,
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Left Side - Logo + Breadcrumbs */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
        {/* Logo */}
        <Box
          component="img"
          src="/images/EventSubLogo.png"
          alt="EventSync Logo"
          sx={{
            height: 42,
            cursor: "pointer",
            transition: "transform 0.2s ease, opacity 0.2s ease",
            "&:hover": {
              transform: "scale(1.05)",
              opacity: 0.85,
            },
          }}
          onClick={() => router.push(`/dashboards/${dashboardRole}`)}
        />

        {/* Divider */}
        <Box
          sx={{
            width: 1.5,
            height: 32,
            bgcolor: "divider",
            borderRadius: 1,
          }}
        />

        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={
            <NavigateNext
              sx={{
                fontSize: "1.2rem",
                color: "text.secondary",
                opacity: 0.5,
              }}
            />
          }
          sx={{ "& .MuiBreadcrumbs-separator": { mx: 0.5 } }}
        >
          {breadcrumbItems.map((item, index) => (
            <Box
              key={index}
              onClick={() => router.push(item.path)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                cursor: "pointer",
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "action.hover",
                  transform: "translateY(-1px)",
                  "& .breadcrumb-icon": {
                    color: "primary.main",
                  },
                  "& .breadcrumb-text": {
                    color: "primary.main",
                  },
                },
              }}
            >
              <Box
                className="breadcrumb-icon"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "text.secondary",
                  transition: "color 0.2s ease",
                }}
              >
                {item.icon}
              </Box>
              <Typography
                className="breadcrumb-text"
                sx={{
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  color: "text.primary",
                  transition: "color 0.2s ease",
                  letterSpacing: "0.01em",
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}

          {/* Current Page - Workshop ID */}
          <Chip
            icon={<School sx={{ fontSize: "1rem" }} />}
            label={`Workshop #${workshopId}`}
            size="small"
            sx={{
              height: 32,
              fontWeight: 600,
              fontSize: "0.875rem",
              bgcolor: "primary.main",
              color: "white",
              px: 0.5,
              "& .MuiChip-icon": {
                color: "white",
              },
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          />
        </Breadcrumbs>
      </Box>

      {/* Right Side - Optional Label */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            bgcolor: "grey.100",
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontWeight: 500,
            textTransform: "uppercase",
            fontSize: "0.7rem",
            letterSpacing: "0.05em",
          }}
        >
          Workshop Details
        </Typography>
      </Box>
    </Box>
  );
}