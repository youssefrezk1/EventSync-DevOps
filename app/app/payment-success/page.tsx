"use client";

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Paper } from '@mui/material';
import { CheckCircle, Home } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { api } from '@/api';

export default function PaymentSuccess() {
  const router = useRouter();
  const [verifying, setVerifying] = useState<boolean>(true);
  const [verified, setVerified] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const registrationId = urlParams.get('registration_id') || urlParams.get('registrationId');
      const cartId = urlParams.get('cart_id') || urlParams.get('cartId');
      const teamId = urlParams.get('team_id') || urlParams.get('teamId');
      const paymentType = urlParams.get('type');

      if (!sessionId) {
        setError('Missing payment session information');
        setVerifying(false);
        return;
      }

      try {
        // Handle tournament payment verification
        if (paymentType === 'tournament' && teamId) {
          await api.get(`/api/student/tournaments/verify-payment?session_id=${sessionId}&team_id=${teamId}`);
          setVerified(true);
          setVerifying(false);
          return;
        }

        // If this is a registration flow (workshop/trip/other), call the existing verify endpoint
        if (registrationId) {
          await api.get(`/api/payments/payment/verify?session_id=${sessionId}&registration_id=${registrationId}`);
          setVerified(true);
          setVerifying(false);
          return;
        }

        // If this is a cart flow (food order), try the cart verify endpoint first.
        if (cartId) {
          // Try explicit cart verify route
          try {
            await api.get(`/api/payments/payment/verifyCart?session_id=${sessionId}&cart_id=${cartId}`);
            setVerified(true);
            return;
          } catch (errCart: any) {
            // Fallback: some backends expose the cart verify under the generic verify route
            try {
              await api.get(`/api/payments/payment/verify?session_id=${sessionId}&cart_id=${cartId}`);
              setVerified(true);
              return;
            } catch (errFallback: any) {
              throw errFallback;
            }
          }
        }

        // If we get here without any valid identifier
        setError('Missing payment information');
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'An error occurred');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, []);

  const handleReturnHome = () => {
    router.push("/dashboards/auth");
  };

  if (verifying) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          background: 'linear-gradient(135deg, #E3F2FD 0%, #90CAF9 100%)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 3
        }}
      >
        <Paper 
          elevation={8}
          sx={{ 
            borderRadius: 4, 
            p: 6, 
            maxWidth: 500, 
            width: '100%', 
            textAlign: 'center' 
          }}
        >
          <CircularProgress size={64} sx={{ color: '#1976d2', mb: 3 }} />
          <Typography variant="h5" fontWeight={600} color="text.primary" mb={2}>
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
          background: 'linear-gradient(135deg, #FFEBEE 0%, #EF9A9A 100%)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 3
        }}
      >
        <Paper 
          elevation={8}
          sx={{ 
            borderRadius: 4, 
            p: 6, 
            maxWidth: 500, 
            width: '100%', 
            textAlign: 'center' 
          }}
        >
          <Box 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: '#ffcdd2', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mx: 'auto', 
              mb: 3 
            }}
          >
            <Typography variant="h2">⚠️</Typography>
          </Box>
          <Typography variant="h5" fontWeight={600} color="text.primary" mb={2}>
            Payment Error
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            {error}
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Home />}
            onClick={handleReturnHome}
            sx={{ 
              py: 1.5, 
              px: 4,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            Return to Home
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #E8F5E9 0%, #81C784 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: 3
      }}
    >
      <Paper 
        elevation={8}
        sx={{ 
          borderRadius: 4, 
          p: 6, 
          maxWidth: 500, 
          width: '100%', 
          textAlign: 'center' 
        }}
      >
        <Box 
          sx={{ 
            width: 100, 
            height: 100, 
            bgcolor: '#c8e6c9', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            mx: 'auto', 
            mb: 4 
          }}
        >
          <CheckCircle sx={{ fontSize: 60, color: '#2e7d32' }} />
        </Box>
        
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={2}>
          Payment Successful! 
        </Typography>
        
        <Typography variant="body1" color="text.secondary" mb={5}>
          Your payment has been processed successfully. Thank you for your purchase!
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<Home />}
          onClick={handleReturnHome}
          sx={{ 
            py: 1.5, 
            px: 4,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6
            }
          }}
        >
          Return to Home
        </Button>
      </Paper>
    </Box>
  );
}
