import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Card,
  CardContent,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import { CreditCard, AccountBalanceWallet } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import { CheckCircle, Home, Loader } from "lucide-react";
import { api } from "../../../api";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  registrationId: string;
  tripName: string;
  onPaymentSuccess: () => void;
  onPaymentCancel?: () => void;
  itemType?: 'workshop' | 'trip';
}

export default function PaymentDialog({
  open,
  onClose,
  registrationId,
  tripName,
  onPaymentSuccess,
  onPaymentCancel,
  itemType = 'workshop'
}: PaymentDialogProps) {
  const router = useRouter();
  const WORKSHOP_PRICE = 100;
  const [price, setPrice] = useState<number>(WORKSHOP_PRICE);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    if (open) {
      fetchWalletBalance();
      if (itemType === 'trip') fetchTripPrice();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const stripeSessionId = urlParams.get('session_id');
    const stripeRegId = urlParams.get('registration_id');

    if (stripeSessionId && stripeRegId && open) {
      verifyPaymentFromStripe(stripeSessionId, stripeRegId);
    }
  }, [open, registrationId, itemType]);

  const fetchWalletBalance = async () => {
    try {
      const { data } = await api.get('/api/payments/getmywallet');
      setWalletBalance(data.walletBalance || 0);
    } catch (err: any) {
      console.error('Failed to fetch wallet balance:', err);
      setWalletBalance(0);
    }
  };

  const fetchTripPrice = async () => {
    try {
      const { data } = await api.get(`/api/payments/trip-price/${registrationId}`);
      setPrice(data.price);
    } catch (err: any) {
      console.error('Failed to fetch trip price:', err);
      setPrice(WORKSHOP_PRICE);
    }
  };

  const verifyPaymentFromStripe = async (sessionId: string, regId: string) => {
    setVerifying(true);
    setError('');
    try {
      await api.get(
        `/api/payments/payment/verify?session_id=${sessionId}&registration_id=${regId}`
      );
      setVerified(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setVerifying(false);
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

  const handleReturnHome = () => {
    setVerified(false);
    onPaymentSuccess();
    onClose();
    router.push("/dashboards/auth");
  };

  const handleDialogClose = () => {
    if (!verified) {
      onPaymentCancel?.();
    }
    onClose();
  };

  // ✅ Success State
  if (verified) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ mb: 3 }}>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </Box>

          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Payment Successful!
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your payment for <strong>{tripName}</strong> has been processed successfully!
          </Typography>

          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleReturnHome}
            sx={{ py: 1.5 }}
            startIcon={<Home className="w-5 h-5" />}
          >
            Return to Dashboard
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // ✅ Verifying State
  if (verifying) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Verifying Payment...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we confirm your payment
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  // ✅ Error State
  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ fontSize: '3rem', mb: 2 }}>⚠️</Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Payment Error
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => {
              setError('');
              onClose();
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // ✅ Payment Form
  return (
    <Dialog 
      open={open} 
      onClose={handleDialogClose}
      disableEscapeKeyDown={false}
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        Complete Your Registration
        <IconButton
          onClick={handleDialogClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Alert severity="success" sx={{ mb: 1 }}>
             Registration successful! Now complete your payment.
          </Alert>

          {/* Pricing Card */}
          <Card
            sx={{
              bgcolor: "background.default",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent>
              <Box sx={{ my: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {tripName}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${price.toFixed(2)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    Total Amount
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="primary.main"
                    sx={{ fontSize: "1.5rem" }}
                  >
                    ${price.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <FormControl fullWidth>
            <FormLabel sx={{ mb: 2, fontWeight: 700 }}>Pay with</FormLabel>

            {/* Wallet Option */}
            <Box
              sx={{
                p: 2,
                border: paymentMethod === 'wallet' ? '2px solid' : '1px solid',
                borderColor: paymentMethod === 'wallet' ? 'primary.main' : 'divider',
                borderRadius: 2,
                mb: 1.5,
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
                  <Box sx={{ ml: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <AccountBalanceWallet sx={{ fontSize: 20 }} />
                      <Typography fontWeight={600}>Wallet</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Available balance: ${walletBalance.toFixed(2)}
                    </Typography>
                  </Box>
                }
                sx={{ width: '100%', ml: 0 }}
              />
            </Box>

            {/* Card Option */}
            <Box
              sx={{
                p: 2,
                border: paymentMethod === 'card' ? '2px solid' : '1px solid',
                borderColor: paymentMethod === 'card' ? 'primary.main' : 'divider',
                borderRadius: 2,
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
                  <Box sx={{ ml: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <CreditCard sx={{ fontSize: 20 }} />
                      <Typography fontWeight={600}>Credit Card</Typography>
                    </Box>
                  </Box>
                }
                sx={{ width: '100%', ml: 0 }}
              />
            </Box>
          </FormControl>

          {statusMsg.text && (
            <Alert severity={statusMsg.type as any}>{statusMsg.text}</Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleDialogClose} variant="text">
          Cancel
        </Button>
        <Button
          onClick={handlePay}
          variant="contained"
          color="primary"
          disabled={paymentLoading}
          sx={{ minWidth: 120 }}
        >
          {paymentLoading ? <CircularProgress size={24} /> : 'Pay Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}