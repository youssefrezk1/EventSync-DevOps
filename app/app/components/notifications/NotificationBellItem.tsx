"use client";

import { Box, Typography, IconButton, Avatar } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsIcon from "@mui/icons-material/Notifications";
import EventIcon from "@mui/icons-material/Event";
import WorkshopIcon from "@mui/icons-material/School";
import PartnerIcon from "@mui/icons-material/Handshake";
import VendorIcon from "@mui/icons-material/Store";
import { Notification } from "@/lib/api/notifications";
import { formatDistanceToNow } from "date-fns";

interface NotificationBellItemProps {
  notification: Notification;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export default function NotificationBellItem({
  notification,
  onClick,
  onDelete,
}: NotificationBellItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "workshop_request":
      case "workshop_status":
        return <WorkshopIcon sx={{ fontSize: 18 }} />;
      case "new_event":
      case "event_reminder":
        return <EventIcon sx={{ fontSize: 18 }} />;
      case "new_partner":
        return <PartnerIcon sx={{ fontSize: 18 }} />;
      case "vendor_request":
        return <VendorIcon sx={{ fontSize: 18 }} />;
      default:
        return <NotificationsIcon sx={{ fontSize: 18 }} />;
    }
  };

  const getAvatarColor = () => {
    switch (notification.type) {
      case "workshop_request":
      case "vendor_request":
        return "#93c7c1ff";
      case "workshop_status":
        return "#CEE5F2";
      case "new_event":
        return "#FFE6B3";
      case "event_reminder":
        return "#FFCDD2";
      case "new_partner":
        return "#F3E5F5";
      default:
        return "#E3F2FD";
    }
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        p: 1.5,
        mb: 1,
        borderRadius: 2,
        cursor: "pointer",
        backgroundColor: notification.isRead ? "transparent" : "#F8FAFB",
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: notification.isRead ? "#F8F9FA" : "#F0F4F6",
          "& .delete-button": {
            opacity: 1,
          },
        },
      }}
    >
      {/* Icon Avatar */}
      <Avatar
        sx={{
          width: 36,
          height: 36,
          backgroundColor: getAvatarColor(),
          color: "#003d52",
          flexShrink: 0,
        }}
      >
        {getIcon()}
      </Avatar>

      {/* Content */}
      <Box flex={1} minWidth={0}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1.5}>
          <Box flex={1} minWidth={0}>
            <Typography
              variant="subtitle2"
              fontWeight={notification.isRead ? 500 : 600}
              sx={{
                mb: 0.25,
                color: "#0F1724",
                fontSize: "0.875rem",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {notification.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 0.5,
                color: "#556779",
                fontSize: "0.8125rem",
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {notification.message}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#8B95A5",
                fontSize: "0.75rem",
              }}
            >
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </Typography>
          </Box>

          {/* Unread Indicator & Delete Button */}
          <Box display="flex" alignItems="center" gap={1}>
            {!notification.isRead && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#003d52",
                  flexShrink: 0,
                  boxShadow: "0 0 0 2px rgba(0, 61, 82, 0.15)",
                }}
              />
            )}
            <IconButton
              className="delete-button"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification._id);
              }}
              sx={{
                opacity: 0,
                transition: "opacity 0.2s ease",
                color: "#556779",
                width: 20,
                height: 20,
                padding: 0,
                "&:hover": {
                  backgroundColor: "rgba(85, 103, 121, 0.08)",
                  color: "#003d52",
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}