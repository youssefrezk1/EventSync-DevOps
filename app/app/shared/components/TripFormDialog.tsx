"use client";

import React, { ChangeEvent, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  TextField,
  Typography,
  IconButton,
  MenuItem,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ItineraryBuilder from "@/shared/components/ItineraryBuilder";
import CloseIcon from "@mui/icons-material/Close";

const steps = [
  { label: "Basic Information", key: "basic" },
  { label: "Schedule & Itinerary", key: "schedule" },
];

const TRIP_ROLES = ["Student", "TA", "Staff", "Professor"];

interface TripFormDialogProps {
  open: boolean;
  onClose: () => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
  form: any;
  setForm: (f: any) => void;
  isEdit: boolean;
  onSubmit: () => void;
}

interface FieldErrors {
  [key: string]: string;
}

export default function TripFormDialog({
  open,
  onClose,
  activeStep,
  setActiveStep,
  form,
  setForm,
  isEdit,
  onSubmit,
}: TripFormDialogProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRoleToggle = (role: string) => {
    setFormData((prev: any) => {
      const alreadySelected = prev.restrictedTo.includes(role);
      const updatedRestrictedTo = alreadySelected
        ? prev.restrictedTo.filter((r: string) => r !== role)
        : [...prev.restrictedTo, role];
      
      return {
        ...prev,
        restrictedTo: updatedRestrictedTo,
      };
    });

    if (errors.restrictedTo) {
      setErrors(prev => ({ ...prev, restrictedTo: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FieldErrors = {};

    if (step === 0) {
      // Basic Info
      if (!form.name || form.name.trim().length < 3) {
        newErrors.name = "Trip name must be at least 3 characters";
      }
      if (!form.location) newErrors.location = "Location is required";
      if (form.price === "" || form.price === null || form.price === undefined) {
        newErrors.price = "Price is required";
      } else if (isNaN(Number(form.price)) || Number(form.price) < 0) {
        newErrors.price = "Price must be a non-negative number";
      }
      if (!form.shortDescription || form.shortDescription.trim() === "") {
        newErrors.shortDescription = "Short description is required";
      }
      if (!form.capacity || form.capacity < 1) {
        newErrors.capacity = "Capacity must be at least 1";
      } else if (isNaN(Number(form.capacity))) {
        newErrors.capacity = "Capacity must be a valid number";
      }
      if (!form.restrictedTo || form.restrictedTo.length === 0) {
        newErrors.restrictedTo = "Please select at least one group";
      }
    } else if (step === 1) {
      // Schedule
      if (!form.start) newErrors.start = "Start date is required";
      if (!form.end) newErrors.end = "End date is required";
      if (!form.registrationDeadline) newErrors.registrationDeadline = "Registration deadline is required";

      if (form.start && form.end && new Date(form.end) <= new Date(form.start)) {
        newErrors.end = "End date must be after start date";
      }
      if (form.registrationDeadline && form.start && new Date(form.registrationDeadline) > new Date(form.start)) {
        newErrors.registrationDeadline = "Registration deadline must be before start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep < steps.length - 1) setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        setActiveStep(i);
        return;
      }
    }
    
    setLoading(true);
    try {
      await onSubmit();
    } finally {
      setLoading(false);
    }
  };

  // Initialize form data with restrictedTo if not present
  const formData = {
    ...form,
    restrictedTo: form.restrictedTo || []
  };

  const setFormData = (updater: any) => {
    if (typeof updater === 'function') {
      setForm((prev: any) => {
        const updated = updater(prev);
        return updated;
      });
    } else {
      setForm(updater);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent sx={{ display: "flex", height: "100%", p: 0 }}>
        {/* Left Sidebar */}
       {/* Left Sidebar */}
<Box
  sx={{
    width: "320px",
    bgcolor: "#12495cff",
    color: "white",
    p: 4,
    display: "flex",
    flexDirection: "column",
  }}
>
  <Typography 
    variant="h4" 
    fontWeight={700} 
    mb={1.5} 
    sx={{ 
      mt: 3,
      fontSize: "1.75rem",
      letterSpacing: "-0.02em",
      color: "#ffffff"
    }}
  >
    {isEdit ? "Edit Trip" : "Create Your Trip"}
  </Typography>
  <Typography 
    variant="body1" 
    sx={{ 
      opacity: 0.9, 
      mb: 5, 
      fontSize: "0.95rem",
      lineHeight: 1.6,
      color: "#e0f2f1"
    }}
  >
    Follow the steps to set up your trip details and itinerary.
  </Typography>

  <Box sx={{ flex: 1 }}>
    {steps.map((step, index) => (
      <Box key={step.key} sx={{ mb: 3.5, display: "flex", alignItems: "flex-start" }}>
        <Box sx={{ mr: 2.5, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: index <= activeStep ? "#93c7c1" : "rgba(255,255,255,0.12)",
              border: index === activeStep ? "3px solid #ffffff" : "2px solid transparent",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: index <= activeStep ? "#0f7090ff" : "rgba(255,255,255,0.5)",
              transition: "all 0.3s ease",
              boxShadow: index === activeStep ? "0 0 0 4px rgba(255,255,255,0.1)" : "none",
            }}
          >
            {index < activeStep ? (
              <CheckCircleIcon sx={{ color: "#033545ff", fontSize: "1.4rem" }} />
            ) : (
              index + 1
            )}
          </Box>

          {index < steps.length - 1 && (
            <Box 
              sx={{ 
                width: 3, 
                height: 44, 
                bgcolor: index < activeStep ? "#93c7c1" : "rgba(255,255,255,0.15)", 
                mt: 1,
                borderRadius: 1,
                transition: "all 0.3s ease"
              }} 
            />
          )}
        </Box>
        <Box sx={{ flex: 1, pt: 1 }}>
          <Typography
            variant="body1"
            fontWeight={index === activeStep ? 600 : 500}
            sx={{ 
              opacity: index <= activeStep ? 1 : 0.55, 
              fontSize: index === activeStep ? "1rem" : "0.95rem",
              color: index === activeStep ? "#ffffff" : index < activeStep ? "#e0f2f1" : "rgba(255,255,255,0.7)",
              transition: "all 0.3s ease",
              lineHeight: 1.5,
              letterSpacing: "0.01em"
            }}
          >
            {step.label}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>
</Box>

        {/* Right Content */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Close Button */}
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 16,
              top: 16,
              color: "#666",
              zIndex: 1,
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.05)"
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ flex: 1, overflowY: "auto", p: 4 }}>
            {activeStep === 0 && (
              <Box>
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Basic Information
                </Typography>
                <TextField
                  label="Trip Name*"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.name}
                  helperText={errors.name}
                />
                <TextField
                  label="Location*"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.location}
                  helperText={errors.location}
                />
                <TextField
                  label="Price*"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.price}
                  helperText={errors.price}
                  inputProps={{ min: 0 }}
                />
                <TextField
                  label="Short Description*"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  sx={{ mb: 3 }}
                  error={!!errors.shortDescription}
                  helperText={errors.shortDescription}
                />
                <TextField
                  label="Capacity*"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.capacity}
                  helperText={errors.capacity}
                  inputProps={{ min: 1 }}
                />

                {/* Restricted To Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" mb={1.5} fontWeight={500}>
                    Restricted To*
                  </Typography>

                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {TRIP_ROLES.map((role) => (
                      <Box
                        key={role}
                        onClick={() => handleRoleToggle(role)}
                        sx={{
                          flex: "1 1 calc(50% - 8px)",
                          p: 2,
                          border: "2px solid",
                          borderRadius: 1,
                          cursor: "pointer",
                          borderColor: formData.restrictedTo.includes(role) ? "#12495cff" : "#e0e0e0",
                          bgcolor: formData.restrictedTo.includes(role)
                            ? "rgba(18,73,92,0.08)"
                            : "transparent",
                          fontWeight: formData.restrictedTo.includes(role) ? 600 : 400,
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            borderColor: "#12495cff",
                            bgcolor: "rgba(18,73,92,0.04)"
                          }
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={formData.restrictedTo.includes(role) ? 600 : 400}
                          sx={{
                            color: formData.restrictedTo.includes(role) ? "#12495cff" : "inherit",
                            textAlign: "center"
                          }}
                        >
                          {role}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {errors.restrictedTo && (
                    <Typography variant="caption" sx={{ color: "#d32f2f", mt: 1, display: "block" }}>
                      {errors.restrictedTo}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Schedule & Itinerary
                </Typography>
                <TextField
                  label="Start Date & Time*"
                  name="start"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={formData.start}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.start}
                  helperText={errors.start}
                />
                <TextField
                  label="End Date & Time*"
                  name="end"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={formData.end}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.end}
                  helperText={errors.end}
                />
                <TextField
                  label="Registration Deadline*"
                  name="registrationDeadline"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.registrationDeadline}
                  helperText={errors.registrationDeadline}
                />

                {/* Itinerary Builder */}
                <Box sx={{ mt: 4 }}>
                  <ItineraryBuilder
                    startDate={formData.start}
                    endDate={formData.end}
                    initialItinerary={formData.itinerary || []}
                    onChange={(items) => setFormData((prev: any) => ({ ...prev, itinerary: items }))}
                  />
                </Box>
              </Box>
            )}
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", p: 3, borderTop: "1px solid #e0e0e0" }}>
            <Button variant="outlined" onClick={activeStep === 0 ? onClose : handleBack} sx={{ minWidth: 120 }}>
              {activeStep === 0 ? "Cancel" : "Back"}
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={handleNext} sx={{ minWidth: 120 }}>
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                sx={{ minWidth: 160 }}
                disabled={loading}
              >
                {loading
                  ? (isEdit ? "Saving..." : "Creating...")
                  : (isEdit ? "Save Changes" : "Create Trip")}
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}