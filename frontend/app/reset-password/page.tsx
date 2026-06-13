// frontend/app/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { QrCode, Mail, ArrowRight, ArrowLeft, CheckCircle, Send, Sparkles } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import "./reset-password.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email address is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Always try backend OTP flow first (works for all account types including Google-only)
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset OTP");
      }

      // Store email for the verify-otp page
      sessionStorage.setItem("resetEmail", email.trim());
      
      setSent(true);
      setSuccess(`We've sent a 6-digit OTP to ${email}. Please check your inbox.`);
      
      // In development, log OTP from response if available
      if (data.devOtp && process.env.NODE_ENV === 'development') {
        console.log('DEV OTP:', data.devOtp);
      }
      
      // Redirect to OTP verification page after a short delay
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
      }, 1500);
      
    } catch (backendError: any) {
      console.log("Backend OTP failed, trying Firebase fallback:", backendError.message);
      
      // If backend fails, try Firebase as fallback for email/password users
      try {
        await sendPasswordResetEmail(auth, email, {
          url: `${window.location.origin}/login`,
          handleCodeInApp: true,
        });

        setSent(true);
        setSuccess(`We've sent a password reset link to ${email}. Check your inbox and follow the instructions.`);
        
        // Store email in session storage in case they need OTP fallback
        sessionStorage.setItem("resetEmail", email.trim());
        
      } catch (firebaseError: any) {
        console.error("Firebase reset also failed:", firebaseError.code);
        setError(backendError.message || "Failed to send reset email. Please try again.");
        setSent(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setSent(false);
    setError("");
    setSuccess("");
  };

  if (authLoading || user) {
    return null;
  }

  return (
    <div className="forgot-root">
      <div className="forgot-container">
        {/* Left - Brand */}
        <div className="forgot-brand">
          <Link href="/" className="forgot-logo">
            <QrCode size={22} strokeWidth={2} />
            <span>EasyMenu</span>
          </Link>
          
          <div className="forgot-brand-content">
            <h1>
              Forgot your <span>password?</span>
            </h1>
            <p className="forgot-brand-desc">
              No worries — it happens. We'll send you a reset link or OTP to get you back into your dashboard quickly.
            </p>

            <div className="forgot-value-prop">
              <div className="forgot-value-icon-wrap">
                <div className="forgot-value-icon-small">
                  <Sparkles size={14} strokeWidth={1.5} />
                </div>
                <span className="forgot-value-title">Secure & fast recovery</span>
              </div>
              <p className="forgot-value-desc">
                Reset links and OTPs expire for your safety. If you don't see the email, check your spam folder or request a new one.
              </p>
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div className="forgot-form-wrap">
          <div className="forgot-form-card">
            {!sent ? (
              <>
                <div className="forgot-form-header">
                  <div className="forgot-form-icon">
                    <Mail size={20} strokeWidth={1.5} />
                  </div>
                  <h2>Reset your password</h2>
                  <p>Enter your email and we'll send you a reset link or OTP</p>
                </div>

                {error && <div className="forgot-error">{error}</div>}

                <form onSubmit={handleSubmit} className="forgot-form">
                  <div className="forgot-input-group">
                    <label htmlFor="email">Email address</label>
                    <div className="forgot-input-wrap">
                      <Mail size={17} strokeWidth={1.5} className="forgot-input-icon" />
                      <input
                        id="email"
                        type="email"
                        placeholder="name@restaurant.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="forgot-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      "Sending..."
                    ) : (
                      <>
                        Send reset link
                        <Send size={17} strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="forgot-success-state">
                  <div className="forgot-form-icon forgot-success-icon">
                    <CheckCircle size={28} strokeWidth={1.5} />
                  </div>
                  <h2>Check your email</h2>
                  <p className="forgot-success-text">{success}</p>
                  
                  <div className="forgot-success-actions">
                    <button
                      type="button"
                      className="forgot-submit-btn"
                      onClick={handleResend}
                    >
                      Send again
                      <Send size={17} strokeWidth={2.5} />
                    </button>
                    
                    <Link href="/login" className="forgot-back-link">
                      <ArrowLeft size={15} strokeWidth={2} />
                      Back to sign in
                    </Link>
                  </div>

                  <p className="forgot-spam-hint">
                    Didn't receive it? Check your spam folder or verify the email address is correct.
                  </p>
                </div>
              </>
            )}

            {!sent && (
              <p className="forgot-login-prompt">
                Remember your password?{" "}
                <Link href="/login" className="forgot-login-link">
                  Sign in
                </Link>
              </p>
            )}
          </div>

          <Link href="/login" className="forgot-back">
            <ArrowLeft size={15} strokeWidth={2} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}