// frontend/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { QrCode, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Zap, Smartphone, LayoutDashboard, Sparkles } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setGoogleLoading(true);

    try {
      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Send only email to backend (no token verification needed)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/google-signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Google sign-in failed");
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.isNewUser) {
        setSuccess("Account created with Google! Redirecting...");
      } else {
        setSuccess("Signed in with Google successfully! Redirecting...");
      }
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

    } catch (err: any) {
      console.error("Google sign-in error:", err);
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in popup was closed. Please try again.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignore, user just clicked outside
      } else if (err.code === 'auth/popup-blocked') {
        setError("Pop-up was blocked by your browser. Please allow pop-ups for this site.");
      } else if (err.message?.includes('Cross-Origin')) {
        // Suppress COOP errors - these are harmless
        console.log('COOP warning suppressed - this is expected behavior');
      } else {
        setError(err.message || "Failed to sign in with Google. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (cooldown) return;

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
      const message = err instanceof Error ? err.message : "Invalid email or password. Please try again.";
      setError(message);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);
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
            {success && <div className="login-success">{success}</div>}

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
                    disabled={loading || googleLoading || cooldown}
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
                    disabled={loading || googleLoading || cooldown}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    disabled={loading || googleLoading || cooldown}
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
                    disabled={loading || googleLoading || cooldown}
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
                disabled={loading || googleLoading || cooldown}
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

            <div className="login-divider">
              <span>or continue with</span>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              className="login-google-btn"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <>
                  <div className="login-google-spinner" />
                  Signing in with Google...
                </>
              ) : (
                <>
                  <svg className="login-google-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

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