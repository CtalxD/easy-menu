// frontend/app/signup/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { QrCode, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Zap, Smartphone, LayoutDashboard, Sparkles, User, Store } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import "./signup.css";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      
      // Send to backend to create/authenticate user (no token needed)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/google-signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          restaurant: restaurantName || `${firebaseUser.displayName}'s Restaurant`,
          isSignUp: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.userExists) {
          setError("An account with this email already exists. Please sign in instead.");
          return;
        }
        throw new Error(data.message || "Google sign-in failed");
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccess("Account created with Google successfully! Redirecting...");
      
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

    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError("Email address is required");
      return;
    }
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!restaurantName.trim()) {
      setError("Restaurant name is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          restaurant: restaurantName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccess("Account created successfully! Redirecting...");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return null;
  }

  return (
    <div className="signup-root">
      <div className="signup-container">
        {/* Left - Brand */}
        <div className="signup-brand">
          <Link href="/" className="signup-logo">
            <QrCode size={22} strokeWidth={2} />
            <span>EasyMenu</span>
          </Link>
          
          <div className="signup-brand-content">
            <h1>
              Your restaurant deserves a <span>digital menu</span>
            </h1>
            <p className="signup-brand-desc">
              Ditch the paper. Create a beautiful, easy-to-update digital menu your customers will love - no technical skills needed.
            </p>

            <div className="signup-features">
              <div className="signup-feature-item">
                <div className="signup-feature-icon">
                  <Zap size={16} strokeWidth={1.5} />
                </div>
                <div className="signup-feature-text">
                  <span className="signup-feature-title">Set up in minutes</span>
                  <span className="signup-feature-desc">Add items, organize categories, go live - all in one sitting</span>
                </div>
              </div>
              <div className="signup-feature-item">
                <div className="signup-feature-icon">
                  <Smartphone size={16} strokeWidth={1.5} />
                </div>
                <div className="signup-feature-text">
                  <span className="signup-feature-title">Instant QR code</span>
                  <span className="signup-feature-desc">Generate a QR code customers scan to see your menu instantly</span>
                </div>
              </div>
              <div className="signup-feature-item">
                <div className="signup-feature-icon">
                  <LayoutDashboard size={16} strokeWidth={1.5} />
                </div>
                <div className="signup-feature-text">
                  <span className="signup-feature-title">Manage from anywhere</span>
                  <span className="signup-feature-desc">Update prices, availability, or specials anytime, from any device</span>
                </div>
              </div>
            </div>

            <div className="signup-value-prop">
              <div className="signup-value-icon-wrap">
                <div className="signup-value-icon-small">
                  <Sparkles size={14} strokeWidth={1.5} />
                </div>
                <span className="signup-value-title">Start free, scale when ready</span>
              </div>
              <p className="signup-value-desc">
                Free plan includes up to 10 menu items and 5 categories - perfect for getting started. Upgrade anytime to unlock more.
              </p>
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div className="signup-form-wrap">
          <div className="signup-form-card">
            <div className="signup-form-header">
              <div className="signup-form-icon">
                <User size={20} strokeWidth={1.5} />
              </div>
              <h2>Create your account</h2>
              <p>No credit card required</p>
            </div>

            {error && (
              <div className="signup-error">
                {error}
                {error.includes("already exists") && (
                  <div style={{ marginTop: '8px' }}>
                    <Link 
                      href="/login" 
                      style={{ 
                        color: 'var(--terra)', 
                        fontWeight: 600,
                        textDecoration: 'underline',
                        fontSize: 'inherit'
                      }}
                    >
                      Go to sign in →
                    </Link>
                  </div>
                )}
              </div>
            )}
            {success && <div className="signup-success">{success}</div>}

            <form onSubmit={handleSubmit} className="signup-form">
              <div className="signup-input-group">
                <label htmlFor="name">Full name</label>
                <div className="signup-input-wrap">
                  <User size={17} strokeWidth={1.5} className="signup-input-icon" />
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
              </div>

              <div className="signup-input-group">
                <label htmlFor="email">Email address</label>
                <div className="signup-input-wrap">
                  <Mail size={17} strokeWidth={1.5} className="signup-input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
              </div>

              <div className="signup-input-group">
                <label htmlFor="restaurant">Restaurant name</label>
                <div className="signup-input-wrap">
                  <Store size={17} strokeWidth={1.5} className="signup-input-icon" />
                  <input
                    id="restaurant"
                    type="text"
                    placeholder="Your restaurant or cafe name"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
              </div>

              <div className="signup-input-group">
                <label htmlFor="password">Password</label>
                <div className="signup-input-wrap">
                  <Lock size={17} strokeWidth={1.5} className="signup-input-icon" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                  <button
                    type="button"
                    className="signup-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    disabled={loading || googleLoading}
                  >
                    {showPassword ? (
                      <EyeOff size={17} strokeWidth={1.5} />
                    ) : (
                      <Eye size={17} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              <div className="signup-input-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <div className="signup-input-wrap">
                  <Lock size={17} strokeWidth={1.5} className="signup-input-icon" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                  <button
                    type="button"
                    className="signup-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    disabled={loading || googleLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} strokeWidth={1.5} />
                    ) : (
                      <Eye size={17} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="signup-submit-btn"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>Creating account...</>
                ) : (
                  <>
                    Start free trial
                    <ArrowRight size={17} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            <div className="signup-divider">
              <span>or continue with</span>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              className="signup-google-btn"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <>
                  <div className="signup-google-spinner" />
                  Signing in with Google...
                </>
              ) : (
                <>
                  <svg className="signup-google-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <p className="signup-terms">
              By signing up, you agree to our{" "}
              <Link href="/terms">Terms of Service</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>
            </p>

            <p className="signup-login-prompt">
              Already have an account?{" "}
              <Link href="/login" className="signup-login-link">
                Sign in
              </Link>
            </p>
          </div>

          <Link href="/" className="signup-back">
            <ArrowLeft size={15} strokeWidth={2} />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}