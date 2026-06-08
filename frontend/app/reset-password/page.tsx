// frontend/app/reset-password/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { QrCode, Lock, ArrowRight, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import "./reset-password.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [validating, setValidating] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidToken(false);
        setValidating(false);
        setError("No reset token provided");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/validate-token?token=${token}`);
        const data = await response.json();
        
        if (data.valid) {
          setValidToken(true);
        } else {
          setValidToken(false);
          setError(data.message || "Invalid or expired reset link");
        }
      } catch (err) {
        setValidToken(false);
        setError("Failed to validate reset link");
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetToken: token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Clear stored reset token
      localStorage.removeItem('resetToken');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="reset-form-card">
        <div className="reset-validating">
          <div className="reset-spinner"></div>
          <p>Validating your reset link...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="reset-form-card">
        <div className="reset-error-state">
          <div className="reset-form-icon reset-error-icon">
            <Lock size={24} strokeWidth={1.5} />
          </div>
          <h2>Invalid or expired link</h2>
          <p className="reset-error-text">
            This password reset link is invalid or has expired.
          </p>
          <Link href="/forgot-password" className="reset-submit-btn">
            Request new OTP
            <ArrowRight size={17} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-form-card">
        <div className="reset-success-state">
          <div className="reset-form-icon reset-success-icon">
            <CheckCircle size={28} strokeWidth={1.5} />
          </div>
          <h2>Password reset successful!</h2>
          <p className="reset-success-text">
            Your password has been changed. You can now log in with your new password.
          </p>
          <Link href="/login" className="reset-submit-btn">
            Go to login
            <ArrowRight size={17} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-form-card">
      <div className="reset-form-header">
        <div className="reset-form-icon">
          <Lock size={20} strokeWidth={1.5} />
        </div>
        <h2>Create new password</h2>
        <p>Enter a new password for your account</p>
      </div>

      {error && <div className="reset-error">{error}</div>}

      <form onSubmit={handleSubmit} className="reset-form">
        <div className="reset-input-group">
          <label htmlFor="password">New password</label>
          <div className="reset-input-wrap">
            <Lock size={17} strokeWidth={1.5} className="reset-input-icon" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="reset-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="reset-hint">Must be at least 8 characters</p>
        </div>

        <div className="reset-input-group">
          <label htmlFor="confirmPassword">Confirm password</label>
          <div className="reset-input-wrap">
            <Lock size={17} strokeWidth={1.5} className="reset-input-icon" />
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
          className="reset-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>Resetting password...</>
          ) : (
            <>
              Reset password
              <ArrowRight size={17} strokeWidth={2.5} />
            </>
          )}
        </button>
      </form>

      <p className="reset-login-prompt">
        Remember your password?{" "}
        <Link href="/login" className="reset-login-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
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
    <div className="reset-root">
      <div className="reset-container">
        <div className="reset-brand">
          <Link href="/" className="reset-logo">
            <QrCode size={22} strokeWidth={2} />
            <span>EasyMenu</span>
          </Link>
          
          <div className="reset-brand-content">
            <h1>Create new password</h1>
            <p className="reset-brand-desc">
              Your new password must be different from previously used passwords.
            </p>
          </div>
        </div>

        <div className="reset-form-wrap">
          <Suspense fallback={
            <div className="reset-form-card">
              <div className="reset-validating">
                <div className="reset-spinner"></div>
                <p>Loading...</p>
              </div>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>

          <Link href="/login" className="reset-back">
            <ArrowLeft size={15} strokeWidth={2} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}