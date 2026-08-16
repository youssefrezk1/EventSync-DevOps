'use client';

import { useEffect, useState } from 'react';

export default function VerifyStaffPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        const res = await fetch(`http://localhost:4000/auth/verify/staff?token=${token}`);
        if (!res.ok) throw new Error('Verification failed');
        setStatus('success');

        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboards/auth/login';
        }, 2000);
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
      {status === 'verifying' && (
        <p className="text-gray-700 text-lg animate-pulse">
          Verifying your email, please wait...
        </p>
      )}
      {status === 'success' && (
        <p className="text-green-600 text-lg font-semibold">
          ✅ Email verified! Redirecting to login...
        </p>
      )}
      {status === 'error' && (
        <p className="text-red-600 text-lg font-semibold">
          ❌ Verification failed. The link may be invalid or expired.
        </p>
      )}
    </div>
  );
}
