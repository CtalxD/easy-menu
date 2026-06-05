//frontend/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { QrCode, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Zap, Smartphone, LayoutDashboard, Sparkles } from "lucide-react";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email address is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password, rememberMe);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return null;
  }

  return (
    <div className="login-root">
      <div className="login-container">
        {/* Left - Brand */}
        <div className="login-brand">
          <Link href="/" className="login-logo">
            <QrCode size={22} strokeWidth={2} />
            <span>EasyMenu</span>
          </Link>
          
          <div className="login-brand-content">
            <h1>
              Welcome <span>back</span>
            </h1>
            <p className="login-brand-desc">
              Sign in to manage your digital menu, update items, and keep your restaurant running smoothly.
            </p>

            <div className="login-features">
              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <Zap size={16} strokeWidth={1.5} />
                </div>
                <div className="login-feature-text">
                  <span className="login-feature-title">Instant updates</span>
                  <span className="login-feature-desc">Edit menu items and prices in seconds</span>
                </div>
              </div>
              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <Smartphone size={16} strokeWidth={1.5} />
                </div>
                <div className="login-feature-text">
                  <span className="login-feature-title">QR code ready</span>
                  <span className="login-feature-desc">Generate and download QR codes instantly</span>
                </div>
              </div>
              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <LayoutDashboard size={16} strokeWidth={1.5} />
                </div>
                <div className="login-feature-text">
                  <span className="login-feature-title">Simple dashboard</span>
                  <span className="login-feature-desc">Manage everything from one place</span>
                </div>
              </div>
            </div>

            <div className="login-value-prop">
              <div className="login-value-icon-wrap">
                <div className="login-value-icon-small">
                  <Sparkles size={14} strokeWidth={1.5} />
                </div>
                <span className="login-value-title">Pick up where you left off</span>
              </div>
              <p className="login-value-desc">
                Your menu, settings, and QR codes are exactly as you left them. Sign in to continue managing your restaurant.
              </p>
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div className="login-form-wrap">
          <div className="login-form-card">
            <div className="login-form-header">
              <div className="login-form-icon">
                <Lock size={20} strokeWidth={1.5} />
              </div>
              <h2>Sign in</h2>
              <p>Access your dashboard to manage your menu</p>
            </div>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-input-group">
                <label htmlFor="email">Email address</label>
                <div className="login-input-wrap">
                  <Mail size={17} strokeWidth={1.5} className="login-input-icon" />
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

              <div className="login-input-group">
                <label htmlFor="password">Password</label>
                <div className="login-input-wrap">
                  <Lock size={17} strokeWidth={1.5} className="login-input-icon" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff size={17} strokeWidth={1.5} />
                    ) : (
                      <Eye size={17} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              <div className="login-form-options">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span>Remember for 30 days</span>
                </label>
                <Link href="/forgot-password" className="login-forgot">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={17} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            <p className="login-signup-prompt">
              New to EasyMenu?{" "}
              <Link href="/signup" className="login-signup-link">
                Create an account
              </Link>
            </p>
          </div>

          <Link href="/" className="login-back">
            <ArrowLeft size={15} strokeWidth={2} />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}