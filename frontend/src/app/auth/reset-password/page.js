"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import PasswordStrengthIndicator from "@/components/ui/PasswordStrengthIndicator";
import { validateForm } from "@/utils/validation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [resetParams, setResetParams] = useState({ userId: null, secret: null });
  const [isValidLink, setIsValidLink] = useState(false);

  // Extract reset parameters from URL
  useEffect(() => {
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");
    
    if (userId && secret) {
      setResetParams({ userId, secret });
      setIsValidLink(true);
    } else {
      setAlert({
        type: "error",
        message: "Invalid or missing reset parameters. Please request a new password reset."
      });
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    
    if (!isValidLink) {
      setAlert({
        type: "error",
        message: "Invalid reset link. Please request a new password reset."
      });
      return;
    }
    
    // Validation rules
    const rules = {
      password: { required: true, type: "password", label: "Password" },
      confirmPassword: {
        required: true,
        label: "Confirm Password",
        validator: (value) => ({
          isValid: value === formData.password,
          error: "Passwords do not match"
        })
      }
    };

    const validation = validateForm(formData, rules);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    
    try {
      const result = await resetPassword(
        resetParams.userId, 
        resetParams.secret, 
        formData.password
      );
      
      if (result.success) {
        setAlert({
          type: "success",
          message: result.message || "Password reset successfully!"
        });
        
        // Redirect to login page after successful reset
        setTimeout(() => {
          router.push("/auth/login?message=password-reset-success");
        }, 2000);
      } else {
        setAlert({
          type: "error",
          message: result.error || "Failed to reset password. The reset link may have expired."
        });
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setAlert({
        type: "error",
        message: "An unexpected error occurred. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isValidLink && !alert) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reset Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your new password below
          </p>
        </div>

        <Card>
          {alert && (
            <Alert 
              variant={alert.type} 
              className="mb-6"
              onClose={() => setAlert(null)}
            >
              {alert.message}
            </Alert>
          )}

          {isValidLink ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="New Password"
                  name="password"
                  type="password"
                  placeholder="Enter your new password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  showPasswordToggle={true}
                  required
                  autoComplete="new-password"
                />
                <PasswordStrengthIndicator password={formData.password} />
              </div>

              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                showPasswordToggle={true}
                required
                autoComplete="new-password"
              />

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Password Requirements
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• At least one uppercase letter</li>
                  <li>• At least one lowercase letter</li>
                  <li>• At least one number</li>
                </ul>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                {loading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <svg className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Invalid Reset Link
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  This password reset link is invalid or has expired.
                </p>
              </div>

              <Button
                onClick={() => router.push("/auth/forgot-password")}
                variant="primary"
                size="md"
                className="w-full"
              >
                Request New Reset Link
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 underline"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}