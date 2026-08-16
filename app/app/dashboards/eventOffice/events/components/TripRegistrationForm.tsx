"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { api } from "../../../../../api";

interface TripRegistrationFormProps {
  open: boolean;
  trip: any;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FieldErrors {
  [key: string]: string;
}

const steps = [
  { label: "Trip Details", key: "details" },
  { label: "Schedule", key: "schedule" },
];

export default function TripRegistrationForm({
  open,
  trip,
  onClose,
  onSuccess,
}: TripRegistrationFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    price: "",
    start: "",
    end: "",
    time: "",
    shortDescription: "",
    capacity: "",
    registrationDeadline: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setFormData({
      name: "",
      location: "",
      price: "",
      start: "",
      end: "",
      time: "",
      shortDescription: "",
      capacity: "",
      registrationDeadline: "",
    });
    setErrors({});
    setActiveStep(0);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FieldErrors = {};

    if (step === 0) {
      // Trip Details validation
      if (!formData.name || formData.name.trim() === "") {
        newErrors.name = "Trip name is required";
      }

      if (!formData.location || formData.location.trim() === "") {
        newErrors.location = "Location is required";
      }

      if (!formData.price || formData.price === "") {
        newErrors.price = "Price is required";
      } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
        newErrors.price = "Price must be a non-negative number";
      }

      if (!formData.time || formData.time.trim() === "") {
        newErrors.time = "Time is required";
      }

      if (!formData.shortDescription || formData.shortDescription.trim() === "") {
        newErrors.shortDescription = "Description is required";
      }

      if (!formData.capacity || formData.capacity === "") {
        newErrors.capacity = "Capacity is required";
      } else if (
        isNaN(Number(formData.capacity)) ||
        Number(formData.capacity) < 1 ||
        !Number.isInteger(Number(formData.capacity))
      ) {
        newErrors.capacity = "Capacity must be a positive integer";
      }
    } else if (step === 1) {
      // Schedule validation
      if (!formData.start) {
        newErrors.start = "Start date is required";
      } else if (new Date(formData.start) < new Date()) {
        newErrors.start = "Start date must be in the future";
      }

      if (!formData.end) {
        newErrors.end = "End date is required";
      }

      if (!formData.registrationDeadline) {
        newErrors.registrationDeadline = "Registration deadline is required";
      }

      // Cross-field validations
      if (formData.start && formData.end) {
        if (new Date(formData.end) < new Date(formData.start)) {
          newErrors.end = "End date must be after start date";
        }
      }

      if (formData.registrationDeadline && formData.start) {
        if (new Date(formData.registrationDeadline) > new Date(formData.start)) {
          newErrors.registrationDeadline = "Registration deadline must be before start date";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep < steps.length - 1) {
        setActiveStep(activeStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    // Validate all steps
    const step0Valid = validateStep(0);
    if (!step0Valid) {
      setActiveStep(0);
      return;
    }

    const step1Valid = validateStep(1);
    if (!step1Valid) {
      setActiveStep(1);
      return;
    }

    if (!trip) return;

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        capacity: Number(formData.capacity),
        start: new Date(formData.start).toISOString(),
        end: new Date(formData.end).toISOString(),
        registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
      };

      await api.post(`/api/trips`, payload);

      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Registration failed";
      setErrors({ submit: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: "90vh", maxHeight: "900px" } }}
    >
      <DialogContent sx={{ display: "flex", height: "100%", p: 0 }}>
        {/* Left Sidebar */}
        <Box
          sx={{
            width: "320px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            p: 4,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h5" fontWeight={700} mb={1}>
            Create New Trip
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mb: 4 }}>
            Fill in the details to create an exciting trip for students.
          </Typography>

          <Box sx={{ flex: 1 }}>
            {steps.map((step, index) => (
              <Box key={step.key} sx={{ mb: 3, display: "flex", alignItems: "flex-start" }}>
                <Box sx={{ mr: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor:
                        index <= activeStep ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                      border:
                        index === activeStep ? "2px solid white" : "2px solid transparent",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                    }}
                  >
                    {index < activeStep ? (
                      <CheckCircleIcon sx={{ color: "white" }} />
                    ) : (
                      index + 1
                    )}
                  </Box>
                  {index < steps.length - 1 && (
                    <Box
                      sx={{
                        width: 2,
                        height: 40,
                        bgcolor:
                          index < activeStep
                            ? "rgba(255,255,255,0.5)"
                            : "rgba(255,255,255,0.2)",
                        mt: 1,
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1, pt: 0.5 }}>
                  <Typography
                    variant="body1"
                    fontWeight={index === activeStep ? 600 : 400}
                    sx={{ opacity: index <= activeStep ? 1 : 0.6 }}
                  >
                    {step.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right Content Area */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ flex: 1, overflowY: "auto", p: 4 }}>
            {/* Step Content */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Trip Details
                </Typography>
                <TextField
                  label="Trip Name*"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  placeholder="Enter trip name"
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
                  placeholder="Enter destination"
                  error={!!errors.location}
                  helperText={errors.location}
                />
                <TextField
                  label="Price (EGP)*"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  placeholder="Enter price per person"
                  error={!!errors.price}
                  helperText={errors.price}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <TextField
                  label="Time*"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  placeholder="e.g., 8:00 AM - 6:00 PM"
                  error={!!errors.time}
                  helperText={errors.time}
                />
                <TextField
                  label="Capacity*"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  placeholder="Maximum number of participants"
                  error={!!errors.capacity}
                  helperText={errors.capacity}
                  inputProps={{ min: 1, step: 1 }}
                />
                <TextField
                  label="Description*"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Brief description of the trip"
                  error={!!errors.shortDescription}
                  helperText={errors.shortDescription}
                />
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Schedule
                </Typography>
                <TextField
                  label="Start Date*"
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
                  label="End Date*"
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
                {errors.submit && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "error.light",
                      color: "error.dark",
                      borderRadius: 1,
                      mt: 2,
                    }}
                  >
                    <Typography variant="body2">{errors.submit}</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Navigation Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              p: 3,
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Button
              variant="outlined"
              onClick={activeStep === 0 ? handleClose : handleBack}
              sx={{ minWidth: 120 }}
              disabled={submitting}
            >
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
                sx={{ minWidth: 120 }}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Trip"}
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}