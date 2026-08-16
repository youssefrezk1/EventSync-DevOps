import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { api } from "../../../api";

interface Trip {
  _id: string;
  name: string;
  location: string;
  start: string;
  end: string;
  time: string;
  shortDescription: string;
  capacity: number;
  registeredCount: number;
  price: number;
  registrationDeadline: string;
}

interface TripMainContentProps {
  trip: Trip;
  registering: boolean;
  onRegister: () => void;
  role?: string;
  userId?: string;
}

export default function TripMainContent({
  trip,
  registering,
  onRegister,
  role,
  userId,
}: TripMainContentProps) {
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
            reg.eventID === trip._id,
            reg.eventId === trip._id,
            reg.tripId === trip._id,
            reg.trip_id === trip._id,
            reg.event === trip._id,
            reg.trip === trip._id,
            String(reg.eventID) === String(trip._id),
            String(reg.eventId) === String(trip._id),
            String(reg.tripId) === String(trip._id),
            String(reg.event) === String(trip._id),
            String(reg.trip) === String(trip._id),
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
  }, [trip._id, userId, role]);

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

      const response = await api.post(`/api/payments/trips/${registrationId}/cancel`);

      setIsRegistered(false);
      setRegistrationId(null);
      setShowCancelDialog(false);
      
      window.location.reload();
      
    } catch (err: any) {
      console.error("Cancel registration error:", err);
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
  };

  const placesLeft = trip.capacity - trip.registeredCount;
  const isRegistrationOpen = new Date(trip.registrationDeadline) > new Date();
  
  // Check if trip is less than 2 weeks away
  const tripDate = new Date(trip.start);
  const today = new Date();
  const daysUntilTrip = Math.ceil((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const canCancelTrip = daysUntilTrip >= 14;
  
  const canRegister = isRegistrationOpen && placesLeft > 0 && !isRegistered;
  const allowedRoles = ["student", "Student", "TA", "Staff", "Professor"];
  const showRegisterButton = role && allowedRoles.includes(role);

  const getButtonText = () => {
    if (isRegistered) {
      if (cancelling) return "Cancelling...";
      if (!canCancelTrip) return "Cancellation Deadline Passed";
      return "Cancel My Registration";
    }
    if (registering) return "Processing...";
    if (!isRegistrationOpen) return "Registration Closed";
    if (placesLeft === 0) return "Fully Booked";
    return "Register for Trip";
  };

  const handleButtonClick = () => {
    if (isRegistered && canCancelTrip) {
      handleCancelClick();
    } else if (!isRegistered) {
      onRegister();
    }
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
          {/* Left Column - Description */}
          <Box sx={{ p: 4 }}>
            {trip.shortDescription && (
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
                  About This Trip
                </Typography>
                <Typography
                  sx={{
                    fontSize: 15,
                    color: '#475569',
                    lineHeight: 1.7,
                    fontWeight: 400,
                  }}
                >
                  {trip.shortDescription}
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
            {/* Trip Price */}
            <Box 
              sx={{
                p: 3,
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
                  Trip Price
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
                ${trip.price}
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

            {/* Availability */}
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
                      width: `${(trip.registeredCount / trip.capacity) * 100}%`,
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
                disabled={(!canRegister && !isRegistered) || registering || checkingRegistration || cancelling || (isRegistered===true && !canCancelTrip)}
                fullWidth
                sx={{
                  py: 2,
                  borderRadius: 2,
                  fontSize: 15,
                  fontWeight: 700,
                  textTransform: "none",
                  bgcolor: (isRegistered && canCancelTrip) ? "#1e293b" : (canRegister ? "#1e293b" : "#e2e8f0"),
                  color: (isRegistered && canCancelTrip) ? "white" : (canRegister ? "white" : "#94a3b8"),
                  boxShadow: (isRegistered && canCancelTrip) ? "0 4px 14px rgba(30, 41, 59, 0.4)" : (canRegister ? "0 4px 14px rgba(30, 41, 59, 0.4)" : "none"),
                  transition: "all 0.3s",
                  "&:hover": {
                    bgcolor: (isRegistered && canCancelTrip) ? "#0f172a" : (canRegister ? "#0f172a" : "#e2e8f0"),
                    boxShadow: (isRegistered && canCancelTrip) ? "0 6px 20px rgba(30, 41, 59, 0.5)" : (canRegister ? "0 6px 20px rgba(30, 41, 59, 0.5)" : "none"),
                    transform: ((isRegistered && canCancelTrip) || canRegister) ? "translateY(-2px)" : "none",
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
                Your registration for <strong>{trip.name}</strong> will be permanently cancelled. This action cannot be undone.
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