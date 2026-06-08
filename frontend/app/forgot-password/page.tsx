// frontend/app/forgot-password/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { QrCode, Mail, ArrowRight, ArrowLeft, Zap, Smartphone, LayoutDashboard, CheckCircle } from "lucide-react";
import "./forgot-password.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [testOTP, setTestOTP] = useState<string | undefined>(undefined);

  // Redirect if already logged in (same as login page)
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No account found with this email address');
        }
        throw new Error(data.message || 'Something went wrong');
      }

      setVerifiedEmail(email);
      setTestOTP(data.testOTP);
      setSent(true);
      
      // If test OTP is provided, show it in console for development
      if (data.testOTP) {
        console.log('Test OTP:', data.testOTP);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToOTP = () => {
    router.push(`/verify-otp?email=${encodeURIComponent(verifiedEmail)}`);
  };

  // Don't render anything while checking auth or if user is logged in
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
            <h1>Reset your password</h1>
            <p className="forgot-brand-desc">
              Don&apos;t worry, it happens to the best of us. Enter your email and we&apos;ll send you an OTP to reset your password.
            </p>

            <div className="forgot-features">
              <div className="forgot-feature-item">
                <div className="forgot-feature-icon">
                  <Zap size={16} strokeWidth={1.5} />
                </div>
                <div className="forgot-feature-text">
                  <span className="forgot-feature-title">Instant OTP</span>
                  <span className="forgot-feature-desc">6-digit code arrives in seconds</span>
                </div>
              </div>
              <div className="forgot-feature-item">
                <div className="forgot-feature-icon">
                  <Smartphone size={16} strokeWidth={1.5} />
                </div>
                <div className="forgot-feature-text">
                  <span className="forgot-feature-title">Secure Verification</span>
                  <span className="forgot-feature-desc">OTP expires in 10 minutes</span>
                </div>
              </div>
              <div className="forgot-feature-item">
                <div className="forgot-feature-icon">
                  <LayoutDashboard size={16} strokeWidth={1.5} />
                </div>
                <div className="forgot-feature-text">
                  <span className="forgot-feature-title">Quick Recovery</span>
                  <span className="forgot-feature-desc">Back to your dashboard in no time</span>
                </div>
              </div>
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
                  <h2>Forgot password?</h2>
                  <p>Enter your email to receive an OTP</p>
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
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="forgot-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>Sending OTP...</>
                    ) : (
                      <>
                        Send OTP
                        <ArrowRight size={17} strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="forgot-success">
                <div className="forgot-form-icon forgot-success-icon-wrap">
                  <CheckCircle size={24} strokeWidth={1.5} />
                </div>
                <h2>OTP sent!</h2>
                <p className="forgot-success-text">
                  We&apos;ve sent a 6-digit OTP to
                </p>
                <p className="forgot-success-email">{verifiedEmail}</p>
                {testOTP && process.env.NODE_ENV !== 'production' && (
                  <div className="forgot-test-otp" style={{
                    background: '#FEF2F0',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#C45E3A'
                  }}>
                    <strong>Test OTP:</strong> {testOTP}
                  </div>
                )}
                <p className="forgot-success-hint">
                  Didn&apos;t receive it? Check spam or{" "}
                  <button
                    onClick={() => {
                      setSent(false);
                      setError("");
                      setEmail("");
                    }}
                    className="forgot-resend-btn"
                  >
                    try again
                  </button>
                </p>
                <button
                  onClick={handleGoToOTP}
                  className="forgot-submit-btn forgot-resend-full"
                >
                  Enter OTP
                  <ArrowRight size={17} strokeWidth={2.5} />
                </button>
              </div>
            )}

            <p className="forgot-login-prompt">
              Remember your password?{" "}
              <Link href="/login" className="forgot-login-link">
                Sign in
              </Link>
            </p>
          </div>

          <Link href="/login" className="forgot-back">
            <ArrowLeft size={15} strokeWidth={2} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}