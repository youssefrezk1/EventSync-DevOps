"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  Stack
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { AccessTime } from "@mui/icons-material";
import axios from "axios";

interface Bazaar {
  _id?: string;
  name: string;
  start: string;
  endDate: string;
  time: string;
  location: string;
  shortDescription: string;
  registrationDeadline: string;
  restrictedTo: string[];
}

interface CreateBazaarFormProps {
  open: boolean;
  onClose: () => void;
  bazaar?: Bazaar;
  onSuccess?: () => void;
}

const steps = [
  { label: "Basic Information", key: "basic" },
  { label: "Schedule", key: "schedule" },
];

const BAZAAR_ROLES = ["Student", "TA", "Staff", "Professor"];

export default function CreateBazaarForm({
  open,
  onClose,
  bazaar,
  onSuccess,
}: CreateBazaarFormProps) {
  const [formData, setFormData] = useState<Bazaar & { timeFrom?: string; timeTo?: string }>({
    name: bazaar?.name || "",
    start: bazaar?.start ? formatDateForInput(bazaar.start) : "",
    endDate: bazaar?.endDate ? formatDateForInput(bazaar.endDate) : "",
    time: bazaar?.time || "",
    timeFrom: "",
    timeTo: "",
    location: bazaar?.location || "",
    shortDescription: bazaar?.shortDescription || "",
    registrationDeadline: bazaar?.registrationDeadline ? formatDateForInput(bazaar.registrationDeadline) : "",
    restrictedTo: bazaar?.restrictedTo || [],
  });
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(bazaar);

  // Helper function to format date for datetime-local input
  function formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Helper function to format date for backend (ISO string)
  function formatDateForBackend(dateTimeString: string): string {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString();
  }

  // Format time from 24h to 12h AM/PM
  const formatTimeTo12Hour = (time24: string) => {
    if (!time24) return '';
    
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Concatenate times for backend
  const getFormattedTimeRange = () => {
    if (!formData.timeFrom || !formData.timeTo) return '';
    return `${formatTimeTo12Hour(formData.timeFrom)} to ${formatTimeTo12Hour(formData.timeTo)}`;
  };

  // Parse existing time string to timeFrom and timeTo
  const parseTimeRange = (timeString: string) => {
    if (!timeString) return { timeFrom: '', timeTo: '' };
    
    // Example: "9:00 AM to 5:00 PM" or "9:00 AM - 5:00 PM"
    const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*(?:to|-)\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    
    if (!match) return { timeFrom: '', timeTo: '' };
    
    const [, fromHour, fromMin, fromPeriod, toHour, toMin, toPeriod] = match;
    
    // Convert to 24h format
    const from24 = convertTo24Hour(fromHour, fromMin, fromPeriod);
    const to24 = convertTo24Hour(toHour, toMin, toPeriod);
    
    return { timeFrom: from24, timeTo: to24 };
  };

  const convertTo24Hour = (hour: string, min: string, period: string) => {
    let h = parseInt(hour, 10);
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${min}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => {
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

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};
    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = "Name required";
      if (!formData.location) newErrors.location = "Location required";
      if (!formData.shortDescription.trim()) newErrors.shortDescription = "Short description required";
      if (!formData.restrictedTo || formData.restrictedTo.length === 0) {
        newErrors.restrictedTo = "Please select at least one group";
      }
    } else if (step === 1) {
      if (!formData.start) newErrors.start = "Start date required";
      if (!formData.endDate) newErrors.endDate = "End date required";
      if (!formData.timeFrom) newErrors.timeFrom = "Start time required";
      if (!formData.timeTo) newErrors.timeTo = "End time required";
      if (!formData.registrationDeadline) newErrors.registrationDeadline = "Deadline required";
      
      if (formData.start && formData.endDate) {
        const startDate = new Date(formData.start);
        const endDate = new Date(formData.endDate);
        if (endDate <= startDate) {
          newErrors.endDate = "End must be after start";
        }
      }
      
      if (formData.timeFrom && formData.timeTo) {
        const [fromHour, fromMin] = formData.timeFrom.split(':').map(Number);
        const [toHour, toMin] = formData.timeTo.split(':').map(Number);
        const fromMinutes = fromHour * 60 + fromMin;
        const toMinutes = toHour * 60 + toMin;
        
        if (toMinutes <= fromMinutes) {
          newErrors.timeTo = "End time must be after start time";
        }
      }
      
      if (formData.registrationDeadline && formData.start) {
        const deadline = new Date(formData.registrationDeadline);
        const start = new Date(formData.start);
        if (deadline > start) {
          newErrors.registrationDeadline = "Deadline must be before start";
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) setActiveStep(prev => prev + 1);
  };
  
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(0)) return setActiveStep(0);
    if (!validateStep(1)) return setActiveStep(1);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Error: No authentication token found. Please log in.');
        setLoading(false);
        return;
      }

      // Get formatted time range
      const timeRange = getFormattedTimeRange();

      // Prepare data for backend with proper date formatting
      const backendData = {
        name: formData.name,
        start: formatDateForBackend(formData.start),
        endDate: formatDateForBackend(formData.endDate),
        time: timeRange, // e.g., "9:00 AM to 5:00 PM"
        location: formData.location,
        shortDescription: formData.shortDescription,
        registrationDeadline: formatDateForBackend(formData.registrationDeadline),
        restrictedTo: formData.restrictedTo
      };

      console.log('Submitting bazaar data:', backendData);

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const baseURL = '/eventOffice/bazaars';

      if (isEditing && bazaar?._id) {
        console.log(`Updating bazaar with ID: ${bazaar._id}`);
        const response = await axios.patch(
          `${baseURL}/${bazaar._id}`,
          backendData,
          config
        );
        console.log('Bazaar updated successfully:', response.data);
        alert('Bazaar updated successfully!');
      } else {
        console.log('Creating new bazaar');
        const response = await axios.post(
          baseURL,
          backendData,
          config
        );
        console.log('Bazaar created successfully:', response.data);
        alert('Bazaar created successfully!');
      }
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      
    } catch (error: any) {
      console.error('Error submitting bazaar:', error);
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.status === 401) {
          alert('Error: Unauthorized. Please check your authentication token.');
        } else if (error.response.status === 403) {
          alert('Error: Forbidden. You do not have permission to perform this action.');
        } else if (error.response.status === 404) {
          alert('Error: Endpoint not found. Please check the API URL.');
        } else if (error.response.status === 409) {
          alert('Error: Duplicate bazaar entry detected.');
        } else if (error.response.status === 400) {
          alert(`Error: ${error.response.data.message || 'Invalid data provided'}`);
        } else {
          alert(`Error: ${error.response.data?.message || error.message || 'An unexpected error occurred'}`);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('Error: No response from server. Please check if the backend is reachable');
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open && bazaar) {
      const { timeFrom, timeTo } = parseTimeRange(bazaar.time);
      setFormData({
        name: bazaar.name || "",
        start: bazaar.start ? formatDateForInput(bazaar.start) : "",
        endDate: bazaar.endDate ? formatDateForInput(bazaar.endDate) : "",
        time: bazaar.time || "",
        timeFrom: timeFrom,
        timeTo: timeTo,
        location: bazaar.location || "",
        shortDescription: bazaar.shortDescription || "",
        registrationDeadline: bazaar.registrationDeadline ? formatDateForInput(bazaar.registrationDeadline) : "",
        restrictedTo: bazaar.restrictedTo || [],
      });
    } else if (!open) {
      setActiveStep(0);
      setErrors({});
      setFormData({
        name: "",
        start: "",
        endDate: "",
        time: "",
        timeFrom: "",
        timeTo: "",
        location: "",
        shortDescription: "",
        registrationDeadline: "",
        restrictedTo: [],
      });
    }
  }, [open, bazaar]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: "90vh" } }}>
      <DialogContent sx={{ display: "flex", height: "100%", p: 0 }}>
        {/* LEFT Sidebar */}
        <Box 
          sx={{ 
            width: 280, 
            bgcolor: "#12495cff", 
            color: "white", 
            p: 4, 
            display: "flex", 
            flexDirection: "column" 
          }}
        >
          <Typography 
            variant="h4" 
            fontWeight={700} 
            mb={1.5} 
            sx={{ 
              fontSize: "1.65rem",
              letterSpacing: "-0.02em",
              color: "#ffffff"
            }}
          >
            {isEditing ? "Edit Bazaar" : "Create Bazaar"}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              opacity: 0.9, 
              mb: 4.5, 
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: "#e0f2f1"
            }}
          >
            Follow the steps to set up your bazaar.
          </Typography>

          <Box sx={{ flex: 1 }}>
            {steps.map((step, index) => (
              <Box 
                key={step.key} 
                sx={{ 
                  mb: 3.5, 
                  display: "flex", 
                  alignItems: "flex-start" 
                }}
              >
                <Box 
                  sx={{ 
                    mr: 2.5, 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center" 
                  }}
                >
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

        {/* RIGHT Content */}
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
                <Typography variant="h5" fontWeight={600} mb={3}>Basic Information</Typography>
                <TextField
                  label="Bazaar Name*"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.name}
                  helperText={errors.name}
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
                  select
                  label="Location*"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.location}
                  helperText={errors.location}
                >
                  <MenuItem value="Admission">Admission</MenuItem>
                  <MenuItem value="Green Area">Green Area</MenuItem>
                </TextField>

                {/* Restricted To Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" mb={1.5} fontWeight={500}>
                    Restricted To*
                  </Typography>

                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {BAZAAR_ROLES.map((role) => (
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
                <Typography variant="h5" fontWeight={600} mb={3}>Schedule</Typography>
                
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
                  name="endDate"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={formData.endDate}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.endDate}
                  helperText={errors.endDate}
                />

                {/* Time Range Selection */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Time Range*
                  </Typography>
                  
                  <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
                        From
                      </Typography>
                      <TextField
                        type="time"
                        fullWidth
                        size="small"
                        name="timeFrom"
                        value={formData.timeFrom}
                        onChange={handleChange}
                        error={!!errors.timeFrom}
                        helperText={errors.timeFrom}
                        InputProps={{
                          startAdornment: (
                            <AccessTime sx={{ mr: 1, color: 'primary.main', fontSize: '1.1rem' }} />
                          ),
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
                        To
                      </Typography>
                      <TextField
                        type="time"
                        fullWidth
                        size="small"
                        name="timeTo"
                        value={formData.timeTo}
                        onChange={handleChange}
                        error={!!errors.timeTo}
                        helperText={errors.timeTo}
                        InputProps={{
                          startAdornment: (
                            <AccessTime sx={{ mr: 1, color: 'primary.main', fontSize: '1.1rem' }} />
                          ),
                        }}
                      />
                    </Box>
                  </Stack>
                  
                  {/* Preview */}
                  {formData.timeFrom && formData.timeTo && !errors.timeTo && (
                    <Box 
                      sx={{ 
                        mt: 2,
                        p: 1.5, 
                        bgcolor: 'primary.50', 
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'primary.200'
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        PREVIEW
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <AccessTime sx={{ fontSize: '0.9rem', color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          {getFormattedTimeRange()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

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
              </Box>
            )}
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", p: 3, borderTop: "1px solid #e0e0e0" }}>
            <Button variant="outlined" onClick={activeStep === 0 ? onClose : handleBack} sx={{ minWidth: 120 }}>
              {activeStep === 0 ? "Cancel" : "Back"}
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={handleNext} sx={{ minWidth: 120 }}>Next</Button>
            ) : (
              <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ minWidth: 160 }}>
                {loading ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Bazaar" : "Create Bazaar"}
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}