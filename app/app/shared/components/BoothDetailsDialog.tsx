"use client";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Avatar,
  Stack,
  IconButton,
} from "@mui/material";
import {
  Close,
  Business,
  LocationOn,
  Storefront,
  Timelapse,
  CalendarToday,
  CheckCircle,
  HourglassEmpty,
  Cancel,
} from "@mui/icons-material";
import { useState } from "react";

interface Vendor {
  _id: string;
  companyName: string;
  email: string;
  logo: Array<{ public_id: string; url: string }>;
  status: string;
}

interface Attendee {
  name: string;
  email: string;
}

interface BoothEvent {
  _id: string;
  VendorID?: Vendor;
  Attendees?: Attendee[];
  SetupDuration?: string;
  Location?: string;
  BoothSize?: string;
  PhotoIDs?: Array<{
    public_id: string;
    url: string;
  }>;
  Pending?: string;
  createdAt?: string;
  updatedAt?: string;
  eventType?: string;
  name?: string;
  location?: string;
  [key: string]: any;
}

interface BoothDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  event: BoothEvent | null;
}

export default function BoothDetailsDialog({
  open,
  onClose,
  event,
}: BoothDetailsDialogProps) {
  if (!event) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Pending: "warning",
      Accept: "success",
      Reject: "error",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      Pending: <HourglassEmpty sx={{ fontSize: "1rem" }} />,
      Accept: <CheckCircle sx={{ fontSize: "1rem" }} />,
      Reject: <Cancel sx={{ fontSize: "1rem" }} />,
    };
    return icons[status as keyof typeof icons] || null;
  };

  // Handle both booth object structure and event object structure
  const vendorInfo = event.VendorID;
  const location = event.Location || event.location || "N/A";
  const boothSize = event.BoothSize || "N/A";
  const setupDuration = event.SetupDuration || "N/A";
  const status = event.Pending || "Pending";

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
          },
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
          animation: "fadeIn 0.3s ease-in-out",
          "@keyframes fadeIn": {
            from: {
              opacity: 0,
              transform: "scale(0.95)",
            },
            to: {
              opacity: 1,
              transform: "scale(1)",
            },
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box flex={1}>
            <Stack direction="row" spacing={1} mb={1.5}>
              <Chip
                label="Booth"
                color="primary"
                size="small"
                sx={{ fontWeight: 600, fontSize: "0.75rem" }}
              />
              <Chip
                icon={getStatusIcon(status)}
                label={status}
                color={getStatusColor(status) as any}
                size="small"
                sx={{ fontWeight: 600, fontSize: "0.75rem" }}
              />
            </Stack>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              {vendorInfo?.companyName || event.name || "Booth Details"}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ ml: 2 }}>
            <Close />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        <Stack spacing={0}>
          {/* Vendor Information Section */}
          {vendorInfo && (
            <Box
              sx={{
                p: 3,
                backgroundColor: "rgba(0, 0, 0, 0.02)",
              }}
            >
              <Typography
                variant="overline"
                fontWeight={700}
                color="primary.main"
                gutterBottom
                sx={{ fontSize: "0.7rem", letterSpacing: 1 }}
              >
                Vendor Information
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Box display="flex" alignItems="center">
                  <Avatar
                    src={vendorInfo.logo?.[0]?.url}
                    alt={vendorInfo.companyName}
                    sx={{
                      width: 64,
                      height: 64,
                      mr: 2,
                      border: "3px solid",
                      borderColor: "primary.main",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Business sx={{ fontSize: "2rem" }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} mb={0.5}>
                      {vendorInfo.companyName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vendorInfo.email}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Booth Details Section */}
          <Box sx={{ p: 3, backgroundColor: "white" }}>
            <Typography
              variant="overline"
              fontWeight={700}
              color="primary.main"
              gutterBottom
              sx={{ fontSize: "0.7rem", letterSpacing: 1 }}
            >
              Booth Details
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box
                display="flex"
                alignItems="center"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "grey.50",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: "grey.100",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    backgroundColor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                  }}
                >
                  <LocationOn sx={{ color: "white", fontSize: 20 }} />
                </Box>
                <Box flex={1}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Location
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {location}
                  </Typography>
                </Box>
              </Box>

              <Box
                display="flex"
                alignItems="center"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "grey.50",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: "grey.100",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    backgroundColor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                  }}
                >
                  <Storefront sx={{ color: "white", fontSize: 20 }} />
                </Box>
                <Box flex={1}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Booth Size
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {boothSize}
                  </Typography>
                </Box>
              </Box>

              {setupDuration && setupDuration !== "N/A" && (
                <Box
                  display="flex"
                  alignItems="center"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "grey.50",
                    transition: "all 0.2s",
                    "&:hover": {
                      backgroundColor: "grey.100",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      backgroundColor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 2,
                    }}
                  >
                    <Timelapse sx={{ color: "white", fontSize: 20 }} />
                  </Box>
                  <Box flex={1}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Setup Duration
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {setupDuration}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box
                display="flex"
                alignItems="center"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "grey.50",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: "grey.100",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    backgroundColor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                  }}
                >
                  <CalendarToday sx={{ color: "white", fontSize: 20 }} />
                </Box>
                <Box flex={1}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Registered
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatDateTime(event.createdAt || "")}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 4,
            py: 1,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}