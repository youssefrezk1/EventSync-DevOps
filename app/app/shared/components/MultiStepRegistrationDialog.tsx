import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { CreditCard, AccountBalanceWallet } from "@mui/icons-material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { api } from "@/api";

interface MultiStepRegistrationDialogProps {
  open: boolean;
  onClose: () => void;
  workshopId?: string;
  tripId?: string;
  workshopName?: string;
  itemName?: string;
  onRegistrationSuccess: () => void;
  itemType?: 'workshop' | 'trip';
}

export default function MultiStepRegistrationDialog({
  open,
  onClose,
  workshopId,
  tripId,
  workshopName,
  itemName,
  onRegistrationSuccess,
  itemType = 'workshop',
}: MultiStepRegistrationDialogProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [registrationId, setRegistrationId] = useState<string>("");
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [verified, setVerified] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const WORKSHOP_PRICE = 100;
  const [price, setPrice] = useState<number>(WORKSHOP_PRICE);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
  });

  const steps = ["Email & Details", "Payment"];
  const displayName = itemName || workshopName;

  // Load data from localStorage after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const firstName = localStorage.getItem("firstName");
      const lastName = localStorage.getItem("lastName");
      const email = localStorage.getItem("email");
      const studentId = localStorage.getItem("studentId");

      setFormData({
        name: firstName && lastName ? `${firstName} ${lastName}` : "",
        email: email || "",
        studentId: studentId || "",
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchWalletBalance = async () => {
    try {
      const { data } = await api.get('/api/payments/getmywallet');
      setWalletBalance(data.walletBalance || 0);
    } catch (err: any) {
      console.error('Failed to fetch wallet balance:', err);
      setWalletBalance(0);
    }
  };

  const fetchTripPrice = async (regId: string) => {
    try {
      const { data } = await api.get(`/api/payments/trip-price/${regId}`);
      setPrice(data.price);
    } catch (err: any) {
      console.error('Failed to fetch trip price:', err);
      setPrice(WORKSHOP_PRICE);
    }
  };

  const handleNextStep = async () => {
    if (activeStep === 0) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.studentId.trim()) {
        setError("Please fill in all fields");
        return;
      }
      setError("");

      try {
        setLoading(true);
        const id = itemType === 'trip' ? tripId : workshopId;
        const endpoint = itemType === 'trip'
          ? `/api/trips/${id}/register`
          : `/api/workshops/${id}/register`;

        const { data } = await api.post(endpoint, {
          Name: formData.name,
          Email: formData.email,
          StudentID: formData.studentId,
        });

        const newRegId = data.registration._id;
        setRegistrationId(newRegId);
        await fetchWalletBalance();
        if (itemType === 'trip') {
          await fetchTripPrice(newRegId);
        }
        setActiveStep(1);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Registration failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBackStep = async () => {
    try {
      if (registrationId) {
        const endpoint = itemType === 'trip'
          ? `/api/payments/trips/registration/${registrationId}`
          : `/api/payments/workshops/registration/${registrationId}`;

        await api.delete(endpoint);
      }
      setRegistrationId("");
      setActiveStep(0);
    } catch (err) {
      console.error("Failed to delete registration:", err);
    }
  };

  const handlePay = async () => {
    if (!registrationId) return;

    if (paymentMethod === 'wallet' && walletBalance < price) {
      setStatusMsg({
        type: 'error',
        text: `Insufficient wallet balance. You need $${price.toFixed(2)} but only have $${walletBalance.toFixed(2)}`
      });
      return;
    }

    setPaymentLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const endpoint = itemType === 'trip'
        ? `/api/payments/payfortrip/${registrationId}`
        : `/api/payments/payforworkshop/${registrationId}`;

      const { data } = await api.post(endpoint, { paymentMethod });

      if (paymentMethod === 'card' && data.url) {
        window.location.href = data.url;
      } else if (paymentMethod === 'wallet') {
        setVerified(true);
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Payment failed'
      });
      setPaymentLoading(false);
    }
  };

  const handleClose = async () => {
    if (registrationId && activeStep === 0) {
      try {
        const endpoint = itemType === 'trip'
          ? `/api/payments/trips/registration/${registrationId}`
          : `/api/payments/workshops/registration/${registrationId}`;

        await api.delete(endpoint);
      } catch (err) {
        console.error("Failed to delete registration:", err);
      }
    }

    if (registrationId && activeStep === 1 && !verified) {
      try {
        const endpoint = itemType === 'trip'
          ? `/api/payments/trips/registration/${registrationId}`
          : `/api/payments/workshops/registration/${registrationId}`;

        await api.delete(endpoint);
      } catch (err) {
        console.error("Failed to delete registration:", err);
      }
    }

    setActiveStep(0);
    setRegistrationId("");
    
    // Reset form data with localStorage values
    if (typeof window !== 'undefined') {
      const firstName = localStorage.getItem("firstName");
      const lastName = localStorage.getItem("lastName");
      const email = localStorage.getItem("email");
      const studentId = localStorage.getItem("studentId");

      setFormData({
        name: firstName && lastName ? `${firstName} ${lastName}` : "",
        email: email || "",
        studentId: studentId || "",
      });
    }
    
    setError("");
    setStatusMsg({ type: '', text: '' });
    setVerified(false);
    setPaymentMethod('wallet');
    onClose();
  };

  const handlePaymentSuccess = () => {
    onRegistrationSuccess();
    handleClose();
    
  };

  if (!mounted) {
    return null;
  }

  // Success State
  if (verified) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ mb: 3, fontSize: '3rem' }}>✓</Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Payment Successful!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your payment for <strong>{displayName}</strong> has been processed successfully!
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={handlePaymentSuccess}
            sx={{ py: 1.5 }}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { height: "auto", maxHeight: "700px" } }}
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
    Register Now
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
    Complete your registration and payment
  </Typography>

  <Box sx={{ flex: 1 }}>
    {steps.map((step, index) => (
      <Box key={step} sx={{ mb: 3.5, display: "flex", alignItems: "flex-start" }}>
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
            {step}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>
</Box>

        {/* Right Content Area */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ flex: 1, overflowY: "auto", p: 4 }}>
            {/* STEP 1: Registration Form */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" fontWeight={600} mb={2.5} sx={{ fontSize: 20 }}>
                  Email & Details
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2.5 }}>
                    {error}
                  </Alert>
                )}

                <TextField
                  label="Full Name*"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  fullWidth
                  sx={{ mb: 3 }}
                />

                <TextField
                  label="Email*"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  fullWidth
                  sx={{ mb: 3 }}
                />

                <TextField
                  label="Student ID*"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  placeholder="Enter your student ID"
                  fullWidth
                  sx={{ mb: 1 }}
                />
              </Box>
            )}

            {/* STEP 2: Payment */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" fontWeight={600} mb={2.5} sx={{ fontSize: 20 }}>
                  Payment
                </Typography>

                {/* Pricing Card */}
                <Card sx={{ mb: 2, bgcolor: "background.default", border: "1px solid #e0e0e0" }}>
                  <CardContent sx={{ py: 2, px: 2.5, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      
                      {/* Left side — Workshop/Trip Name Only */}
                      <Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          sx={{ fontSize: 15 }}
                        >
                          {displayName}
                        </Typography>
                      </Box>

                      {/* Right side — Price */}
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        color="primary.main"
                        sx={{ fontSize: 16 }}
                      >
                        ${price.toFixed(2)}
                      </Typography>

                    </Box>
                  </CardContent>
                </Card>

                {/* Payment Methods */}
                <FormControl fullWidth sx={{ mb: 1.5 }}>
                  <FormLabel sx={{ mb: 1.5, fontWeight: 600, fontSize: 14 }}>Select Payment Method</FormLabel>

                  {/* Wallet Option */}
                  <Box
                    sx={{
                      p: 1.5,
                      border: paymentMethod === 'wallet' ? '2px solid' : '1px solid',
                      borderColor: paymentMethod === 'wallet' ? 'primary.main' : 'divider',
                      borderRadius: 1.5,
                      mb: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                      }
                    }}
                    onClick={() => setPaymentMethod('wallet')}
                  >
                    <FormControlLabel
                      control={
                        <Radio
                          checked={paymentMethod === 'wallet'}
                          onChange={() => setPaymentMethod('wallet')}
                        />
                      }
                      label={
                        <Box sx={{ ml: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountBalanceWallet sx={{ fontSize: 20 }} />
                            <Box>
                              <Typography fontWeight={600} sx={{ fontSize: 14 }}>Wallet</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                                Balance: ${walletBalance.toFixed(2)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      }
                      sx={{ width: '100%', ml: 0, my: 0 }}
                    />
                  </Box>

                  {/* Card Option */}
                  <Box
                    sx={{
                      p: 1.5,
                      border: paymentMethod === 'card' ? '2px solid' : '1px solid',
                      borderColor: paymentMethod === 'card' ? 'primary.main' : 'divider',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                      }
                    }}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <FormControlLabel
                      control={
                        <Radio
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                        />
                      }
                      label={
                        <Box sx={{ ml: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CreditCard sx={{ fontSize: 20 }} />
                            <Typography fontWeight={600} sx={{ fontSize: 14 }}>Credit Card</Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ width: '100%', ml: 0, my: 0 }}
                    />
                  </Box>
                </FormControl>

                {statusMsg.text && (
                  <Alert severity={statusMsg.type as any} sx={{ fontSize: 12 }}>{statusMsg.text}</Alert>
                )}
              </Box>
            )}
          </Box>

          {/* Navigation Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              p: 4,
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Button
              variant="outlined"
              onClick={activeStep === 0 ? handleClose : handleBackStep}
              sx={{ minWidth: 140, py: 1.2, fontSize: 15 }}
              disabled={loading || paymentLoading}
            >
              {activeStep === 0 ? "Cancel" : "Back"}
            </Button>
            {activeStep === 0 ? (
              <Button
                variant="contained"
                onClick={handleNextStep}
                sx={{ minWidth: 140, py: 1.2, fontSize: 15, background: "#0f172a", "&:hover": { background: "#1e293b" } }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Next"}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handlePay}
                sx={{ minWidth: 140, py: 1.2, fontSize: 15, background: "#0f172a", "&:hover": { background: "#1e293b" } }}
                disabled={paymentLoading}
              >
                {paymentLoading ? <CircularProgress size={22} color="inherit" /> : "Pay Now"}
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}