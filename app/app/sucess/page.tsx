"use client";

import { Suspense } from "react";

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Paper } from '@mui/material';
import { CheckCircle, Home } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/api';

function PaymentSuccessContent() {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const registrationId = searchParams.get('registration_id') || searchParams.get('registrationId');
      const cartId = searchParams.get('cart_id') || searchParams.get('cartId');
      const teamId = searchParams.get('team_id') || searchParams.get('teamId');
      const paymentType = searchParams.get('type');

      if (!sessionId) {
        setError('Missing payment information');
        setVerifying(false);
        return;
      }

      try {
        // Handle tournament payment verification
        if (paymentType === 'tournament' && teamId) {
          await api.get(`/api/student/tournaments/verify-payment?session_id=${sessionId}&team_id=${teamId}`);
          setVerified(true);
          return;
        }

        if (registrationId) {
          await api.get(`/api/payments/payment/verify?session_id=${sessionId}&registration_id=${registrationId}`);
          setVerified(true);
          return;
        }

        if (cartId) {
          try {
            await api.get(`/api/payments/payment/verifyCart?session_id=${sessionId}&cart_id=${cartId}`);
            setVerified(true);
            return;
          } catch (errCart: any) {
            // fallback to generic verify route with cart_id
            await api.get(`/api/payments/payment/verify?session_id=${sessionId}&cart_id=${cartId}`);
            setVerified(true);
            return;
          }
        }

        // If no valid identifier found
        if (!registrationId && !cartId && !teamId) {
          setError('Missing payment information');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Payment verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleReturnHome = () => {
    router.push('/dashboards/auth');
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
            <Typography variant="h2">âš ï¸</Typography>
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

export default function PaymentSuccess() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
