// frontend/app/signup/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { QrCode, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Zap, Smartphone, LayoutDashboard, Sparkles, User, Store } from "lucide-react";
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

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
      const response = await fetch("http://localhost:5000/api/auth/signup", {
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

            {error && <div className="signup-error">{error}</div>}
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
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="signup-password-toggle"
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
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="signup-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    disabled={loading}
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
                disabled={loading}
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