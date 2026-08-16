"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  MenuItem,
  IconButton,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Card,
  CardContent,
  Snackbar,
  Container,
  alpha,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import HomeIcon from "@mui/icons-material/Home";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { FactCheck, Rule, Warning, Info, CheckCircle, Cancel } from "@mui/icons-material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { Storefront } from "@mui/icons-material";

import SelectableMap from "@/shared/components/BoothInteractiveMap";
import BasicLayout from "@/components/layouts/basicLayout2";
import axios from "axios";
import { api } from "@/api";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/vendor" },
  {
    text: "Bazaars",
    icon: <StorefrontIcon />,
    href: "/dashboards/vendor/bazaars",
  },
  {
    text: "Booth Registration",
    icon: <FactCheck />,
    href: "/dashboards/vendor/boothRegistration",
  },
  {
    text: "Request Status",
    icon: <Rule />,
    href: "/dashboards/vendor/requestStatus",
  },
  
  {
    text: "Tournaments",
    icon: <EmojiEventsIcon />,
    href: "/dashboards/vendor/tournaments",
  },
];

interface Attendee {
  name: string;
  email: string;
  photo: File | null;
}

interface AttendeeErrors {
  name: string;
  email: string;
}

export default function BoothRegistrationPage() {
  const theme = useTheme();

  const [attendees, setAttendees] = useState<Attendee[]>([
    { name: "", email: "", photo: null },
  ]);
  const [attendeeErrors, setAttendeeErrors] = useState<AttendeeErrors[]>([
    { name: "", email: "" },
  ]);
  const [duration, setDuration] = useState("");
  const [boothSize, setBoothSize] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [totalPrice, setTotalPrice] = useState<number | null>(null);

  const [locationAvailability, setLocationAvailability] = useState<{
    [key: string]: { available: boolean; checking?: boolean; conflicts?: any[] };
  }>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Calculate total price based on booth size and duration
  useEffect(() => {
    const calculatePrice = async () => {
      if (!boothSize || !duration) {
        setTotalPrice(null);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await api.get("/api/payments/booth-price", {
          params: { boothSize },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          const basePrice = response.data.price;
          const weeks = parseInt(duration);
          const calculatedPrice = basePrice * weeks;
          setTotalPrice(calculatedPrice);
        }
      } catch (error) {
        console.error("Error fetching booth price:", error);
        setTotalPrice(null);
      }
    };

    calculatePrice();
  }, [boothSize, duration]);

  const checkLocationAvailability = async (locationLetter: string) => {
    if (!startDate || !duration) return;

    setLocationAvailability((prev) => ({
      ...prev,
      [locationLetter]: { ...prev[locationLetter], checking: true, available: false },
    }));

    try {
      const numWeeks = parseInt(duration);
      const formattedDuration = numWeeks === 1 ? "1 week" : `${numWeeks} weeks`;

      const res = await api.post("/api/vendorOne/check-booth-availability", {
        Location: locationLetter,
        startDate: startDate,
        SetupDuration: formattedDuration,
      });

      setLocationAvailability((prev) => ({
        ...prev,
        [locationLetter]: {
          available: res.data.available,
          checking: false,
          conflicts: res.data.conflicts || [],
        },
      }));
    } catch (error) {
      console.error(`Error checking availability for ${locationLetter}:`, error);
      setLocationAvailability((prev) => ({
        ...prev,
        [locationLetter]: { available: false, checking: false },
      }));
    }
  };

  useEffect(() => {
    if (startDate && duration) {
      setLocation("");
      const locations = ["A", "B", "C", "D", "E", "F"];
      setCheckingAvailability(true);
      
      Promise.all(locations.map((loc) => checkLocationAvailability(loc)))
        .finally(() => {
          setCheckingAvailability(false);
        });
    } else {
      setLocationAvailability({});
    }
  }, [startDate, duration]);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const validateName = (name: string): string => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (!/^[a-zA-Z\s-]+$/.test(name)) {
      return "Name can only contain letters, spaces, and hyphens";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    return "";
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email format";
    }
    return "";
  };

  const handleAttendeeChange = (
    index: number,
    field: keyof Attendee,
    value: string | File | null
  ) => {
    const updated = [...attendees];
    updated[index][field] = value as any;
    setAttendees(updated);

    if (field === "name" || field === "email") {
      const updatedErrors = [...attendeeErrors];
      if (field === "name") {
        updatedErrors[index].name = validateName(value as string);
      } else if (field === "email") {
        updatedErrors[index].email = validateEmail(value as string);
      }
      setAttendeeErrors(updatedErrors);
    }
  };

  const handleAddAttendee = () => {
    if (attendees.length < 5) {
      setAttendees([...attendees, { name: "", email: "", photo: null }]);
      setAttendeeErrors([...attendeeErrors, { name: "", email: "" }]);
    }
  };

  const handleRemoveAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
    setAttendeeErrors(attendeeErrors.filter((_, i) => i !== index));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleLocationChange = (letter: string | null) => {
    if (letter && locationAvailability[letter]?.available) {
      setLocation(letter || "");
    } else if (letter && !locationAvailability[letter]?.available) {
      setSnackbar({
        open: true,
        message: `Location ${letter} is unavailable for your selected dates`,
        severity: "error",
      });
    } else if (!letter) {
      setLocation("");
    }
  };

  const handleSubmit = async () => {
    let hasErrors = false;
    const finalErrors = attendees.map((attendee) => {
      const nameError = validateName(attendee.name);
      const emailError = validateEmail(attendee.email);
      if (nameError || emailError) hasErrors = true;
      return { name: nameError, email: emailError };
    });

    setAttendeeErrors(finalErrors);

    if (hasErrors) {
      setSnackbar({
        open: true,
        message: "Please fix all validation errors before submitting",
        severity: "error",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setSnackbar({
        open: true,
        message: "You must be logged in to apply",
        severity: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const numWeeks = parseInt(duration);
      const formattedDuration = numWeeks === 1 ? "1 week" : `${numWeeks} weeks`;

      const formData = new FormData();

      const attendeesData = attendees.map((a) => ({
        name: a.name,
        email: a.email,
      }));
      formData.append("Attendees", JSON.stringify(attendeesData));

      formData.append("SetupDuration", formattedDuration);
      formData.append("BoothSize", boothSize);
      formData.append("Location", location);
      formData.append("startDate", startDate);

      attendees.forEach((attendee, index) => {
        if (attendee.photo) {
          formData.append(`photos`, attendee.photo);
        }
      });

      console.log("Submitting with files...");
      console.log("FormData entries:");
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}:`, pair[1]);
      }

      const res = await api.post("/api/vendorOne/apply-for-booth", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSnackbar({
        open: true,
        message: "Booth application submitted successfully!",
        severity: "success",
      });

      setTimeout(() => {
        setAttendees([{ name: "", email: "", photo: null }]);
        setAttendeeErrors([{ name: "", email: "" }]);
        setDuration("");
        setBoothSize("");
        setLocation("");
        setStartDate("");
        setTotalPrice(null);
      }, 1500);

      console.log("Response:", res.data);
    } catch (err: any) {
      console.error("Error submitting booth application:", err);
      console.error("Error details:", err.response?.data);
      const message =
        err.response?.data?.message || "Server error. Please try again later.";
      setSnackbar({
        open: true,
        message: message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      boothSize &&
      duration &&
      startDate &&
      location &&
      attendees.every((a) => a.name && a.email && a.photo) &&
      attendeeErrors.every((e) => !e.name && !e.email)
    );
  };

  const getLocationStatus = (letter: string) => {
    const data = locationAvailability[letter];
    if (!data) return "unknown";
    if (data.checking) return "checking";
    if (data.available) return "available";
    return "unavailable";
  };

  return (
    <BasicLayout menuItems={menuItems}>
      <Box
        sx={{
          p: 1,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* Page Header */}
        <Box
          sx={{
            position: "relative",
            borderRadius: 3,
            overflow: "hidden",
            height: 400,
            mb: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `url('/images/booth.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "brightness(0.4)",
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              px: 2,
            }}
          >
            <Container
              maxWidth="lg"
              sx={{
                position: "relative",
                zIndex: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Box
                  sx={{
                    mt: 4,
                    bgcolor: alpha("#fff", 0.2),
                    backdropFilter: "blur(10px)",
                    p: 1.5,
                    borderRadius: 2,
                    display: "flex",
                  }}
                >
                  <Storefront sx={{ fontSize: 32, color: "white" }} />
                </Box>
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: alpha("#fff", 0.9),
                      fontWeight: 700,
                      letterSpacing: 2,
                      fontSize: "0.75rem",
                    }}
                  >
                    VENDOR OPPORTUNITIES
                  </Typography>
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    color="white"
                    sx={{
                      fontSize: { xs: "2rem", md: "2.5rem" },
                      letterSpacing: "-0.5px",
                    }}
                  >
                    Booth Registration
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: alpha("#fff", 0.95),
                  fontWeight: 400,
                  maxWidth: 600,
                  fontSize: "1.1rem",
                  lineHeight: 1.6,
                }}
              >
                Save your spot exciting to showcase your products and grow your
                business at our premium bazaar events.
              </Typography>
            </Container>
          </Box>
        </Box>

        {/* Booth Details Section */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            mb: 1,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight={600} color="primary.main">
                Booth Details
              </Typography>
              <Typography
                variant="body2"
                color="primary.light"
                sx={{ mt: 0.5 }}
              >
                Select your booth preferences
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box width={"100%"} display={"flex"} flexWrap={"wrap"}>
              {/* Start Date Field */}
              <Box
                width={{ xs: "100%", sm: "33%" }}
                display={"flex"}
                px={1}
                mb={2}
              >
                <TextField
                  label="Start Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: getTodayDate() }}
                  fullWidth
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": {
                        borderColor: "primary.main",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "primary.main",
                    },
                  }}
                />
              </Box>

              {/* Duration */}
              <Box px={1} width={{ xs: "100%", sm: "33%" }} mb={2}>
                <FormControl fullWidth required>
                  <InputLabel
                    sx={{ "&.Mui-focused": { color: "primary.main" } }}
                  >
                    Duration
                  </InputLabel>
                  <Select
                    fullWidth
                    value={duration}
                    label="Duration"
                    onChange={(e) => setDuration(e.target.value)}
                    sx={{
                      borderRadius: 2,
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    {[1, 2, 3, 4].map((week) => (
                      <MenuItem key={week} value={week}>
                        {week} Week{week > 1 ? "s" : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Booth Size */}
              <Box px={1} width={{ xs: "100%", sm: "34%" }} mb={2}>
                <FormControl fullWidth required>
                  <InputLabel
                    sx={{ "&.Mui-focused": { color: "primary.main" } }}
                  >
                    Booth Size
                  </InputLabel>
                  <Select
                    value={boothSize}
                    label="Booth Size"
                    onChange={(e) => setBoothSize(e.target.value)}
                    sx={{
                      borderRadius: 2,
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <MenuItem value="2x2">Small (2x2 meters)</MenuItem>
                    <MenuItem value="4x4">Large (4x4 meters)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Map Section */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            mb: 1,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                mb: 3,
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="h5"
                  fontWeight={600}
                  color={"primary.main"}
                >
                  Location Selection
                </Typography>
                <Typography
                  variant="body2"
                  color="primary.light"
                  sx={{ mt: 0.5 }}
                >
                  {!startDate || !duration
                    ? "Select start date and duration first to see available locations"
                    : checkingAvailability
                    ? "Checking location availability..."
                    : "Click on a highlighted area to select your preferred booth location"}
                </Typography>
              </Box>
              
              {/* Enhanced Legend */}
              {startDate && duration && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    LEGEND:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          bgcolor: "#22C55E",
                          border: "2px solid #16A34A",
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Available
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          bgcolor: "#DC2626",
                          border: "2px solid #B91C1C",
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Occupied
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          bgcolor: "#6B7280",
                          border: "2px solid #4B5563",
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Checking
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Selected Location Display */}
            {location && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "success.light",
                  border: "2px solid",
                  borderColor: "success.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle sx={{ color: "white", fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={600} color="success.dark">
                    Location {location} Selected
                  </Typography>
                  <Typography variant="caption" color="success.dark">
                    This location is available for your selected dates
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Warning if no dates selected */}
            {(!startDate || !duration) && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "secondary.dark",
                  border: "1px solid",
                  borderColor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Warning sx={{ color: "primary.main" }} />
                <Typography variant="body2" color="primary.dark">
                  Please select start date and duration above to check location availability
                </Typography>
              </Box>
            )}

            {/* Enhanced Location Status Overview */}
            {startDate && duration && Object.keys(locationAvailability).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                  Location Status:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {["A", "B", "C", "D", "E", "F"].map((letter) => {
                    const status = getLocationStatus(letter);
                    const getChipProps = () => {
                      switch (status) {
                        case "available":
                          return {
                            icon: <CheckCircle sx={{ fontSize: 16 }} />,
                            color: "success" as const,
                            label: `${letter} - Available`,
                          };
                        case "unavailable":
                          return {
                            icon: <Cancel sx={{ fontSize: 16 }} />,
                            color: "error" as const,
                            label: `${letter} - Occupied`,
                          };
                        case "checking":
                          return {
                            icon: <CircularProgress size={16} />,
                            color: "default" as const,
                            label: `${letter} - Checking...`,
                          };
                        default:
                          return {
                            icon: <Info sx={{ fontSize: 16 }} />,
                            color: "default" as const,
                            label: `${letter} - Unknown`,
                          };
                      }
                    };

                    const chipProps = getChipProps();
                    return (
                      <Tooltip 
                        key={letter} 
                        title={
                          locationAvailability[letter]?.conflicts?.length 
                            ? `Occupied until ${new Date(locationAvailability[letter].conflicts[0].endDate).toLocaleDateString()}`
                            : chipProps.label
                        }
                      >
                        <Chip
                          {...chipProps}
                          size="small"
                          variant={location === letter ? "filled" : "outlined"}
                          sx={{ cursor: status === "available" ? "pointer" : "not-allowed" }}
                          onClick={() => status === "available" && handleLocationChange(letter)}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* Enhanced Map Container */}
            <Box sx={{ 
              width: '100%', 
              height: { xs: '300px', sm: '500px', md: '600px' },
              borderRadius: 2,
              overflow: 'hidden',
              border: `2px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.grey[50],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              {checkingAvailability ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" color="text.secondary">
                    Checking location availability...
                  </Typography>
                </Box>
              ) : (
                <SelectableMap
                  onSelectionChange={handleLocationChange}
                  imageSrc="/images/platform.png"
                  locationAvailability={locationAvailability}
                  canSelect={!!(startDate && duration)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                />
              )}
            </Box>

           
          </CardContent>
        </Card>

        {/* Attendees Section */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            mb: 1,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight={600} color="primary.main">
                  Attendee Information
                </Typography>
                <Typography
                  variant="body2"
                  color="primary.light"
                  sx={{ mt: 0.5 }}
                >
                  Add up to 5 attendees for your booth
                </Typography>
              </Box>
              {attendees.length < 5 && (
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={handleAddAttendee}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    px: 3,
                    boxShadow: 2,
                    bgcolor: "primary.main",
                    "&:hover": { bgcolor: "primary.light" },
                  }}
                >
                  Add Attendee
                </Button>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {attendees.map((person, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: theme.palette.grey[50],
                    border: `1px solid ${theme.palette.grey[200]}`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      color={theme.palette.text.primary}
                    >
                      Attendee {index + 1}
                    </Typography>
                    {attendees.length > 1 && (
                      <IconButton
                        onClick={() => handleRemoveAttendee(index)}
                        size="small"
                        sx={{
                          color: theme.palette.error.main,
                          "&:hover": {
                            backgroundColor: theme.palette.error.light,
                            color: theme.palette.error.dark,
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Grid container spacing={1}>
                    <Grid size={{xs: 12, sm: 4}}>
                      <TextField
                        label="Full Name"
                        placeholder="Enter full name"
                        value={person.name}
                        onChange={(e) =>
                          handleAttendeeChange(index, "name", e.target.value)
                        }
                        fullWidth
                        required
                        variant="outlined"
                        error={!!attendeeErrors[index]?.name}
                        helperText={attendeeErrors[index]?.name}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&.Mui-focused fieldset": {
                              borderColor: "primary.main",
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "primary.main",
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{xs: 12, sm: 4}}>
                      <TextField
                        label="Email Address"
                        placeholder="example@email.com"
                        type="email"
                        value={person.email}
                        onChange={(e) =>
                          handleAttendeeChange(index, "email", e.target.value)
                        }
                        fullWidth
                        required
                        variant="outlined"
                        error={!!attendeeErrors[index]?.email}
                        helperText={attendeeErrors[index]?.email}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            padding: 0,
                            "&.Mui-focused fieldset": {
                              borderColor: "primary.main",
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "primary.main",
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{xs: 12, sm: 4}}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadFileIcon />}
                        fullWidth
                        sx={{
                          height: 56,
                          borderRadius: 2,
                          textTransform: "none",
                          borderWidth: 2,
                          fontWeight: 500,
                          borderColor: "primary.light",
                          color: "primary.light",
                          "&:hover": {
                            borderWidth: 2,
                            borderColor: "primary.light",
                            backgroundColor: "primary.light20",
                          },
                        }}
                      >
                        {person.photo ? "Change" : "Upload ID"}
                        <input
                          hidden
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            handleAttendeeChange(
                              index,
                              "photo",
                              e.target.files ? e.target.files[0] : null
                            )
                          }
                        />
                      </Button>
                    </Grid>

                    {person.photo && (
                      <Grid size={{xs: 12}}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <UploadFileIcon
                            sx={{ color: theme.palette.success.dark }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.success.dark,
                              fontWeight: 500,
                            }}
                          >
                            ✓ {person.photo.name}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Summary Section with Simple Price Display */}
        {isFormValid() && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              mb: 1,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={600} color="primary.main">
                  Application Summary
                </Typography>
                <Typography
                  variant="body2"
                  color="primary.light"
                  sx={{ mt: 0.5 }}
                >
                  Review your booth registration details before submitting
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Booth Details Summary */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="text.primary"
                  sx={{ mb: 2 }}
                >
                  Booth Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: theme.palette.grey[50],
                        border: `1px solid ${theme.palette.grey[200]}`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        Start Date
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {new Date(startDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: theme.palette.grey[50],
                        border: `1px solid ${theme.palette.grey[200]}`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        Duration
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {duration} Week{duration !== "1" ? "s" : ""}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: theme.palette.grey[50],
                        border: `1px solid ${theme.palette.grey[200]}`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        Booth Size
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {boothSize === "2x2" ? "Small (2x2m)" : "Large (4x4m)"}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: theme.palette.grey[50],
                        border: `1px solid ${theme.palette.grey[200]}`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        Location
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        Section {location}
                      </Typography>
                    </Paper>

                  </Grid>
                   {/* Simple Price Display - Just like other summary items */}
                {totalPrice && (
                  
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: theme.palette.grey[50],
                          border: `1px solid ${theme.palette.grey[200]}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Total Price
                        </Typography>
                        <Typography variant="body1" fontWeight={600} color="primary.main">
                          ${totalPrice}
                        </Typography>
                      </Paper>
                    </Grid>
                  
                )}

                </Grid>

               
              </Box>

              {/* Attendees Summary */}
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="text.primary"
                  sx={{ mb: 2 }}
                >
                  Attendees ({attendees.length})
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {attendees.map((person, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: theme.palette.grey[50],
                        border: `1px solid ${theme.palette.grey[200]}`,
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{xs: 12, sm: 1}}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography
                              variant="body1"
                              fontWeight={600}
                              color="white"
                            >
                              {index + 1}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{xs: 12, sm: 4}}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            Name
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {person.name}
                          </Typography>
                        </Grid>
                        <Grid size={{xs: 12, sm: 4}}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            Email
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {person.email}
                          </Typography>
                        </Grid>
                        <Grid size={{xs: 12, sm: 3}}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            ID Document
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <UploadFileIcon
                              sx={{ color: theme.palette.success.dark, fontSize: 18 }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: theme.palette.success.dark,
                                fontWeight: 500,
                              }}
                            >
                              {person.photo?.name}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, pb: 4 }}>
          <Button
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 5,
              py: 1.5,
              fontSize: 16,
              fontWeight: 600,
              boxShadow: 3,
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
              "&:disabled": {
                bgcolor: theme.palette.action.disabledBackground,
              },
            }}
            disabled={loading || !isFormValid()}
            onClick={handleSubmit}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Submit Application"
            )}
          </Button>
        </Box>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </BasicLayout>
  );
}