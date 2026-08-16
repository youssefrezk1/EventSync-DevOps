"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/api";
import { Eye, EyeOff,Info } from 'lucide-react';
import Image from "next/image";

const StudentSignupPage = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user types
    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const errors = {
      firstName: "",
      lastName: "",
      email: "",
      studentId: "",
      password: "",
      confirmPassword: "",
    };

    let isValid = true;

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.studentId.trim()) {
      errors.studentId = "Student ID is required";
      isValid = false;
    }

    if (!formData.password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
      isValid = false;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSignup = async () => {
    setSuccessMsg("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/signup/student", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        studentId: formData.studentId,
        password: formData.password,
      });

      setSuccessMsg(
        "Registration successful! Please check your email to verify your account."
      );
      setTimeout(() => {
        router.push("/dashboards/auth/login");
      }, 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Signup failed. Please try again.";
      
      // Map backend errors to specific fields
      if (errorMessage.toLowerCase().includes("email")) {
        setFieldErrors((prev) => ({
          ...prev,
          email: errorMessage,
        }));
      } else if (errorMessage.toLowerCase().includes("student id")) {
        setFieldErrors((prev) => ({
          ...prev,
          studentId: errorMessage,
        }));
      } else {
        // If error doesn't match a specific field, show on first name field
        setFieldErrors((prev) => ({
          ...prev,
          firstName: errorMessage,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
    action: () => void
  ) => {
    if (e.key === "Enter") action();
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side */}
           {/* Left Side */}
            <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden">
              <Image
                src="/images/main2.png"
                alt="Workspace"
                fill
                className="object-cover"
                priority
              />
              {/* Theme Overlay */}
              <div className="absolute inset-0 bg-[#a8b8c4]/10"></div>
            </div>
      

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 relative">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">EventSync</h2>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              Student Signup
            </h2>
            <p className="text-gray-600">Create your student account</p>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-100 text-green-600 rounded-lg text-center font-medium">
              {successMsg}
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className={`w-full px-4 py-4 border-b-2 ${
                    fieldErrors.firstName ? "border-red-500" : "border-gray-300"
                  } bg-transparent focus:border-blue-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-500`}
                />
                {fieldErrors.firstName && (
                   <div className="mt-1 flex items-center text-sm text-red-600">
    <Info size={16} className="mr-1 flex-shrink-0" />
    <span>{fieldErrors.firstName}</span>
  </div>
                )}
              </div>
              <div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className={`w-full px-4 py-4 border-b-2 ${
                    fieldErrors.lastName ? "border-red-500" : "border-gray-300"
                  } bg-transparent focus:border-blue-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-500`}
                />
                {fieldErrors.lastName && (
                  <div className="mt-1 flex items-center text-sm text-red-600">
    <Info size={16} className="mr-1 flex-shrink-0" />
    <span>{fieldErrors.lastName}</span>
  </div>
                )}
              </div>
            </div>

            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={(e) => handleKeyPress(e, handleSignup)}
                placeholder="username@student.guc.edu.eg"
                className={`w-full px-4 py-4 border-b-2 ${
                  fieldErrors.email ? "border-red-500" : "border-gray-300"
                } bg-transparent focus:border-blue-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-500`}
              />
              {fieldErrors.email && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <Info size={16} className="mr-1 flex-shrink-0" />
                  <span>{fieldErrors.email}</span>
                </div>
              )}
            </div>

            <div>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                onKeyPress={(e) => handleKeyPress(e, handleSignup)}
                placeholder="Student ID"
                className={`w-full px-4 py-4 border-b-2 ${
                  fieldErrors.studentId ? "border-red-500" : "border-gray-300"
                } bg-transparent focus:border-blue-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-500`}
              />
              {fieldErrors.studentId && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <Info size={16} className="mr-1 flex-shrink-0" />
                  <span>{fieldErrors.studentId}</span>
                </div>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={(e) => handleKeyPress(e, handleSignup)}
                  placeholder="Password"
                  className={`w-full px-4 py-4 pr-12 border-b-2 ${
                    fieldErrors.password ? "border-red-500" : "border-gray-300"
                  } bg-transparent focus:border-blue-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-500`}
                  style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <Info size={16} className="mr-1 flex-shrink-0" />
                  <span>{fieldErrors.password}</span>
                </div>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type="text"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onKeyPress={(e) => handleKeyPress(e, handleSignup)}
                  placeholder="Confirm Password"
                  className={`w-full px-4 py-4 pr-12 border-b-2 ${
                    fieldErrors.confirmPassword ? "border-red-500" : "border-gray-300"
                  } bg-transparent focus:border-blue-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-500`}
                  style={{ WebkitTextSecurity: showConfirmPassword ? 'none' : 'disc' } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <Info size={16} className="mr-1 flex-shrink-0" />
                  <span>{fieldErrors.confirmPassword}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            <div className="text-center">
              <span className="text-gray-500">Already have an account? </span>
              <button
                onClick={() => router.push("/dashboards/auth/login")}
                className="text-blue-900 font-semibold underline hover:text-indigo-600 transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="center bottom-1 w-full text-center absolute">
          <p className="text-indigo-200 text-sm">
            © {new Date().getFullYear()} EventSync. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentSignupPage;