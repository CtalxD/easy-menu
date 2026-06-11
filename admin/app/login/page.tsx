// admin/app/login/page.tsx
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
  const [debugInfo, setDebugInfo] = useState<string>("");
  const currentYear: string = new Date().getFullYear().toString();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setDebugInfo("");
    setLoading(true);

    try {
      // Get API URL from environment or use default
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const loginUrl = `${API_URL}/api/auth/login`;
      
      console.log('Attempting login to:', loginUrl);
      setDebugInfo(`Connecting to: ${loginUrl}`);

      const response = await fetch(loginUrl, {
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

      console.log('Response status:', response.status);
      setDebugInfo(`Response status: ${response.status}`);

      const data: LoginResponse = await response.json();
      console.log('Login response:', data);

      // Check if login was successful
      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      // Check if user exists in response
      if (!data.user) {
        throw new Error('User account not found');
      }

      // Check if user has admin privileges
      if (!data.user.admin) {
        throw new Error('Access denied. Administrator privileges required. This area is restricted to authorized staff only.');
      }

      // Verify we received an access token
      if (!data.accessToken) {
        throw new Error('Authentication failed. No access token received.');
      }

      // Store admin session data
      localStorage.setItem('adminToken', data.accessToken);
      localStorage.setItem('adminUser', JSON.stringify({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        admin: data.user.admin,
        verified: data.user.verified,
        restaurant: data.user.restaurant
      }));
      
      // Store restaurant info if available
      if (data.user.restaurant) {
        localStorage.setItem('adminRestaurantId', data.user.restaurant.id);
        localStorage.setItem('adminRestaurantName', data.user.restaurant.name);
        localStorage.setItem('adminRestaurantPlan', data.user.restaurant.plan);
      }

      setDebugInfo('Login successful! Redirecting...');
      
      // Small delay to show success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
      
    } catch (err: unknown) {
      console.error('Admin login error:', err);
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Unable to connect to server. Please check:\n• Backend server is running on port 5000\n• CORS is properly configured\n• No browser extensions blocking requests');
        setDebugInfo('Connection failed - check if backend is running');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
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

          {/* Error Message */}
          {error && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <div>
                {error.split('\n').map((line, index) => (
                  <span key={index}>
                    {line}
                    <br />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Debug Info */}
          {debugInfo && (
            <div className="debug-info" style={{
              backgroundColor: '#f0f0f0',
              padding: '8px 12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#666'
            }}>
              {debugInfo}
            </div>
          )}

          {/* Login Form */}
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