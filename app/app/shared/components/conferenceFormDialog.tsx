"use client";

import React, { ChangeEvent, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import AgendaBuilder from "./AgendaBuilder2";

const steps = [
  { label: "Basic Information", key: "basic" },
  { label: "Schedule & Funding", key: "schedule" },
  { label: "Details & Agenda", key: "details" },
];

interface ConferenceFormDialogProps {
  open: boolean;
  onClose: () => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
  form: any;
  setForm: (f: any) => void;
  isEdit: boolean;
  onSubmit: () => void;
  loading?: boolean;
  error?: string;
  facultyOptions?: string[];
}

interface FieldErrors {
  [key: string]: string;
}

export default function ConferenceFormDialog({
  open,
  onClose,
  activeStep,
  setActiveStep,
  form,
  setForm,
  isEdit,
  onSubmit,
}: ConferenceFormDialogProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [internalLoading, setInternalLoading] = useState(false);

  const TRIP_ROLES = ["Student", "TA", "Staff", "Professor"];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle time concatenation
    if (name === "timeFrom" || name === "timeTo") {
      setForm((prev: any) => {
        const newForm = { ...prev, [name]: value };
        // Concatenate timeFrom and timeTo into time field with AM/PM
        if (newForm.timeFrom && newForm.timeTo) {
          const formatTimeWithPeriod = (time: string) => {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes} ${period}`;
          };
          
          newForm.time = `${formatTimeWithPeriod(newForm.timeFrom)} - ${formatTimeWithPeriod(newForm.timeTo)}`;
        }
        return newForm;
      });
    } else {
      setForm((prev: any) => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAgendaChange = (agendaJson: string) => {
    setForm((prev: any) => ({ ...prev, fullAgenda: agendaJson }));
    if (errors.fullAgenda) {
      setErrors((prev) => ({ ...prev, fullAgenda: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FieldErrors = {};

    if (step === 0) {
      if (!form.name || form.name.trim().length < 3) {
        newErrors.name = "Conference name must be at least 3 characters long";
      }

      if (!form.shortDescription || form.shortDescription.trim() === "") {
        newErrors.shortDescription = "Short description is required";
      }

      if (!form.conferenceWebsiteLink || form.conferenceWebsiteLink.trim() === "") {
        newErrors.conferenceWebsiteLink = "Conference website link is required";
      }

      if (!form.restrictedTo || form.restrictedTo.length === 0)
        newErrors.restrictedTo = "Please select at least one group";
    }

    if (step === 1) {
      if (!form.start) newErrors.start = "Start date is required";
      if (!form.endDate) newErrors.endDate = "End date is required";

      if (form.start && form.endDate) {
        if (new Date(form.endDate) <= new Date(form.start)) {
          newErrors.endDate = "End date must be after start date";
        }
      }

      if (!form.timeFrom || !form.timeTo) {
        newErrors.time = "Both start and end times are required";
      }

      if (!form.sourceOfFunding) newErrors.sourceOfFunding = "Funding source is required";

      if (
        form.requiredBudget === "" ||
        form.requiredBudget === null ||
        isNaN(Number(form.requiredBudget)) ||
        Number(form.requiredBudget) < 0
      ) {
        newErrors.requiredBudget = "Budget must be a non-negative number";
      }
    }

    if (step === 2) {
      if (!form.fullAgenda || form.fullAgenda.trim() === "") {
        newErrors.fullAgenda = "Full agenda is required";
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
    const step0Valid = validateStep(0);
    if (!step0Valid) return setActiveStep(0);

    const step1Valid = validateStep(1);
    if (!step1Valid) return setActiveStep(1);

    const step2Valid = validateStep(2);
    if (!step2Valid) return setActiveStep(2);

    setInternalLoading(true);
    try {
      await onSubmit();
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: "90vh", maxHeight: "900px" } }}
    >
      <DialogContent sx={{ display: "flex", height: "100%", p: 0 }}>
      {/* Sidebar */}
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
    {isEdit ? "Edit Conference" : "Create Conference"}
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
    Follow the steps to set up your conference details.
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
              color: index <= activeStep ? "#0f7090ff" : "rgba(255,255,255,0.5)",
              fontWeight: 700,
              fontSize: "1.1rem",
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

        {/* Right Form */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
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
            {/* STEP 0 */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Basic Information
                </Typography>

                <TextField
                  label="Conference Name*"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.name}
                  helperText={errors.name}
                />

                <TextField
                  label="Short Description*"
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  sx={{ mb: 3 }}
                  error={!!errors.shortDescription}
                  helperText={errors.shortDescription}
                />

                <TextField
                  label="Conference Website*"
                  name="conferenceWebsiteLink"
                  value={form.conferenceWebsiteLink}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.conferenceWebsiteLink}
                  helperText={errors.conferenceWebsiteLink}
                />

                {/* TRIP ROLES BUTTONS */}
                <Box>
                  <Typography variant="body1" mb={1.5} fontWeight={500}>
                    Restricted To*
                  </Typography>

                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {TRIP_ROLES.map((role) => (
                      <Box
                        key={role}
                        onClick={() => {
                          setForm((prev: any) => {
                            const alreadySelected = prev.restrictedTo.includes(role);

                            return {
                              ...prev,
                              restrictedTo: alreadySelected
                                ? prev.restrictedTo.filter((r: string) => r !== role)
                                : [...prev.restrictedTo, role],
                            };
                          });

                          if (errors.restrictedTo) {
                            setErrors((prev) => ({ ...prev, restrictedTo: "" }));
                          }
                        }}
                        sx={{
                          flex: "1 1 calc(50% - 8px)",
                          p: 2,
                          border: "2px solid",
                          borderRadius: 1,
                          cursor: "pointer",
                          borderColor: form.restrictedTo.includes(role) ? "#12495cff" : "#e0e0e0",
                          bgcolor: form.restrictedTo.includes(role)
                            ? "rgba(18,73,92,0.08)"
                            : "transparent",
                          fontWeight: form.restrictedTo.includes(role) ? 600 : 400,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={form.restrictedTo.includes(role) ? 600 : 400}
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

            {/* STEP 1 */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Schedule & Funding
                </Typography>

                <TextField
                  label="Start Date*"
                  name="start"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={form.start}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.start}
                  helperText={errors.start}
                />

                <TextField
                  label="End Date*"
                  name="endDate"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={form.endDate}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.endDate}
                  helperText={errors.endDate}
                />

                <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
                  <TextField
                    label="From*"
                    name="timeFrom"
                    type="time"
                    InputLabelProps={{ shrink: true }}
                    value={form.timeFrom || ""}
                    onChange={handleChange}
                    sx={{ flex: 1 }}
                    error={!!errors.time}
                  />
                  <Typography variant="body2" sx={{ px: 1 }}>to</Typography>
                  <TextField
                    label="To*"
                    name="timeTo"
                    type="time"
                    InputLabelProps={{ shrink: true }}
                    value={form.timeTo || ""}
                    onChange={handleChange}
                    sx={{ flex: 1 }}
                    error={!!errors.time}
                    helperText={errors.time}
                  />
                </Box>

                <TextField
                  select
                  label="Funding Source*"
                  name="sourceOfFunding"
                  value={form.sourceOfFunding}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.sourceOfFunding}
                  helperText={errors.sourceOfFunding}
                >
                  <MenuItem value="">Select...</MenuItem>
                  <MenuItem value="GUC">GUC</MenuItem>
                  <MenuItem value="external">External</MenuItem>
                </TextField>

                <TextField
                  label="Required Budget*"
                  name="requiredBudget"
                  type="number"
                  value={form.requiredBudget}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.requiredBudget}
                  helperText={errors.requiredBudget}
                />
              </Box>
            )}

            {/* STEP 2 */}
            {activeStep === 2 && (
              <Box>
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Details & Agenda
                </Typography>

                {!form.start || !form.endDate ? (
                  <Box sx={{ p: 3, bgcolor: "#fff3cd", border: "1px solid #ffc107", borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: "#856404" }}>
                      ⚠️ Please set start and end dates first.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "left" }}>
                    <AgendaBuilder
                      startDateTime={form.start}
                      endDateTime={form.endDate}
                      initialAgenda={form.fullAgenda}
                      onChange={handleAgendaChange}
                    />
                  </Box>
                )}

                <TextField
                  label="Extra Required Resources"
                  name="extraRequiredResources"
                  value={form.extraRequiredResources}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  sx={{ mt: 3 }}
                />
              </Box>
            )}
          </Box>

          {/* Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              p: 3,
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Box>
              {activeStep === 0 ? (
                <Button onClick={onClose} variant="outlined">
                  Cancel
                </Button>
              ) : (
                <Button onClick={handleBack}>
                  Back
                </Button>
              )}
            </Box>

            <Box>
              {activeStep < 2 ? (
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                  sx={{
                    minWidth: 120,
                    bgcolor: "#0b529dff",
                    "&:hover": { bgcolor: "#1d508fff" }
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={internalLoading}
                  sx={{ 
                    bgcolor: "#12495cff",
                    "&:hover": { bgcolor: "#0f3d4d" }
                  }}
                >
                  {internalLoading ? "Submitting..." : isEdit ? "Save Changes" : "Create Conference"}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
