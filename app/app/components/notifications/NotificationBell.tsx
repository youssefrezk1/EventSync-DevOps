"use client";

import { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Badge,
  Popover,
  Typography,
  CircularProgress,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationBellItem from "./NotificationBellItem";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
} from "@/lib/api/notifications";
import { useRouter } from "next/navigation";

interface NotificationBellProps {
  userRole: string;
}

import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export default function NotificationBell({ userRole }: NotificationBellProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  const fetchNotifications = async () => {
  try {
    setLoading(true);
    
    // FIRST: Check and create any pending reminders
    try {
      await axios.get(`${API_BASE_URL}/api/notifications/check-reminders`, getAuthHeaders());
    } catch (err) {
      console.error("Failed to check reminders:", err);
    }
    
    // THEN: Fetch all notifications (including newly created reminders)
    const response = await getNotifications();
    setNotifications(response.data);
    setUnreadCount(response.unreadCount);
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
  } finally {
    setLoading(false);
  }
};

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (!notifications.length) {
      fetchNotifications();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    }

    // Get redirect path
    const redirectPath = getRedirectPath(notification);
    if (redirectPath) {
      handleClose();
      router.push(redirectPath);
    }
  };

  const getRedirectPath = (notification: Notification): string | null => {
    const { type, relatedEntity } = notification;

    // If no related entity, return null
    if (!relatedEntity?.entityId) {
      return null;
    }

    const entityId = relatedEntity.entityId;
    const entityType = relatedEntity.entityType;

    switch (type) {
      case "workshop_request":
        // Event office receives workshop requests
        if (userRole === "event-office") {
          return "/dashboards/eventOffice/workshopRequests";
        }
        return null;

      case "workshop_status":
        // Professor receives workshop acceptance/rejection -> goes to specific workshop
        return `/workshop/${entityId}`;

      case "new_event":
        // Redirect based on event type
        switch (entityType) {
          case "Workshop":
            return `/workshop/${entityId}`;
          case "Bazaar":
            return `/bazaar/${entityId}`;
          case "Trip":
            return `/trip/${entityId}`;
          case "RegisterBooth":
            return userRole === 'event-office' 
    ? `/dashboards/eventOffice/events?type=booths`
    : `/dashboards/${userRole.toLowerCase()}/events?type=booths`;
          case "Confrence":
            return `/conference/${entityId}`;
          default:
            return null;
        }

      case "event_reminder":
        // Same as new_event - redirect to specific event
        switch (entityType) {
          case "Workshop":
            return `/workshop/${entityId}`;
          case "Bazaar":
            return `/bazaar/${entityId}`;
          case "Trip":
            return `/trip/${entityId}`;
          case "RegisterBooth":
            return userRole === 'event-office' 
    ? `/dashboards/eventOffice/events?type=booths`
    : `/dashboards/${userRole.toLowerCase()}/events?type=booths`;
          case "Confrence":
            return `/conference/${entityId}`;
          default:
            return null;
        }

      case "new_partner":
      // ✅ UPDATED: Redirect to loyalty program page based on user role
      const roleMap: Record<string, string> = {
        'student': 'student',
        'Staff': 'staff',
        'TA': 'staff',
        'Professor': 'professor',
      };
      
      const rolePath = roleMap[userRole] || userRole.toLowerCase();
      return `/dashboards/${rolePath}/loyaltyProgram`;

      case "vendor_request":
        // Event office and admin receive vendor requests
        if (userRole === "event-office") {
          return "/dashboards/eventOffice/vendorRequests";
        } else if (userRole === "admin") {
          return "/dashboards/admin/vendorRequests";
        }
        return null;

      default:
        return null;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => {
        const deleted = prev.find((n) => n._id === id);
        if (deleted && !deleted.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n._id !== id);
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const open = Boolean(anchorEl);
  const filteredNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => !n.isRead);

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: "#003d52",
          "&:hover": {
            backgroundColor: "rgba(0, 61, 82, 0.08)",
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 420,
            maxHeight: 600,
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 61, 82, 0.15)",
            overflow: "hidden",
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2.5, borderBottom: "1px solid #F0F2F5" }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: "#0F1724", mb: 2 }}>
            Notifications
          </Typography>

          {/* Filter Chips */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" gap={1}>
              <Box
                onClick={() => setActiveFilter("all")}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "16px",
                  backgroundColor:
                    activeFilter === "all" ? "#E8F0F2" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: activeFilter === "all" ? "#003d52" : "#556779",
                    fontWeight: activeFilter === "all" ? 600 : 500,
                    fontSize: "0.8125rem",
                  }}
                >
                  All
                </Typography>
                <Box
                  sx={{
                    minWidth: "20px",
                    height: "20px",
                    px: 0.75,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "10px",
                    backgroundColor:
                      activeFilter === "all" ? "#003d52" : "#E8EAED",
                    color: activeFilter === "all" ? "#FFFFFF" : "#556779",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                  }}
                >
                  {notifications.length}
                </Box>
              </Box>

              <Box
                onClick={() => setActiveFilter("unread")}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "16px",
                  backgroundColor:
                    activeFilter === "unread" ? "#E8F0F2" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: activeFilter === "unread" ? "#003d52" : "#556779",
                    fontWeight: activeFilter === "unread" ? 600 : 500,
                    fontSize: "0.8125rem",
                  }}
                >
                  Unread
                </Typography>
                <Box
                  sx={{
                    minWidth: "20px",
                    height: "20px",
                    px: 0.75,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "10px",
                    backgroundColor:
                      activeFilter === "unread" ? "#003d52" : "#E8EAED",
                    color: activeFilter === "unread" ? "#FFFFFF" : "#556779",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                  }}
                >
                  {unreadCount}
                </Box>
              </Box>
            </Box>

            {unreadCount > 0 && (
              <Typography
                variant="caption"
                onClick={handleMarkAllAsRead}
                sx={{
                  color: "#003d52",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Mark all as read
              </Typography>
            )}
          </Box>
        </Box>

        {/* Notifications List */}
        <Box
          sx={{
            maxHeight: 480,
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#F8F9FA",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#CBD5E0",
              borderRadius: "3px",
              "&:hover": {
                background: "#A0AEC0",
              },
            },
          }}
        >
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={6}
            >
              <CircularProgress size={32} />
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={6}
              px={3}
            >
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                No notifications
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
                {activeFilter === "unread"
                  ? "You're all caught up!"
                  : "You don't have any notifications yet"}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 1.5 }}>
              {filteredNotifications.map((notification) => (
                <NotificationBellItem
                  key={notification._id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onDelete={handleDelete}
                />
              ))}
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
}