// frontend/app/verify-otp/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { QrCode, KeyRound, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import "./verify-otp.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function VerifyOTPForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.push('/forgot-password');
    }
  }, [email, router]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleResendOTP = async () => {
    if (resendDisabled || !email) return;

    setResendDisabled(true);
    setCountdown(60);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        console.error('Failed to resend OTP');
      }
    } catch (err) {
      console.error('Resend error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      // Store reset token and redirect to reset password
      localStorage.setItem('resetToken', data.resetToken);
      router.push(`/reset-password?token=${data.resetToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="verify-otp-form-card">
      <div className="verify-otp-form-header">
        <div className="verify-otp-form-icon">
          <KeyRound size={20} strokeWidth={1.5} />
        </div>
        <h2>Enter verification code</h2>
        <p>We've sent a 6-digit OTP to <strong>{email}</strong></p>
      </div>

      {error && <div className="verify-otp-error">{error}</div>}

      <form onSubmit={handleSubmit} className="verify-otp-form">
        <div className="verify-otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="verify-otp-input"
              autoFocus={index === 0}
              disabled={loading}
            />
          ))}
        </div>

        <button
          type="submit"
          className="verify-otp-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>Verifying...</>
          ) : (
            <>
              Verify OTP
              <ArrowRight size={17} strokeWidth={2.5} />
            </>
          )}
        </button>
      </form>

      <div className="verify-otp-resend">
        <p>
          Didn't receive the code?{" "}
          <button
            onClick={handleResendOTP}
            disabled={resendDisabled}
            className="verify-otp-resend-btn"
          >
            {resendDisabled ? `Resend in ${countdown}s` : "Resend OTP"}
          </button>
        </p>
      </div>

      <p className="verify-otp-back-prompt">
        <Link href="/forgot-password" className="verify-otp-back-link">
          <ArrowLeft size={14} strokeWidth={2} />
          Back to forgot password
        </Link>
      </p>
    </div>
  );
}

export default function VerifyOTPPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Redirect if already logged in (same as login page)
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  // Don't render anything while checking auth or if user is logged in
  if (authLoading || user) {
    return null;
  }

  return (
    <div className="verify-otp-root">
      <div className="verify-otp-container">
        <div className="verify-otp-brand">
          <Link href="/" className="verify-otp-logo">
            <QrCode size={22} strokeWidth={2} />
            <span>EasyMenu</span>
          </Link>
          
          <div className="verify-otp-brand-content">
            <h1>Verify your identity</h1>
            <p className="verify-otp-brand-desc">
              Enter the 6-digit OTP sent to your email to reset your password.
            </p>
          </div>
        </div>

        <div className="verify-otp-form-wrap">
          <Suspense fallback={
            <div className="verify-otp-form-card">
              <div className="verify-otp-validating">
                <div className="verify-otp-spinner"></div>
                <p>Loading...</p>
              </div>
            </div>
          }>
            <VerifyOTPForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}