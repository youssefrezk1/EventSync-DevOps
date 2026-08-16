import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, CheckCircle, Home, Loader } from 'lucide-react';
import { api } from '@/api';

// Payment Button Component
interface PaymentButtonProps {
  registrationId: string;
  paymentType?: 'workshop' | 'trip';
}

export function PaymentButton({ registrationId, paymentType = 'workshop' }: PaymentButtonProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handlePayment = async (paymentMethod: 'card' | 'wallet') => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(
        `/api/payment/${paymentType}/${registrationId}`,
        { paymentMethod }
      );

      if (paymentMethod === 'card' && data.url) {
        // Redirect to Stripe
        window.location.href = data.url;
      } else if (paymentMethod === 'wallet') {
        // Show success message and refresh
        alert('Payment successful using wallet!');
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => handlePayment('card')}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay with Card
            </>
          )}
        </button>

        <button
          onClick={() => handlePayment('wallet')}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              Pay with Wallet
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}

// Payment Success Page Component
export default function PaymentSuccess() {
  const [verifying, setVerifying] = useState<boolean>(true);
  const [verified, setVerified] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const registrationId = urlParams.get('registration_id');

      if (!sessionId || !registrationId) {
        setError('Missing payment information');
        setVerifying(false);
        return;
      }

      try {
        const { data } = await api.get(
          `/api/payment/verify?session_id=${sessionId}&registration_id=${registrationId}`
        );

        setVerified(true);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'An error occurred');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, []);

  const handleReturnHome = () => {
    window.location.href = '/';
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Verifying Payment...
          </h2>
          <p className="text-gray-600">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Error
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleReturnHome}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <Home className="w-5 h-5" />
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Payment Successful! 🎉
        </h1>
        
        <p className="text-gray-600 mb-8">
          Your payment has been processed successfully. Thank you for your purchase!
        </p>
        
        <button
          onClick={handleReturnHome}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2 mx-auto transition-colors shadow-lg hover:shadow-xl"
        >
          <Home className="w-5 h-5" />
          Return to Home
        </button>
      </div>
    </div>
  );
}