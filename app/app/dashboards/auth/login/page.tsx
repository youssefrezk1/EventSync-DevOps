"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/api";
import { Info } from "lucide-react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

const LoginPage: React.FC = () => {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    email: string;
    password: string;
    general: string;
  }>({
    email: "",
    password: "",
    general: "",
  });

  const validateEmail = (value: string): string => {
    if (!value) {
      return "Email is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePassword = (value: string): string => {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setErrors((prev) => ({ ...prev, email: "", general: "" }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setErrors((prev) => ({ ...prev, password: "", general: "" }));
  };

  const handleLogin = async () => {
    // Validate fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
        general: "",
      });
      return;
    }

    setLoading(true);
    setErrors({ email: "", password: "", general: "" });

    try {
      const res = await api.post("/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("email", res.data.email);
      localStorage.setItem("firstName", res.data.firstName);
      localStorage.setItem("lastName", res.data.lastName);
      localStorage.setItem("studentId", res.data.studentId || res.data.staffId);

      router.push("/dashboards/auth");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Login failed. Please try again.";

      // Check if it's an email/password error and set general error
      if (
        errorMessage.toLowerCase().includes("email") ||
        errorMessage.toLowerCase().includes("password") ||
        errorMessage.toLowerCase().includes("invalid")
      ) {
        setErrors((prev) => ({ ...prev, general: errorMessage }));
      } else {
        // For other errors (pending, blocked, verification), show as general
        setErrors((prev) => ({ ...prev, general: errorMessage }));
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
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 relative">
        <div className="w-full max-w-md">
          
          <div className="lg:hidden mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">EventSync</h2>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              Welcome Back!
            </h2>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                placeholder="you@example.com"
                className={`w-full px-4 py-4 border-b-2 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } bg-transparent focus:border-gray-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-500`}
              />
              {errors.email && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <Info size={16} className="mr-1 flex-shrink-0" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            {/* Password Field */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                  placeholder="Password"
                  className={`w-full px-4 py-4 pr-12 border-b-2 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } bg-transparent focus:border-gray-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-500`}
                  style={
                    {
                      WebkitTextSecurity: showPassword ? "none" : "disc",
                    } as React.CSSProperties
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {errors.password && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <Info size={16} className="mr-1 flex-shrink-0" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>
            {/* General Error Message */}
            {errors.general && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">
                  {errors.general}
                </p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login Now"}
            </button>

            <div className="text-center">
              <span className="text-gray-500">Don't have an account? </span>
              <button
                onClick={() => router.push("/dashboards/auth/signup")}
                className="text-gray-900 font-semibold underline hover:text-indigo-600 transition-colors"
              >
                Sign Up
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

export default LoginPage;
