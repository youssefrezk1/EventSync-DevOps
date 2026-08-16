"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import React, { useState, useEffect } from "react";
import CustomTextField from "@/components/customStyles/customTextField";
import CustomSelect from "@/components/customStyles/customSelect";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import Grid from "@mui/material/Grid";
import { api } from "@/api";

interface ApplyToBazaarDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  bazaarLocation?: string; // Add bazaar location prop
}

interface AttendeeErrors {
  name: string;
  email: string;
}

export default function ApplyToBazaarDialog({
  open,
  onClose,
  onSubmit,
  bazaarLocation,
}: ApplyToBazaarDialogProps) {
  const theme = useTheme();

  const [Attendees, setAttendees] = useState([
    { name: "", email: "", photo: null as File | null },
  ]);
  const [attendeeErrors, setAttendeeErrors] = useState<AttendeeErrors[]>([
    { name: "", email: "" },
  ]);
  const [boothSize, setBoothSize] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState("");

  // Fetch price whenever booth size changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (!boothSize || !bazaarLocation) {
        setPrice(null);
        return;
      }

      setLoadingPrice(true);
      setPriceError("");

      try {
        const response = await api.get("/api/payments/bazaar-price", {
          params: {
            boothSize,
            location: bazaarLocation,
          },
        });

        if (response.data.success) {
          setPrice(response.data.totalPrice);
        }
      } catch (error: any) {
        console.error("Error fetching price:", error);
        setPriceError("Failed to fetch price");
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPrice();
  }, [boothSize, bazaarLocation]);

  // Validate name (letters, spaces only)
  const validateName = (name: string): string => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return "Name can only contain letters and spaces";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    return "";
  };

  // Validate email
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
    field: string,
    value: string | File | null
  ) => {
    const updated = [...Attendees];
    (updated[index] as any)[field] = value;
    setAttendees(updated);

    // Validate on change
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
    if (Attendees.length < 5) {
      setAttendees([...Attendees, { name: "", email: "", photo: null }]);
      setAttendeeErrors([...attendeeErrors, { name: "", email: "" }]);
    }
  };

  const handleRemoveAttendee = (index: number) => {
    const updated = Attendees.filter((_, i) => i !== index);
    setAttendees(updated);
    const updatedErrors = attendeeErrors.filter((_, i) => i !== index);
    setAttendeeErrors(updatedErrors);
  };

  const handleSubmit = () => {
    // Final validation before submit
    let hasErrors = false;
    const finalErrors = Attendees.map((attendee) => {
      const nameError = validateName(attendee.name);
      const emailError = validateEmail(attendee.email);
      if (nameError || emailError) hasErrors = true;
      return { name: nameError, email: emailError };
    });

    setAttendeeErrors(finalErrors);

    if (hasErrors) {
      return;
    }

    const formatted = Attendees.map(({ name, email, photo }) => ({
      name,
      email,
      photoName: photo ? photo.name : null,
    }));

    const PhotoIDs = Attendees.map(({ photo }) => photo);
    onSubmit({ Attendees: formatted, boothSize, PhotoIDs });

    onClose();
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      boothSize &&
      Attendees.every((a) => a.name && a.email && a.photo) &&
      attendeeErrors.every((e) => !e.name && !e.email)
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[10],
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0,0,0,0.15)",
            backdropFilter: "blur(6px)",
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
        Apply for Bazaar
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} mt={1}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ color: theme.palette.text.primary }}
          >
            Attendees (max 5)
          </Typography>

          {Attendees.map((person, index) => (
            <Box
              key={index}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                p: 2,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid size={12}>
                  <CustomTextField
                    label={`Name ${index + 1}`}
                    placeholder="Enter name"
                    value={person.name}
                    onChange={(e) =>
                      handleAttendeeChange(index, "name", e.target.value)
                    }
                    fullWidth
                    size="small"
                    error={!!attendeeErrors[index]?.name}
                    helperText={attendeeErrors[index]?.name}
                  />
                </Grid>
                <Grid size={12}>
                  <CustomTextField
                    label={`Email ${index + 1}`}
                    placeholder="Enter email"
                    value={person.email}
                    onChange={(e) =>
                      handleAttendeeChange(index, "email", e.target.value)
                    }
                    fullWidth
                    size="small"
                    error={!!attendeeErrors[index]?.email}
                    helperText={attendeeErrors[index]?.email}
                  />
                </Grid>

                {/* Upload Photo ID */}
                <Grid size={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    sx={{
                      borderRadius: 3,
                      textTransform: "none",
                      color: theme.palette.primary.main,
                      borderColor: theme.palette.primary.main,
                    }}
                  >
                    {person.photo ? "Change ID Photo" : "Upload ID Photo"}
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

                  {person.photo && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, color: "success.main" }}
                    >
                      Uploaded: {person.photo.name}
                    </Typography>
                  )}
                </Grid>

                {Attendees.length > 1 && (
                  <Grid size={12}>
                    <Button
                      color="error"
                      variant="text"
                      onClick={() => handleRemoveAttendee(index)}
                      sx={{ fontSize: 13 }}
                    >
                      Remove Attendee
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Box>
          ))}

          {Attendees.length < 5 && (
            <Button
              variant="outlined"
              onClick={handleAddAttendee}
              sx={{
                borderRadius: 4,
                textTransform: "none",
                color: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
              }}
            >
              + Add Another Attendee
            </Button>
          )}

          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Booth Size
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="booth-size-label">Select size</InputLabel>
              <CustomSelect
                labelId="booth-size-label"
                value={boothSize}
                label="Booth Size"
                onChange={(e) => setBoothSize(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: theme.palette.background.paper,
                      borderRadius: 3,
                    },
                  },
                }}
              >
                <MenuItem value="2x2">2x2</MenuItem>
                <MenuItem value="4x4">4x4</MenuItem>
              </CustomSelect>
            </FormControl>
          </Box>

          {/* Price Display */}
          {boothSize && (
            <Box
              sx={{
                border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 3,
                p: 2.5,
                backgroundColor: alpha(theme.palette.success.main, 0.05),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    borderRadius: 2,
                    p: 1,
                    display: "flex",
                  }}
                >
                  <AttachMoneyIcon
                    sx={{ color: "success.main", fontSize: 28 }}
                  />
                </Box>
                <Box flex={1}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    display="block"
                    sx={{ mb: 0.3, fontSize: "0.7rem", letterSpacing: 0.5 }}
                  >
                    TOTAL PRICE
                  </Typography>
                  {loadingPrice ? (
                    <CircularProgress size={20} thickness={4} />
                  ) : priceError ? (
                    <Typography variant="body2" color="error" fontWeight={600}>
                      {priceError}
                    </Typography>
                  ) : price !== null ? (
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="success.main"
                    >
                      ${price.toFixed(2)}
                    </Typography>
                  ) : null}
                </Box>
              </Stack>

              {price !== null && !loadingPrice && (
                <Alert
                  severity="info"
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    "& .MuiAlert-icon": {
                      fontSize: 20,
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                    This is the total booth price for size{" "}
                    <strong>{boothSize}</strong>. Payment will be required after
                    your application is approved.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          sx={{
            borderRadius: 4,
            textTransform: "none",
          }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          sx={{
            borderRadius: 4,
            textTransform: "none",
          }}
          onClick={handleSubmit}
          disabled={!isFormValid()}
        >
          Submit Application
        </Button>
      </DialogActions>
    </Dialog>
  );
}
