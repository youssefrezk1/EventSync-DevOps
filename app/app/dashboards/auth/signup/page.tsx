'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Role {
  id: string;
  title: string;
  defaultIcon: string;
  selectedIcon: string;
}

const SignUpRoleSelector: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const router = useRouter();

  const roles: Role[] = [
    { 
      id: 'company', 
      title: 'Company', 
      defaultIcon: '/icons/vendor-default.png',
      selectedIcon: '/icons/vendor-selected.png'
    },
    { 
      id: 'faculty', 
      title: 'Faculty', 
      defaultIcon: '/icons/staff-default.png',
      selectedIcon: '/icons/staff-selected.png'
    },
    { 
      id: 'student', 
      title: 'Student', 
      defaultIcon: '/icons/student-default.png',
      selectedIcon: '/icons/student-selected.png'
    },
  ];

  const handleRoleClick = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/dashboards/auth/signup/${selectedRole}`);
    }
  };

  const handleLoginRedirect = () => {
    router.push('/dashboards/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'linear-gradient(to bottom right, #003d52, #336879)' }}>
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 md:p-16 max-w-4xl w-full relative">
       

        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center" style={{ color: '#40587fff' }}>
          Sign Up As
        </h1>
        <p className="text-lg mb-12 text-center" style={{ color: '#556779' }}>
          Choose your role to get started
        </p>

        <div className="flex justify-center gap-8 md:gap-12 flex-wrap">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleRoleClick(role.id)}
              className={`cursor-pointer transition-all duration-300 hover:-translate-y-3 ${
                selectedRole === role.id ? 'scale-105' : ''
              }`}
            >
              <div className="relative">
                <div
                  className="w-36 h-36 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center shadow-lg border-4 transition-all duration-300 relative overflow-hidden"
                  style={{
                    borderColor: selectedRole === role.id ? '#426f7eff' : '#e5e7eb',
                    boxShadow: selectedRole === role.id ? '0 10px 25px -5px rgba(0, 61, 82, 0.3)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="relative w-20 h-20 md:w-24 md:h-24">
                    <Image
                      src={selectedRole === role.id ? role.selectedIcon : role.defaultIcon}
                      alt={role.title}
                      fill
                      className="object-contain transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              <div
                className="mt-5 px-6 py-2 rounded-full text-center font-semibold transition-all duration-300"
                style={{
                  backgroundColor: selectedRole === role.id ? '#3d6775ff' : '#f3f4f6',
                  color: selectedRole === role.id ? '#FFFFFF' : '#374151',
                  boxShadow: selectedRole === role.id ? '0 4px 6px -1px rgba(82, 117, 128, 0.2)' : 'none'
                }}
              >
                {role.title}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col  justify-center items-center gap-4">
          {selectedRole && (
            <button
              onClick={handleContinue}
              className="px-8 py-4 font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(to right, #3d6775ff, #374151)',
                color: '#FFFFFF'
              }}
            >
              Continue as {roles.find((r) => r.id === selectedRole)?.title}
            </button>
          )}
          
          {/* Already have an account section */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-px w-16 bg-gray-300"></div>
              <span className="text-gray-500 text-sm">OR</span>
              <div className="h-px w-16 bg-gray-300"></div>
            </div>
            <button
              onClick={handleLoginRedirect}
              className="text-sm font-medium hover:underline transition-all duration-300 px-4 py-2 rounded-lg hover:bg-gray-50"
              style={{ color: '#40587fff' }}
            >
              Already have an account? <span className="font-bold">Log In</span>
            </button>
          </div>
        </div>

        {/* Alternative: Simple text link at the bottom */}
        {/* <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={handleLoginRedirect}
              className="font-bold hover:underline transition-all duration-300"
              style={{ color: '#40587fff' }}
            >
              Log In
            </button>
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default SignUpRoleSelector;