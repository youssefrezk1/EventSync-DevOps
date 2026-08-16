"use client";

import React, { ChangeEvent, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  MenuItem,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import AgendaBuilder from "@/shared/components/AgendaBuilder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

const facultyOptions = [
  "MGT",
  "BI",
  "MET",
  "IET",
  "EMS",
  "CIVIL",
  "ARCH",
  "AA",
  "PH/BIO",
  "LAW",
];

const steps = [
  { label: "Basic Information", key: "basic" },
  { label: "Details & Resources", key: "details" },
  { label: "Schedule & Agenda", key: "agenda" },
];

interface WorkshopFormDialogProps {
  open: boolean;
  onClose: () => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
  form: any;
  setForm: (f: any) => void;
  isEdit: boolean;
  onSubmit: () => void;
  professorsList?: any[];
  facultyOptions?: string[];
}

interface FieldErrors {
  [key: string]: string;
}

export default function WorkshopFormDialog({
  open,
  onClose,
  activeStep,
  setActiveStep,
  form,
  setForm,
  isEdit,
  onSubmit,
}: WorkshopFormDialogProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [professorInput, setProfessorInput] = useState("");
  const [loading, setLoading] = useState(false);


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FieldErrors = {};

    if (step === 0) {
      // Basic Information validation
      if (!form.name || form.name.trim().length < 3) {
        newErrors.name = "Workshop name must be at least 3 characters long";
      } else if (form.name.length > 200) {
        newErrors.name = "Workshop name must not exceed 200 characters";
      }

      if (!form.location) {
        newErrors.location = "Location is required";
      }

      if (!form.facultyResponsible) {
        newErrors.facultyResponsible = "Faculty responsible is required";
      }

      if (!form.shortDescription || form.shortDescription.trim() === "") {
        newErrors.shortDescription = "Short description is required";
      }

      if (!form.capacity || form.capacity < 1) {
        newErrors.capacity = "Capacity must be at least 1";
      } else if (isNaN(Number(form.capacity))) {
        newErrors.capacity = "Capacity must be a valid number";
      }
    } else if (step === 1) {
      // Details & Resources validation
      if (!form.professorsParticipating || form.professorsParticipating.length === 0) {
        newErrors.professorsParticipating = "Please specify at least one participating professor";
      } else {
        // Validate each professor name
        const invalidProfs = form.professorsParticipating.filter(
          (prof: string) => prof.trim().length < 3
        );
        if (invalidProfs.length > 0) {
          newErrors.professorsParticipating = "Each professor name must be at least 3 characters long";
        }
      }

      if (!form.fundingSource) {
        newErrors.fundingSource = "Funding source is required";
      }

      if (form.requiredBudget === "" || form.requiredBudget === null || form.requiredBudget === undefined) {
        newErrors.requiredBudget = "Required budget is required";
      } else if (isNaN(Number(form.requiredBudget)) || Number(form.requiredBudget) < 0) {
        newErrors.requiredBudget = "Required budget must be a non-negative number";
      }
    } else if (step === 2) {
      // Schedule & Agenda validation
      if (!form.start) {
        newErrors.start = "Start date is required";
      }

      if (!form.end) {
        newErrors.end = "End date is required";
      }

      if (!form.registrationDeadline) {
        newErrors.registrationDeadline = "Registration deadline is required";
      }

      // Cross-field validations
      if (form.start && form.end) {
        if (new Date(form.end) <= new Date(form.start)) {
          newErrors.end = "End date must be after start date";
        }
      }

      if (form.registrationDeadline && form.start) {
        if (new Date(form.registrationDeadline) > new Date(form.start)) {
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
      // Clear errors when going back
      setErrors({});
    }
  };

 const handleSubmit = async () => {
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

  const step2Valid = validateStep(2);
  if (!step2Valid) {
    setActiveStep(2);
    return;
  }

  // Trigger loading
  setLoading(true);
  try {
    await onSubmit();   // assuming this returns a promise
  } finally {
    setLoading(false);
  }
};


  const handleAddProfessor = () => {
    const value = professorInput.trim();
    if (value === "") return;

    if (value.length < 3) {
      setErrors((prev) => ({
        ...prev,
        professorsParticipating: "Each professor name must be at least 3 characters long",
      }));
      return;
    }

    setForm((prev: any) => ({
      ...prev,
      professorsParticipating: [...prev.professorsParticipating, value],
    }));
    setProfessorInput("");
    
    // Clear error if there was one
    if (errors.professorsParticipating) {
      setErrors((prev) => ({ ...prev, professorsParticipating: "" }));
    }
  };

  const handleRemoveProfessor = (index: number) => {
    setForm((prev: any) => ({
      ...prev,
      professorsParticipating: prev.professorsParticipating.filter((_: any, i: number) => i !== index),
    }));
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
        {/* Left Sidebar */}
        <Box
          sx={{
            width: "320px",
            bgcolor: "#12495cff",
            color: "white",
            p: 4,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
         

          <Typography variant="h5" fontWeight={600} mb={1} sx={{ mt: 3 }}>
            {isEdit ? "Edit Workshop" : "Create Workshop"}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mb: 4, fontSize: "0.875rem" }}>
            Follow the steps to set up your workshop details and schedule.
          </Typography>

          <Box sx={{ flex: 1 }}>
            {steps.map((step, index) => (
              <Box key={step.key} sx={{ mb: 3, display: "flex", alignItems: "flex-start" }}>
                <Box sx={{ mr: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: index <= activeStep ? "#93c7c1" : "rgba(255,255,255,0.1)",
                      border: index === activeStep ? "2px solid white" : "2px solid transparent",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: index <= activeStep ? "#0f7090ff" : "white",
                    }}
                  >
                    {index < activeStep ? (
                      <CheckCircleIcon sx={{ color: "#033545ff", fontSize: "1.2rem" }} />
                    ) : (
                      index + 1
                    )}
                  </Box>
                  {index < steps.length - 1 && (
                    <Box
                      sx={{
                        width: 2,
                        height: 40,
                        bgcolor: index < activeStep ? "#93c7c1" : "rgba(255,255,255,0.2)",
                        mt: 1,
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1, pt: 0.5 }}>
                  <Typography
                    variant="body2"
                    fontWeight={index === activeStep ? 600 : 400}
                    sx={{ opacity: index <= activeStep ? 1 : 0.6, fontSize: "0.875rem" }}
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
            
            {/* Step Content */}
            {activeStep === 0 && (
              <Box>
                
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Basic Information
                </Typography>
                <TextField
                  label="Workshop Name*"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  placeholder="Enter workshop name"
                  error={!!errors.name}
                  helperText={errors.name}
                />
                <TextField
                  select
                  label="Location*"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.location}
                  helperText={errors.location}
                >
                  <MenuItem value="GUC Cairo">GUC Cairo</MenuItem>
                  <MenuItem value="GUC Berlin">GUC Berlin</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Faculty Responsible*"
                  name="facultyResponsible"
                  value={form.facultyResponsible}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.facultyResponsible}
                  helperText={errors.facultyResponsible}
                >
                  <MenuItem value="">Select a faculty</MenuItem>
                  {facultyOptions.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Short Description*"
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  sx={{ mb: 3 }}
                  placeholder="Brief overview"
                  error={!!errors.shortDescription}
                  helperText={errors.shortDescription}
                />
                <TextField
                  label="Capacity*"
                  name="capacity"
                  type="number"
                  value={form.capacity}
                  onChange={handleChange}
                  fullWidth
                  placeholder="Maximum attendees"
                  error={!!errors.capacity}
                  helperText={errors.capacity}
                  inputProps={{ min: 1 }}
                />
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Details & Resources
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    label="Professors Participating*"
                    fullWidth
                    value={professorInput}
                    onChange={(e) => setProfessorInput(e.target.value)}
                    placeholder="Type a professor name or ID and press Enter"
                    error={!!errors.professorsParticipating}
                    helperText={errors.professorsParticipating || "Press Enter to add each professor"}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddProfessor();
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <>
                          {form.professorsParticipating.map((prof: string, idx: number) => (
                            <Chip
                              key={idx}
                              label={prof}
                              onDelete={() => handleRemoveProfessor(idx)}
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </>
                      ),
                    }}
                  />
                </Box>
                <TextField
                  select
                  label="Funding Source*"
                  name="fundingSource"
                  value={form.fundingSource}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.fundingSource}
                  helperText={errors.fundingSource}
                >
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
                  placeholder="Enter budget amount"
                  error={!!errors.requiredBudget}
                  helperText={errors.requiredBudget}
                  inputProps={{ min: 0 }}
                />
                <TextField
                  label="Extra Required Resources"
                  name="extraRequiredResources"
                  value={form.extraRequiredResources}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Extra resources"
                />
              </Box>
            )}

            {activeStep === 2 && (
              <Box>
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Schedule & Agenda
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
                  name="end"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={form.end}
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
                  value={form.registrationDeadline}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 3 }}
                  error={!!errors.registrationDeadline}
                  helperText={errors.registrationDeadline}
                />
                <AgendaBuilder
                  startDateTime={form.start}
                  endDateTime={form.end}
                  professors={form.professorsParticipating}
                  initialAgenda={form.fullagenda}
                  onChange={(agendaJson) => setForm((prev: any) => ({ ...prev, fullagenda: agendaJson }))}
                />
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
              onClick={activeStep === 0 ? onClose : handleBack}
              sx={{ minWidth: 120 }}
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
  sx={{ minWidth: 160 }}
  disabled={loading}
>
  {loading
    ? (isEdit ? "Saving..." : "Creating...")
    : (isEdit ? "Save Changes" : "Create Workshop")}
</Button>

            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}