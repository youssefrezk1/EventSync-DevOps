// TournamentFormDialog.tsx
// Save this file in: app/shared/components/TournamentFormDialog.tsx

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Checkbox,
  Grid,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  EmojiEvents  as TrophyIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Sports as SportsIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

const SPORTS = [
  'tennis',
  'football',
  'basketball',
  'volleyball',
  'handball',
  'pingpong',
  'power lifting',
  'cross fit',
  'chess'
];

const STATUSES = [
  'Draft',
  'Open for Registration',
  'Sponsorship Open',
  'In Progress',
  'Completed',
  'Cancelled'
];

const getMinDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatSport = (sport: string) => {
  return sport.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const steps = [
  'Basic Information',
  'Schedule & Location',
  'Teams & Capacity',
  'Budget & Rules'
];

interface FormData {
  name: string;
  sport: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  location: string;
  address: string;
  teamSize: string;
  maxTeams: string;
  rules: string;
  entryFee: string;
  prize: string;
  isSponsorshipOpen: boolean;
}

interface TournamentFormDialogProps {
  open: boolean;
  onClose: () => void;
  isEdit: boolean;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  onSubmit: () => void;
  validationError: string;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function TournamentFormDialog({
  open,
  onClose,
  isEdit,
  form,
  setForm,
  activeStep,
  setActiveStep,
  onSubmit,
  validationError,
  formErrors,
  setFormErrors,
}: TournamentFormDialogProps) {
  const minDate = getMinDate();

  const handleFormChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const validateCurrentStep = () => {
    const errors: Record<string, string> = {};
    
    switch (activeStep) {
      case 0: // Basic Information
        if (!form.name?.trim()) errors.name = "Tournament name is required";
        if (!form.sport) errors.sport = "Sport is required";
        if (!form.status) errors.status = "Status is required";
        break;
        
      case 1: // Schedule & Location
        if (!form.startDate) errors.startDate = "Start date is required";
        if (!form.endDate) errors.endDate = "End date is required";
        if (!form.registrationDeadline) errors.registrationDeadline = "Registration deadline is required";
        if (!form.location?.trim()) errors.location = "Location is required";
        
        if (form.startDate && form.endDate) {
          if (new Date(form.endDate) < new Date(form.startDate)) {
            errors.endDate = "End date must be after start date";
          }
        }
        
        if (form.registrationDeadline && form.startDate) {
          if (new Date(form.registrationDeadline) > new Date(form.startDate)) {
            errors.registrationDeadline = "Registration deadline must be before start date";
          }
        }
        break;
        
      case 2: // Teams & Capacity
        const teamSize = parseInt(form.teamSize);
        if (!teamSize || teamSize < 1) errors.teamSize = "Team size must be at least 1";
        
        const maxTeams = parseInt(form.maxTeams);
        if (!maxTeams || maxTeams < 1) errors.maxTeams = "Max teams must be at least 1";
        break;
        
      case 3: // Budget & Rules
        const entryFee = parseFloat(form.entryFee);
        if (isNaN(entryFee) || entryFee < 0) errors.entryFee = "Entry fee must be 0 or greater";
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Tournament Name */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrophyIcon sx={{ fontSize: 20, color: '#003d52' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Tournament Name *
                </Typography>
              </Box>
              <TextField
                fullWidth
                placeholder="e.g., Summer Basketball Championship 2024"
                value={form.name}
                name="name"
                onChange={handleFormChange}
                error={!!formErrors?.name}
                helperText={formErrors?.name}
                size="small"
              />
            </Box>

            {/* Sport */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SportsIcon sx={{ fontSize: 20, color: '#003d52' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Sport *
                </Typography>
              </Box>
              <FormControl fullWidth size="small" error={!!formErrors?.sport}>
                <Select
                  value={form.sport}
                  name="sport"
                  onChange={handleFormChange}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <Typography sx={{ color: '#64748b' }}>Select a sport</Typography>;
                    }
                    return formatSport(selected);
                  }}
                >
                  <MenuItem value="" disabled>
                    <Typography sx={{ color: '#64748b', fontStyle: 'italic' }}>
                      Select a sport
                    </Typography>
                  </MenuItem>
                  {SPORTS.map(sport => (
                    <MenuItem key={sport} value={sport}>
                      {formatSport(sport)}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors?.sport && <FormHelperText>{formErrors.sport}</FormHelperText>}
              </FormControl>
            </Box>


          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Start Date */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarIcon sx={{ fontSize: 20, color: '#003d52' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Start Date *
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="date"
                value={form.startDate}
                name="startDate"
                onChange={handleFormChange}
                error={!!formErrors?.startDate}
                helperText={formErrors?.startDate}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: minDate }}
                size="small"
              />
            </Box>

            {/* End Date */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarIcon sx={{ fontSize: 20, color: '#003d52' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  End Date *
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="date"
                value={form.endDate}
                name="endDate"
                onChange={handleFormChange}
                error={!!formErrors?.endDate}
                helperText={formErrors?.endDate}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: form.startDate || minDate }}
                size="small"
              />
            </Box>

            {/* Registration Deadline */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTimeIcon sx={{ fontSize: 20, color: '#003d52' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Registration Deadline *
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="date"
                value={form.registrationDeadline}
                name="registrationDeadline"
                onChange={handleFormChange}
                error={!!formErrors?.registrationDeadline}
                helperText={formErrors?.registrationDeadline}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: form.startDate || undefined, min: minDate }}
                size="small"
              />
            </Box>

            {/* Location */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon sx={{ fontSize: 20, color: '#003d52' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Location *
                </Typography>
              </Box>
              <TextField
                fullWidth
                placeholder="e.g., Main Sports Hall, Downtown Arena"
                value={form.location}
                name="location"
                onChange={handleFormChange}
                error={!!formErrors?.location}
                helperText={formErrors?.location}
                size="small"
              />
            </Box>

            {/* Address (Optional) */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon sx={{ fontSize: 20, color: '#003d52' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Address (Optional)
                </Typography>
              </Box>
              <TextField
                fullWidth
                placeholder="Full address: 123 Sports Ave, City, State, ZIP Code"
                value={form.address}
                name="address"
                onChange={handleFormChange}
                size="small"
              />
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Team Size */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleIcon sx={{ fontSize: 20, color: '#003d52' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Team Size *
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="number"
                placeholder="e.g., 5 for basketball"
                value={form.teamSize}
                name="teamSize"
                onChange={handleFormChange}
                error={!!formErrors?.teamSize}
                helperText={formErrors?.teamSize || "Number of players per team"}
                inputProps={{ min: 1 }}
                size="small"
              />
            </Box>

            {/* Max Teams */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleIcon sx={{ fontSize: 20, color: '#003d52' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Maximum Teams *
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="number"
                placeholder="e.g., 16 teams max"
                value={form.maxTeams}
                name="maxTeams"
                onChange={handleFormChange}
                error={!!formErrors?.maxTeams}
                helperText={formErrors?.maxTeams || "Maximum number of teams allowed"}
                inputProps={{ min: 1 }}
                size="small"
              />
            </Box>

            {/* Summary Card */}
            <Box
              sx={{
                p: 3,
                bgcolor: '#f0fdf4',
                borderRadius: 2,
                border: '2px solid #bbf7d0',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#166534', mb: 2 }}>
                Tournament Capacity Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#16a34a' }}>
                  <strong>Total Players:</strong> {(parseInt(form.teamSize) || 0) * (parseInt(form.maxTeams) || 0)} players maximum
                </Typography>
                <Typography variant="body2" sx={{ color: '#16a34a' }}>
                  <strong>Teams:</strong> Up to {form.maxTeams || 0} teams
                </Typography>
                <Typography variant="body2" sx={{ color: '#16a34a' }}>
                  <strong>Team Size:</strong> {form.teamSize || 0} players per team
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Entry Fee */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MoneyIcon sx={{ fontSize: 20, color: '#003d52' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Entry Fee ($) *
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="number"
                placeholder="0.00 (Free if 0)"
                value={form.entryFee}
                name="entryFee"
                onChange={handleFormChange}
                error={!!formErrors?.entryFee}
                helperText={formErrors?.entryFee || "Entry fee per team"}
                inputProps={{ min: 0, step: '0.01' }}
                size="small"
              />
            </Box>

            {/* Prize */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrophyIcon sx={{ fontSize: 20, color: '#003d52' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Prize (Optional)
                </Typography>
              </Box>
              <TextField
                fullWidth
                placeholder="e.g., $500 Cash Prize, Trophy, Gift Cards"
                value={form.prize}
                name="prize"
                onChange={handleFormChange}
                size="small"
              />
            </Box>

            {/* Rules */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrophyIcon sx={{ fontSize: 20, color: '#003d52' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Rules & Guidelines (Optional)
                </Typography>
              </Box>
              <TextField
                fullWidth
                placeholder="Example: Minimum age 18, Equipment provided, No professional players, Tie-breaker rules, etc."
                value={form.rules}
                name="rules"
                onChange={handleFormChange}
                multiline
                rows={4}
                size="small"
              />
            </Box>

            {/* Sponsorship Checkbox */}
            <Box
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <Checkbox
                name="isSponsorshipOpen"
                checked={form.isSponsorshipOpen}
                onChange={handleFormChange}
                sx={{
                  color: '#003d52',
                  '&.Mui-checked': {
                    color: '#003d52',
                  },
                  mt: 0.5,
                }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                  Open for Sponsorship
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Check this box to allow sponsors to support this tournament. Sponsors can provide prizes, funding, or equipment.
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 600,
          pr: 6,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: '#f8fafc',
          borderBottom: '2px solid #e2e8f0',
          pb: 2,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: '#003d52',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0,
          }}
        >
          {isEdit ? <EditIcon /> : <AddIcon />}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
            {isEdit ? 'Edit Tournament' : 'Create New Tournament'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#64748b',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 4, py: 3, bgcolor: '#ffffff' }}>
        {validationError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {validationError}
          </Alert>
        )}

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 4, py: 3, bgcolor: '#f8fafc', gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#cbd5e1',
            color: '#64748b',
            '&:hover': {
              borderColor: '#94a3b8',
              bgcolor: '#f1f5f9',
            },
          }}
        >
          Cancel
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            variant="outlined"
            startIcon={<BackIcon />}
            sx={{
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#cbd5e1',
              color: '#64748b',
              '&:hover': {
                borderColor: '#94a3b8',
                bgcolor: '#f1f5f9',
              },
            }}
          >
            Back
          </Button>
        )}

        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            variant="contained"
            endIcon={<NextIcon />}
            sx={{
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#003d52',
              '&:hover': {
                bgcolor: '#002a3a',
              },
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#003d52',
              '&:hover': {
                bgcolor: '#002a3a',
              },
            }}
          >
            {isEdit ? 'Update Tournament' : 'Create Tournament'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}