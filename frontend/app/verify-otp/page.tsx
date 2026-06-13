// frontend/app/verify-otp/page.tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { QrCode, Lock, ArrowRight, ArrowLeft, CheckCircle, Eye, EyeOff, ShieldCheck, Sparkles, Mail } from "lucide-react";
import "./verify-otp.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function VerifyOTPForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailFromQuery = searchParams.get("email") || "";
  
  const [email, setEmail] = useState(emailFromQuery || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"otp" | "password">("otp");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [wasGoogleOnly, setWasGoogleOnly] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Try to get email from sessionStorage if not in query
    if (!email) {
      const storedEmail = sessionStorage.getItem("resetEmail");
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, [email]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    
    // Focus last filled or next empty
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otpString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid or expired OTP");
      }

      // OTP verified, move to password step
      setResetToken(data.resetToken);
      setStep("password");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      if (data.wasGoogleOnly) {
        setWasGoogleOnly(true);
      }

      setSuccess(true);
      sessionStorage.removeItem("resetEmail");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setResendSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setResendSuccess(true);
      setTimeout(() => {
        setResendSuccess(false);
      }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const otpString = otp.join("");

  if (success) {
    return (
      <div className="verify-form-card">
        <div className="verify-success-state">
          <div className="verify-form-icon verify-success-icon">
            <CheckCircle size={28} strokeWidth={1.5} />
          </div>
          <h2>Password {wasGoogleOnly ? "created" : "changed"}!</h2>
          <p className="verify-success-text">
            {wasGoogleOnly 
              ? "A password has been created for your account. You can now sign in with your email and new password."
              : "Your password has been reset successfully. You can now sign in with your new password."
            }
          </p>
          <Link href="/login" className="verify-submit-btn">
            Go to sign in
            <ArrowRight size={17} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-form-card">
      {step === "otp" ? (
        <>
          <div className="verify-form-header">
            <div className="verify-form-icon">
              <ShieldCheck size={20} strokeWidth={1.5} />
            </div>
            <h2>Verify OTP</h2>
            <p>
              Enter the 6-digit code sent to{" "}
              <strong>{email || "your email"}</strong>
            </p>
          </div>

          {error && <div className="verify-error">{error}</div>}
          {resendSuccess && (
            <div className="verify-resend-success">
              OTP resent successfully! Check your email.
            </div>
          )}

          <form onSubmit={handleVerifyOTP} className="verify-form">
            <div className="verify-otp-group" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="verify-otp-input"
                  disabled={loading}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <button
              type="submit"
              className="verify-submit-btn"
              disabled={loading || otpString.length !== 6}
            >
              {loading ? (
                "Verifying..."
              ) : (
                <>
                  Verify OTP
                  <ArrowRight size={17} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <div className="verify-resend">
            <p>
              Didn't receive the code?{" "}
              <button
                type="button"
                className="verify-resend-btn"
                onClick={handleResendOTP}
                disabled={loading}
              >
                Resend OTP
              </button>
            </p>
          </div>

          <Link href="/forgot-password" className="verify-back-link-inline">
            <ArrowLeft size={15} strokeWidth={2} />
            Change email address
          </Link>
        </>
      ) : (
        <>
          <div className="verify-form-header">
            <div className="verify-form-icon">
              <Lock size={20} strokeWidth={1.5} />
            </div>
            <h2>Create new password</h2>
            <p>Enter a new password for your account</p>
          </div>

          {error && <div className="verify-error">{error}</div>}

          <form onSubmit={handleResetPassword} className="verify-form">
            <div className="verify-input-group">
              <label htmlFor="newPassword">New password</label>
              <div className="verify-input-wrap">
                <Lock size={17} strokeWidth={1.5} className="verify-input-icon" />
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  className="verify-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="verify-hint">Must be at least 8 characters</p>
            </div>

            <div className="verify-input-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className="verify-input-wrap">
                <Lock size={17} strokeWidth={1.5} className="verify-input-icon" />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="verify-submit-btn"
              disabled={loading}
            >
              {loading ? (
                "Resetting password..."
              ) : (
                <>
                  Reset password
                  <ArrowRight size={17} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <Link href="/forgot-password" className="verify-back-link-inline">
            <ArrowLeft size={15} strokeWidth={2} />
            Back
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyOTPPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return null;
  }

  return (
    <div className="verify-root">
      <div className="verify-container">
        {/* Left - Brand Panel (Same as forgot password) */}
        <div className="verify-brand">
          <Link href="/" className="verify-logo">
            <QrCode size={22} strokeWidth={2} />
            <span>EasyMenu</span>
          </Link>
          
          <div className="verify-brand-content">
            <h1>
              Verify your <span>identity</span>
            </h1>
            <p className="verify-brand-desc">
              We've sent a 6-digit verification code to your email. Enter it below along with your new password to regain access to your account.
            </p>

            <div className="verify-info-cards">
              <div className="verify-info-card">
                <div className="verify-info-icon-wrap">
                  <Mail size={18} strokeWidth={1.5} />
                </div>
                <div className="verify-info-text">
                  <span className="verify-info-title">Check your inbox</span>
                  <p className="verify-info-desc">
                    We sent the OTP to <strong>{sessionStorage.getItem("resetEmail") || "your email"}</strong>. Don't forget to check spam.
                  </p>
                </div>
              </div>

              <div className="verify-info-card">
                <div className="verify-info-icon-wrap">
                  <Sparkles size={18} strokeWidth={1.5} />
                </div>
                <div className="verify-info-text">
                  <span className="verify-info-title">Secure recovery</span>
                  <p className="verify-info-desc">
                    OTP expires in 10 minutes for your security. If it expires, you can request a new one.
                  </p>
                </div>
              </div>

              <div className="verify-info-card">
                <div className="verify-info-icon-wrap">
                  <Lock size={18} strokeWidth={1.5} />
                </div>
                <div className="verify-info-text">
                  <span className="verify-info-title">Create strong password</span>
                  <p className="verify-info-desc">
                    Use at least 8 characters with a mix of letters, numbers, and symbols for better security.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="verify-brand-footer">
            <p>Secure & encrypted password recovery</p>
          </div>
        </div>

        {/* Right - Form Panel */}
        <div className="verify-form-wrap">
          <Suspense fallback={
            <div className="verify-form-card">
              <div className="verify-loading">
                <div className="verify-spinner"></div>
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