"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button, CircularProgress, Paper, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { api } from '@/api';

export default function VendorPaymentSuccess() {
  const router = useRouter();
  const theme = useTheme();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');

      if (!sessionId) {
        setError('Missing payment information');
        setVerifying(false);
        return;
      }

      try {
        await api.post('/api/vendor/tournaments/verify-payment', {
          session_id: sessionId
        });

        setVerified(true);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Payment verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, []);

  const handleReturnHome = () => {
    router.push('/dashboards/vendor');
  };

  const handleViewApplications = () => {
    router.push('/dashboards/vendor/tournaments');
  };

  if (verifying) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          p: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 6,
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          }}
        >
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Verifying Payment...
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please wait while we confirm your payment
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.error.light, 0.05)} 100%)`,
          p: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 6,
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.error.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
          </Box>
          
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: 'error.main' }}>
            Payment Error
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {error}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleViewApplications}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
              }}
            >
              Try Again
            </Button>
            <Button
              variant="contained"
              onClick={handleReturnHome}
              startIcon={<HomeIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
              }}
            >
              Return to Dashboard
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 6,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
        }}
      >
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.success.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main' }} />
        </Box>
        
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 2,
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Payment Successful!
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Your tournament sponsorship application has been submitted successfully.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Thank you for your sponsorship! We'll review your application and notify you soon.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={handleViewApplications}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
            }}
          >
            View My Applications
          </Button>
          <Button
            variant="contained"
            onClick={handleReturnHome}
            startIcon={<HomeIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            Return to Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
