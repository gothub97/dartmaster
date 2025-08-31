"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import { validateForm } from "@/utils/validation";

export default function ForgotPasswordPage() {
  const { sendPasswordRecovery } = useAuth();
  
  const [formData, setFormData] = useState({
    email: ""
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

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
    
    // Validation rules
    const rules = {
      email: { required: true, type: "email", label: "Email" }
    };

    const validation = validateForm(formData, rules);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    
    try {
      const result = await sendPasswordRecovery(formData.email);
      
      if (result.success) {
        setEmailSent(true);
        setAlert({
          type: "success",
          message: result.message || "Password recovery email sent! Please check your inbox."
        });
      } else {
        setAlert({
          type: "error",
          message: result.error || "Failed to send recovery email. Please try again."
        });
      }
    } catch (error) {
      console.error("Password recovery error:", error);
      setAlert({
        type: "error",
        message: "An unexpected error occurred. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
    setAlert(null);
    handleSubmit({ preventDefault: () => {} });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2v6a2 2 0 01-2 2 6 6 0 01-12 0v-4a2 2 0 012-2 2 2 0 012-2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Forgot Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your email address and we'll send you a link to reset your password
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

          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Recovery Email"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <svg className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                  Check Your Email
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                  We've sent a password recovery link to <strong>{formData.email}</strong>
                </p>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>Didn't receive the email?</p>
                <ul className="text-xs space-y-1">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure the email address is correct</li>
                  <li>• Wait a few minutes for the email to arrive</li>
                </ul>
              </div>

              <Button
                onClick={handleResend}
                variant="outline"
                size="md"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                Resend Email
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

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{" "}
            <Link 
              href="/auth/login" 
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}