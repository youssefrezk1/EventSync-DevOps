"use client";

import {
  Box,
  Typography,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Stack,
  Button,
} from "@mui/material";
import {
  School,
  CalendarToday,
  LocationOn,
  AccessTime,
  People,
  Close,
} from "@mui/icons-material";

interface EventDetailsDialogProps {
  open: boolean;
  event: any;
  onClose: () => void;
  children?: React.ReactNode;
}

export const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({
  open,
  event,
  onClose,
  children,
}) => {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!event) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "85vh"
        }
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Stack direction="row" spacing={1} mb={1.5}>
              <Chip
                label={event.type}
                color="primary"
                size="small"
                sx={{ fontWeight: 600, fontSize: "0.75rem" }}
              />
              <Chip
                label={event.registrationStatus}
                variant="outlined"
                size="small"
                color={event.registrationStatus === "Upcoming" ? "success" : "default"}
                sx={{ fontWeight: 600, fontSize: "0.75rem" }}
              />
            </Stack>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              {event.name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ ml: 2 }}>
            <Close />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          {/* Event Information */}
          <Box>
            <Typography variant="overline" fontWeight={700} color="primary.main" gutterBottom sx={{ fontSize: "0.7rem" }}>
              Event Information
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Box display="flex" alignItems="top">
                <CalendarToday sx={{ mr: 1.5, color: "primary.main", fontSize: 20 }} />
                <Box display={"flex"} gap={1}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                    DATE:
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDateTime(event.start)}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="top">
                <AccessTime sx={{ mr: 1.5, color: "primary.main", fontSize: 20 }} />
                <Box display={"flex"} gap={1}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                    TIME:
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {event.time}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="top">
                <LocationOn sx={{ mr: 1.5, color: "primary.main", fontSize: 20 }} />
                <Box display={"flex"} gap={1}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                    LOCATION:
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {event.location}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Description */}
          <Box>
            <Typography variant="overline" fontWeight={700} color="primary.main" gutterBottom sx={{ fontSize: "0.7rem" }}>
              Description
            </Typography>
            <Typography 
              variant="body2" 
              color="text.primary" 
              sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap", mt: 1 }}
            >
              {event.shortDescription || "No description available for this event."}
            </Typography>
          </Box>

          {/* Additional Details */}
          {(event.capacity || event.organizer) && (
            <>
              <Divider />
              <Box>
                <Typography variant="overline" fontWeight={700} color="primary.main" gutterBottom sx={{ fontSize: "0.7rem" }}>
                  Additional Details
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {event.capacity && (
                    <Box display="flex" alignItems="center">
                      <People sx={{ mr: 1.5, color: "primary.main", fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                          CAPACITY
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {event.capacity} participants
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {event.organizer && (
                    <Box display="flex" alignItems="center">
                      <School sx={{ mr: 1.5, color: "primary.main", fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                          ORGANIZER
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {event.organizer}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ p: 2.5 }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{ 
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
