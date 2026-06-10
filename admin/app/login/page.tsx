"use client";

import { useState, FormEvent } from "react";
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import "./login.css";

interface LoginResponse {
  message: string;
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    admin: boolean;
    verified: boolean;
    restaurantId: string | null;
    restaurant: {
      id: string;
      name: string;
      plan: string;
    } | null;
  };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const currentYear: string = new Date().getFullYear().toString();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password,
          rememberMe: true 
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.user?.admin) {
        throw new Error('Access denied. Staff privileges required.');
      }

      localStorage.setItem('adminToken', data.accessToken);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      if (data.user.restaurantId) {
        localStorage.setItem('adminRestaurantId', data.user.restaurantId);
        localStorage.setItem('adminRestaurantName', data.user.restaurant?.name || '');
        localStorage.setItem('adminRestaurantPlan', data.user.restaurant?.plan || 'FREE');
      }

      router.push('/dashboard');
      
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Unable to connect to server. Please try again later.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-container">
        <div className="admin-login-card">
          {/* Header */}
          <div className="login-header">
            <div className="admin-logo">
              <Shield size={26} />
            </div>
            <h1 className="admin-title">EasyMenu</h1>
            <p className="admin-subtitle">Staff Control Panel</p>
            <span className="admin-badge">Restricted Access</span>
            <p className="admin-description">
              Authorized EasyMenu staff only. All login attempts are monitored and logged.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={16} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <button type="button" className="forgot-link" tabIndex={-1}>
                  Forgot password?
                </button>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Authenticating...
                </>
              ) : (
                'Sign in to Control Panel'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="login-footer">
          &copy; {currentYear} EasyMenu. All rights reserved. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}