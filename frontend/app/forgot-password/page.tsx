//frontend/app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { QrCode, Mail, ArrowRight, ArrowLeft, Zap, Smartphone, LayoutDashboard, Star, Users, CheckCircle } from "lucide-react";
import "./forgot-password.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSent(true);
      console.log("Password reset email sent to:", email);
    }, 1000);
  };

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
              Don&apos;t worry, it happens to the best of us. Enter your email and we&apos;ll send you a reset link.
            </p>

            <div className="forgot-features">
              <div className="forgot-feature-item">
                <div className="forgot-feature-icon">
                  <Zap size={16} strokeWidth={1.5} />
                </div>
                <div className="forgot-feature-text">
                  <span className="forgot-feature-title">Instant Email</span>
                  <span className="forgot-feature-desc">Reset link arrives in seconds</span>
                </div>
              </div>
              <div className="forgot-feature-item">
                <div className="forgot-feature-icon">
                  <Smartphone size={16} strokeWidth={1.5} />
                </div>
                <div className="forgot-feature-text">
                  <span className="forgot-feature-title">Secure Process</span>
                  <span className="forgot-feature-desc">Link expires in 1 hour for safety</span>
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

            <div className="forgot-stats">
              <div className="forgot-stat-item">
                <div className="forgot-stat-icon">
                  <Users size={15} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="forgot-stat-number">200+</div>
                  <div className="forgot-stat-label">Restaurants</div>
                </div>
              </div>
              <div className="forgot-stat-item">
                <div className="forgot-stat-icon">
                  <Star size={15} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="forgot-stat-number">4.9</div>
                  <div className="forgot-stat-label">Rating</div>
                </div>
              </div>
            </div>

            <div className="forgot-testimonial">
              <div className="forgot-testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} fill="#C45E3A" color="#C45E3A" />
                ))}
              </div>
              <p className="forgot-testimonial-text">
                &ldquo;I forgot my password during dinner rush. The reset link arrived instantly and I was back in 2 minutes.&rdquo;
              </p>
              <div className="forgot-testimonial-author">
                <div className="forgot-testimonial-avatar"></div>
                <div>
                  <div className="forgot-testimonial-name">Rajesh Tamang</div>
                  <div className="forgot-testimonial-role">Thakali Kitchen, Lakeside</div>
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
                  <p>Enter your email to receive a reset link</p>
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
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="forgot-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>Sending link...</>
                    ) : (
                      <>
                        Send reset link
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
                <h2>Check your inbox</h2>
                <p className="forgot-success-text">
                  We&apos;ve sent a password reset link to
                </p>
                <p className="forgot-success-email">{email}</p>
                <p className="forgot-success-hint">
                  Didn&apos;t receive it? Check spam or{" "}
                  <button
                    onClick={() => {
                      setSent(false);
                      setError("");
                    }}
                    className="forgot-resend-btn"
                  >
                    try another email
                  </button>
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setError("");
                  }}
                  className="forgot-submit-btn forgot-resend-full"
                >
                  Send again
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