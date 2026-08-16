'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';



interface DecodedToken {
  role?: 'Staff' | 'student' | 'vendor' | 'admin' | 'event-office' | 'Professor' | 'TA' | 'restaurant';
  staffRole?: 'TA' | 'Professor' | 'Staff';
  email?: string;
  exp?: number;
}

const TokenPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // ✅ Get token from localStorage or URL
    const storedToken = localStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get('token');
    const activeToken = queryToken || storedToken;

    if (!activeToken) {
      setToken('No token found');
      return;
    }

    setToken(activeToken);

    try {
      // ✅ Decode the token
      const decoded = jwtDecode<DecodedToken>(activeToken);

      // ✅ Role-based redirect logic
      switch (decoded.role) {
        case 'admin':
          router.push('/dashboards/admin');
          break;
        case 'restaurant':
          router.push('/dashboards/restraunt');
          break;
        case 'event-office':
          router.push('/dashboards/eventOffice');
          break;
        case 'vendor':
          router.push('/dashboards/vendor');
          break;
        case 'student':
          router.push('/dashboards/student');
          break;
        case 'Staff':
          router.push('/dashboards/staff');
          break;
        case 'Professor':
          router.push('/dashboards/professor');
          break;
        case 'TA':
          router.push('/dashboards/staff');
          break;
        default:
          console.warn('Unknown role:', decoded.role);
          router.push('/dashboards/auth/login');
          break;
      }
    } catch (error) {
      console.error('Invalid token:', error);
      router.push('/dashboards/auth/login');
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-800">
      <h1 className="text-2xl font-semibold mb-4">Redirecting to your dashboards ,Thanks for your patience</h1>
     
    </div>
  );
};

export default TokenPage;
