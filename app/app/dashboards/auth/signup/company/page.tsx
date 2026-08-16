"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/api";
import { Eye, EyeOff, Upload, X ,Info} from 'lucide-react';
import Image from "next/image";

const VendorSignupPage = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    logo: null as File | null,
    taxCard: null as File | null,
  });

  const [fieldErrors, setFieldErrors] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    logo: "",
    taxCard: "",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
      // Clear error for this field when file is selected
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const removeFile = (fieldName: "logo" | "taxCard") => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const validateForm = () => {
    const errors = {
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
      logo: "",
      taxCard: "",
    };

    let isValid = true;

    if (!formData.companyName.trim()) {
      errors.companyName = "Company name is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
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

    if (!formData.logo) {
      errors.logo = "Company logo is required";
      isValid = false;
    }

    if (!formData.taxCard) {
      errors.taxCard = "Tax card is required";
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
      const formDataToSend = new FormData();
      formDataToSend.append("companyName", formData.companyName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("logo", formData.logo!);
      formDataToSend.append("taxCard", formData.taxCard!);

      const res = await api.post("/auth/signup/vendor", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMsg("Vendor registered successfully! Please wait for admin verification.");
      setTimeout(() => router.push("/dashboards/auth/login"), 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Signup failed. Please try again.";
      
      // Map backend errors to specific fields
      if (errorMessage.toLowerCase().includes("email")) {
        setFieldErrors((prev) => ({
          ...prev,
          email: errorMessage,
        }));
      } else if (errorMessage.toLowerCase().includes("company name")) {
        setFieldErrors((prev) => ({
          ...prev,
          companyName: errorMessage,
        }));
      } else if (errorMessage.toLowerCase().includes("logo")) {
        setFieldErrors((prev) => ({
          ...prev,
          logo: errorMessage,
        }));
      } else if (errorMessage.toLowerCase().includes("tax card")) {
        setFieldErrors((prev) => ({
          ...prev,
          taxCard: errorMessage,
        }));
      } else {
        // If error doesn't match a specific field, show on company name field
        setFieldErrors((prev) => ({
          ...prev,
          companyName: errorMessage,
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

      {/* Right side (form) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 relative">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">EventSync</h2>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              Vendor Signup
            </h2>
            <p className="text-gray-600">Register your company to participate in events</p>
          </div>

          {/* Success message */}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-100 text-green-600 rounded-lg text-center font-medium">
              {successMsg}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                onKeyPress={(e) => handleKeyPress(e, handleSignup)}
                placeholder="Company Name"
                className={`w-full px-4 py-4 border-b-2 ${
                  fieldErrors.companyName ? "border-red-500" : "border-gray-300"
                } bg-transparent focus:border-gray-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-500`}
              />
              {fieldErrors.companyName && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <Info size={16} className="mr-1 flex-shrink-0" />
                  <span>{fieldErrors.companyName}</span>
                </div>
              )}
            </div>

            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={(e) => handleKeyPress(e, handleSignup)}
                placeholder="username@example.com"
                className={`w-full px-4 py-4 border-b-2 ${
                  fieldErrors.email ? "border-red-500" : "border-gray-300"
                } bg-transparent focus:border-gray-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-500`}
              />
              {fieldErrors.email && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                                  <Info size={16} className="mr-1 flex-shrink-0" />
                                  <span>{fieldErrors.email}</span>
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
                  } bg-transparent focus:border-gray-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-500`}
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
                  } bg-transparent focus:border-gray-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-500`}
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

            {/* Logo Upload */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Company Logo</label>
              <div className={`relative border-2 border-dashed ${
                fieldErrors.logo ? "border-red-500" : "border-gray-300"
              } rounded-lg p-3 hover:border-gray-400 transition-colors`}>
                {formData.logo ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Upload size={18} className="text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{formData.logo.name}</p>
                        <p className="text-xs text-gray-500">
                          {(formData.logo.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile("logo")}
                      className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0 ml-2"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex items-center justify-center py-2">
                    <Upload size={20} className="text-gray-400 mr-2" />
                    <div className="text-left">
                      <span className="text-sm text-gray-600">Upload logo</span>
                      <span className="text-xs text-gray-400 ml-2">PNG, JPG (5MB max)</span>
                    </div>
                    <input
                      type="file"
                      name="logo"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {fieldErrors.logo && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <Info size={16} className="mr-1 flex-shrink-0" />
                  <span>{fieldErrors.logo}</span>
                </div>
              )}
            </div>

            {/* Tax Card Upload */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Tax Card</label>
              <div className={`relative border-2 border-dashed ${
                fieldErrors.taxCard ? "border-red-500" : "border-gray-300"
              } rounded-lg p-3 hover:border-gray-400 transition-colors`}>
                {formData.taxCard ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Upload size={18} className="text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{formData.taxCard.name}</p>
                        <p className="text-xs text-gray-500">
                          {(formData.taxCard.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile("taxCard")}
                      className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0 ml-2"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex items-center justify-center py-2">
                    <Upload size={20} className="text-gray-400 mr-2" />
                    <div className="text-left">
                      <span className="text-sm text-gray-600">Upload tax card</span>
                      <span className="text-xs text-gray-400 ml-2">PDF, PNG, JPG (5MB max)</span>
                    </div>
                    <input
                      type="file"
                      name="taxCard"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {fieldErrors.taxCard && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                                  <Info size={16} className="mr-1 flex-shrink-0" />
                                  <span>{fieldErrors.taxCard}</span>
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
                className="text-gray-900 font-semibold underline hover:text-indigo-600 transition-colors"
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

export default VendorSignupPage;