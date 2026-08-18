"use client";
import React from "react";
import { useState, useEffect } from "react";
import {
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Archive,
  CalendarToday,
  LocationOn,
  AccessTime,
  People,
  AttachMoney,
  School,
  Flight,
  Store,
  Event as EventIcon,
  Storefront,
  Unarchive,
} from "@mui/icons-material";
import axios from "axios";

interface ArchivedEventsButtonProps {
  userRole: string;
  onUnarchive?: () => void;
}

export default function ArchivedEventsButton({
  userRole,
  onUnarchive,
}: ArchivedEventsButtonProps) {
  const [open, setOpen] = useState(false);
  const [archivedEvents, setArchivedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("success");

  // Only show for event-office and admin roles
  const shouldShow = ["event-office", "admin"].includes(userRole);

  if (!shouldShow) return null;

  const fetchArchivedEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "/api/events/archived",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setArchivedEvents(response.data);
    } catch (error) {
      console.error("Failed to fetch archived events:", error);
      setSnackbarMessage("Failed to fetch archived events");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    fetchArchivedEvents();
  };

  const handleClose = () => setOpen(false);

  const eventTypePlural = (et: string) => {
    const map: Record<string, string> = {
      trip: "trips",
      workshop: "workshops",
      bazaar: "bazaars",
      conference: "conferences",
      booth: "booths",
    };
    return map[et] || et;
  };

  const handleUnarchive = async (eventType: string, eventId: string) => {
    try {
      const token = localStorage.getItem("token");
      const pluralType = eventTypePlural(eventType);
      await axios.post(
        `/api/events/${pluralType}/${eventId}/unarchive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Refresh archived events list
      await fetchArchivedEvents();

      // Show success message
      setSnackbarMessage("Event unarchived successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // Notify parent component to refresh
      if (onUnarchive) {
        onUnarchive();
      }
    } catch (error: any) {
      console.error("Failed to unarchive event:", error);
      setSnackbarMessage(error.response?.data?.message || "Failed to unarchive event");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString || "N/A";
  };

  const getEventIcon = (eventType: string) => {
    const icons: Record<string,  React.ReactElement> = {
      workshop: <School />,
      trip: <Flight />,
      bazaar: <Store />,
      conference: <EventIcon />,
      booth: <Storefront />,
    };
    return icons[eventType] || <EventIcon />;
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      trip: "#eabfbfff",
      workshop: "#dbbbe2ff",
      bazaar: "#7d90c2ff",
      conference: "#e1daceff",
      booth: "#ace6d7ff"
    };
    return colors[eventType] || "#757575";
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          color: "primary.main",
          "&:hover": { backgroundColor: "rgba(156, 39, 176, 0.08)" },
        }}
      >
        <Badge badgeContent={archivedEvents.length} color="secondary">
          <Archive />
        </Badge>
      </IconButton>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "90vh",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <Archive sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Archived Events
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and restore archived events
              </Typography>
            </Box>
            <Chip
              label={`${archivedEvents.length} events`}
              color="primary"
              sx={{ ml: "auto" }}
            />
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, minHeight: "60vh" }}>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress />
            </Box>
          )}

          {!loading && archivedEvents.length === 0 && (
            <Box textAlign="center" py={8}>
              <Archive sx={{ fontSize: 80, color: "text.disabled", mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No archived events found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Archived events will appear here when available
              </Typography>
            </Box>
          )}

          {!loading && archivedEvents.length > 0 && (
            <Grid container spacing={3} justifyContent="flex-start">
              {archivedEvents.map((event: any) => {
                const eventTypeColor = getEventTypeColor(event.eventType);
                
                return (
                  <Grid size={{xs: 12, sm: 6, md: 4, lg: 4}} key={event._id}>
                    <Card
                      sx={{
                        width: 360,
                        maxWidth: 360,
                        height: 360,
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.3s",
                        "&:hover": {
                          boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
                          transform: "translateY(-4px)",
                        },
                        overflow: "hidden",
                        position: "relative",
                        background: "white",
                        border: "2px dashed",
                        borderColor: "divider",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: "6px",
                          background: eventTypeColor,
                        },
                      }}
                    >
                      <CardContent
                        sx={{
                          flex: 1,
                          p: 2.5,
                          pb: 2,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        {/* Header with Badge and Icon */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 1.5,
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 0.5 }}>
                              <Chip
                                label={
                                  event.eventType.charAt(0).toUpperCase() +
                                  event.eventType.slice(1)
                                }
                                size="small"
                                sx={{
                                  backgroundColor: `${eventTypeColor}12`,
                                  color: "black",
                                  fontWeight: 600,
                                  fontSize: "0.7rem",
                                  height: 22,
                                  borderRadius: 2,
                                }}
                              />
                              <Chip
                                label="Archived"
                                size="small"
                                sx={{
                                  backgroundColor: "grey.300",
                                  color: "black",
                                  fontWeight: 600,
                                  fontSize: "0.7rem",
                                  height: 22,
                                  borderRadius: 2,
                                }}
                              />
                            </Box>
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              color="#000000"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                fontSize: "1.05rem",
                                lineHeight: 1.3,
                              }}
                            >
                              {event.eventType === "booth"
                                ? event.VendorID?.companyName || "Booth"
                                : event.name}
                            </Typography>
                          </Box>

                          {/* Event Type Icon */}
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: "50%",
                              backgroundColor: eventTypeColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              flexShrink: 0,
                              fontSize: "1.3rem",
                            }}
                          >
                            {getEventIcon(event.eventType)}
                          </Box>
                        </Box>

                        {/* Location */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1.5,
                            p: 1.2,
                            backgroundColor: "grey.50",
                            borderRadius: 2,
                          }}
                        >
                          <LocationOn
                            sx={{
                              fontSize: "1.1rem",
                              color: eventTypeColor,
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="text.primary"
                            fontWeight={500}
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {event.location || "Location not specified"}
                          </Typography>
                        </Box>

                        {/* Event Details */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.8,
                            mb: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <CalendarToday
                              sx={{
                                fontSize: "1rem",
                                color: "text.secondary",
                              }}
                            />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {formatDate(event.start)}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <AccessTime
                              sx={{
                                fontSize: "1rem",
                                color: "text.secondary",
                              }}
                            />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {formatTime(event.time)}
                            </Typography>
                          </Box>

                          {event.capacity && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <People
                                sx={{
                                  fontSize: "1rem",
                                  color: "text.secondary",
                                }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Capacity: {event.capacity}
                              </Typography>
                            </Box>
                          )}

                          {event.price && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <AttachMoney
                                sx={{
                                  fontSize: "1rem",
                                  color: eventTypeColor,
                                }}
                              />
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                color={eventTypeColor}
                              >
                                ${event.price}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Organizer */}
                        {event.ProfCreator && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                backgroundColor: `${eventTypeColor}20`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                color: eventTypeColor,
                              }}
                            >
                              {event.ProfCreator.firstName?.charAt(0) || "?"}
                              {event.ProfCreator.lastName?.charAt(0) || "?"}
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {event.ProfCreator.firstName}{" "}
                              {event.ProfCreator.lastName}
                            </Typography>
                          </Box>
                        )}

                        {/* Spacer */}
                        <Box sx={{ flexGrow: 1 }} />
                      </CardContent>

                      {/* Unarchive Button */}
                      <CardActions sx={{ p: 2.5, pt: 0 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<Unarchive />}
                          onClick={() => handleUnarchive(event.eventType, event._id)}
                          sx={{
                            bgcolor: eventTypeColor,
                            height: 36,
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 3,
                            color: "black",
                            "&:hover": {
                              bgcolor: eventTypeColor,
                              opacity: 0.9,
                            },
                          }}
                        >
                          Unarchive Event
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
