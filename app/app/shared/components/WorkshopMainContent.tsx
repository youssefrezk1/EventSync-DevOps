import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { api } from "../../../api";

interface Workshop {
  _id: string;
  name: string;
  location: 'GUC Cairo' | 'GUC Berlin';
  start: string;
  end: string;
  shortDescription?: string;
  fullagenda?: string;
  facultyResponsible: string;
  professorsParticipating: string[];
  requiredBudget?: number;
  fundingSource: 'external' | 'GUC';
  extraRequiredResources?: string;
  capacity: number;
  registrationDeadline: string;
  registeredCount: number;
  ProfCreator: {
    firstName: string;
    lastName: string;
  };
  status: string;
}

interface WorkshopMainContentProps {
  workshop: Workshop;
  registering: boolean;
  onRegister: () => void;
  role?: string;
  userId?: string;
}

export default function WorkshopMainContent({
  workshop,
  registering,
  onRegister,
  role,
  userId,
}: WorkshopMainContentProps) {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    const checkIfRegistered = async () => {
      if (!userId) {
        setCheckingRegistration(false);
        return;
      }

      try {
        setCheckingRegistration(true);

        const isStudentRole = role === "student" || role === "Student" || role === "admin" || role === "event-office" || role === "vendor";
        const endpoint = isStudentRole ? "/api/my-registrations" : "/api/my-registrations2";

        const response = await api.get(endpoint);
        
        const registrations = response.data.registrations || [];

        const registration = registrations.find((reg: any) => {
          const possibleMatches = [
            reg.eventID === workshop._id,
            reg.eventId === workshop._id,
            reg.workshopId === workshop._id,
            reg.workshop_id === workshop._id,
            reg.event === workshop._id,
            reg.workshop === workshop._id,
            String(reg.eventID) === String(workshop._id),
            String(reg.eventId) === String(workshop._id),
            String(reg.workshopId) === String(workshop._id),
            String(reg.event) === String(workshop._id),
            String(reg.workshop) === String(workshop._id),
          ];
          
          return possibleMatches.some(match => match === true);
        });

        if (registration) {
          setIsRegistered(true);
          setRegistrationId(registration.registrationId || registration._id || registration.id);
        } else {
          setIsRegistered(false);
          setRegistrationId(null);
        }
      } catch (err: any) {
        console.error("Registration check error:", err.message);
        setIsRegistered(false);
        setRegistrationId(null);
      } finally {
        setCheckingRegistration(false);
      }
    };

    checkIfRegistered();
  }, [workshop._id, userId, role]);

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!registrationId) {
      console.error("No registrationId found - cannot cancel");
      return;
    }

    try {
      setCancelling(true);

      const response = await api.post(`/api/payments/workshops/${registrationId}/cancel`);

      // Show success message with refund info
      if (response.data.refund) {
        console.log(`Registration cancelled. Refunded ${response.data.refund.amount}. New balance: ${response.data.refund.newBalance}`);
      }

      setIsRegistered(false);
      setRegistrationId(null);
      setShowCancelDialog(false);
      
      // Reload to refresh the UI
      window.location.reload();
      
    } catch (err: any) {
      console.error("Cancel registration error:", err);
      
      // Handle specific error messages from backend
      if (err.response?.data?.message) {
        const errorMessage = err.response.data.message;
        const errorDetail = err.response.data.detail;
        
        if (errorMessage === 'Cancellation not allowed') {
          alert(`Cannot cancel: ${errorDetail || 'Cancellations must be made at least 2 weeks before the event.'}`);
        } else if (errorMessage === 'Only paid registrations can be cancelled') {
          alert('This registration cannot be cancelled because it has not been paid.');
        } else {
          alert(`Error: ${errorMessage}`);
        }
      } else {
        alert('Failed to cancel registration. Please try again.');
      }
      
      setShowCancelDialog(false);
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
  };

  const formatProfessors = (professors: string[]) => {
    if (professors.length === 0) return '';
    if (professors.length === 1) return professors[0];
    if (professors.length === 2) return `${professors[0]} and ${professors[1]}`;
    
    const allButLast = professors.slice(0, -1).join(', ');
    const last = professors[professors.length - 1];
    return `${allButLast}, and ${last}`;
  };

  // Calculate if event is less than 2 weeks away
  const isEventLessThanTwoWeeksAway = () => {
    const eventDate = new Date(workshop.start);
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days in milliseconds
    return eventDate <= twoWeeksFromNow;
  };

  const placesLeft = workshop.capacity - workshop.registeredCount;
  const isRegistrationOpen = new Date(workshop.registrationDeadline) > new Date();
  const isWorkshopStarted = new Date(workshop.start) <= new Date();
  const canRegister = isRegistrationOpen && !isWorkshopStarted && placesLeft > 0 && !isRegistered;
  const canCancel = isRegistered && !isEventLessThanTwoWeeksAway(); // Only allow cancellation if more than 2 weeks away
  const allowedRoles = ["student", "TA", "Staff", "Professor"];
  const showRegisterButton = role && allowedRoles.includes(role);

  const getButtonText = () => {
    if (isRegistered) {
      if (isEventLessThanTwoWeeksAway()) {
        return "Cancellation Deadline Passed";
      }
      return cancelling ? "Cancelling..." : "Cancel My Registration";
    }
    if (registering) return "Processing...";
    if (!isRegistrationOpen) return "Registration Closed";
    if (isWorkshopStarted) return "Workshop Started";
    if (placesLeft === 0) return "Fully Booked";
    return "Register for Workshop";
  };

  const handleButtonClick = () => {
    if (isRegistered && canCancel) {
      handleCancelClick();
    } else if (!isRegistered) {
      onRegister();
    }
    // If registered but can't cancel (less than 2 weeks), do nothing
  };

  return (
    <>
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 0,
          }}
        >
          {/* Left Column - Description & Details */}
          <Box sx={{ p: 4 }}>
            {/* About Section */}
            {workshop.shortDescription && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  sx={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: '#0f172a',
                    mb: 2,
                    letterSpacing: '-0.5px',
                  }}
                >
                  About This Workshop
                </Typography>
                <Typography
                  sx={{
                    fontSize: 15,
                    color: '#475569',
                    lineHeight: 1.7,
                    fontWeight: 400,
                  }}
                >
                  {workshop.shortDescription}
                </Typography>
              </Box>
            )}

            {/* Participating Professors */}
            {workshop.professorsParticipating && workshop.professorsParticipating.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  sx={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: '#0f172a',
                    mb: 2,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Participating Professors
                </Typography>
                <Typography
                  sx={{
                    fontSize: 15,
                    color: '#475569',
                    lineHeight: 1.7,
                    fontWeight: 400,
                  }}
                >
                  {formatProfessors(workshop.professorsParticipating)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Right Column - Sidebar */}
          <Box 
            sx={{ 
              bgcolor: '#fafafa',
              p: 3,
              borderLeft: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {/* Organizer */}
            <Box>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#94a3b8',
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                Organizer
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: '#1e293b',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {workshop.ProfCreator?.firstName?.[0]}
                  {workshop.ProfCreator?.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    {workshop.ProfCreator?.firstName} {workshop.ProfCreator?.lastName}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#64748b', mt: 0.2 }}>
                    Coordinator
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Budget */}
            <Box 
              sx={{
                p: 3,
                bgcolor: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                borderRadius: 2,
                border: '2px solid #1e293b',
                boxShadow: '0 4px 12px rgba(30, 41, 59, 0.15)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100px',
                  height: '100px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transform: 'translate(30%, -30%)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, position: 'relative', zIndex: 1 }}>
                <Box 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AttachMoneyIcon sx={{ fontSize: 14, color: '#fff' }} />
                </Box>
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Workshop Fee
                </Typography>
              </Box>
              <Typography 
                sx={{ 
                  fontSize: 36, 
                  fontWeight: 900, 
                  color: '#fff', 
                  letterSpacing: '-2px',
                  lineHeight: 1,
                  textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                $100
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.7)',
                  mt: 0.5,
                  fontWeight: 500,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                Per participant
              </Typography>
            </Box>

            {/* Availability Overview */}
            <Box>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#94a3b8',
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                Availability
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: 40,
                    fontWeight: 800,
                    color: '#0f172a',
                    lineHeight: 1,
                    letterSpacing: '-2px',
                  }}
                >
                  {placesLeft}
                </Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>
                  spots left
                </Typography>
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 6,
                    bgcolor: '#e2e8f0',
                    borderRadius: 1.5,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${(workshop.registeredCount / workshop.capacity) * 100}%`,
                      height: '100%',
                      bgcolor: '#1e293b',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Register/Cancel Button */}
            {showRegisterButton && (
              <Button
                variant="contained"
                onClick={handleButtonClick}
                disabled={
                  (!canRegister && !isRegistered) || 
    registering || 
    checkingRegistration || 
    cancelling ||
    (isRegistered === true && !canCancel) // Disable if registered but can't cancel
                }
                fullWidth
                sx={{
                  py: 2,
                  borderRadius: 2,
                  fontSize: 15,
                  fontWeight: 700,
                  textTransform: "none",
                  bgcolor: isRegistered 
                    ? (canCancel ? "#1e293b" : "#e2e8f0") // Grey if can't cancel
                    : (canRegister ? "#1e293b" : "#e2e8f0"),
                  color: isRegistered 
                    ? (canCancel ? "white" : "#94a3b8") // Grey text if can't cancel
                    : (canRegister ? "white" : "#94a3b8"),
                  boxShadow: isRegistered 
                    ? (canCancel ? "0 4px 14px rgba(30, 41, 59, 0.4)" : "none")
                    : (canRegister ? "0 4px 14px rgba(30, 41, 59, 0.4)" : "none"),
                  transition: "all 0.3s",
                  "&:hover": {
                    bgcolor: isRegistered 
                      ? (canCancel ? "#0f172a" : "#e2e8f0") // No hover effect if can't cancel
                      : (canRegister ? "#0f172a" : "#e2e8f0"),
                    boxShadow: isRegistered 
                      ? (canCancel ? "0 6px 20px rgba(30, 41, 59, 0.5)" : "none")
                      : (canRegister ? "0 6px 20px rgba(30, 41, 59, 0.5)" : "none"),
                    transform: (isRegistered && canCancel) || canRegister ? "translateY(-2px)" : "none",
                  },
                  "&:disabled": {
                    bgcolor: "#e2e8f0",
                    color: "#94a3b8",
                  },
                }}
              >
                {checkingRegistration ? "Checking..." : getButtonText()}
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={handleCancelDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          }
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #d13438 0%, #e57373 100%)',
            p: 2,
            pb: 2.5,
            position: 'relative',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: 'white',
              textAlign: 'center',
              letterSpacing: '-0.5px',
            }}
          >
            Cancel Registration
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              mt: 0.5,
              display: 'block',
            }}
          >
            This action cannot be undone
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2.5, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '56px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(209, 52, 56, 0.1)',
              }}
            >
              <Typography sx={{ fontSize: '2rem' }}>⚠️</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#0f172a',
                  mb: 1,
                }}
              >
                Are you sure?
              </Typography>
              <Typography
                sx={{
                  fontSize: 15,
                  color: '#64748b',
                  lineHeight: 1.6,
                }}
              >
                Your registration for <strong>{workshop.name}</strong> will be permanently cancelled. This action cannot be undone.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleCancelDialogClose}
              disabled={cancelling}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderWidth: 2,
                borderColor: '#e2e8f0',
                color: '#64748b',
                py: 1.2,
                '&:hover': {
                  borderWidth: 2,
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f8fafc',
                },
              }}
            >
              Keep Registration
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleCancelConfirm}
              disabled={cancelling}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                py: 1.2,
                background: 'linear-gradient(135deg, #d13438 0%, #e57373 100%)',
                boxShadow: '0 4px 12px rgba(209, 52, 56, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #b81c29 0%, #d13438 100%)',
                  boxShadow: '0 6px 16px rgba(209, 52, 56, 0.6)',
                },
                '&:disabled': {
                  background: '#e2e8f0',
                  color: '#94a3b8',
                },
              }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Registration'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}