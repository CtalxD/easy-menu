// frontend/app/contexts/AuthContext.tsx

"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  restaurant: {
    id: string;
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string, restaurant: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  };

  const setAccessToken = (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', token);
  };

  const clearAuth = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (isRefreshing) {
      return null;
    }

    setIsRefreshing(true);
    
    try {
      const refreshResponse = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setAccessToken(refreshData.accessToken);
        return refreshData.accessToken;
      }
      
      if (refreshResponse.status !== 401) {
        console.error('Token refresh failed with status:', refreshResponse.status);
      }
    } catch (error) {
      console.error('Network error during token refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
    return null;
  };

  const verifyAccessToken = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return userData.user;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
    }
    return null;
  };

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      
      if (token) {
        const userData = await verifyAccessToken(token);
        if (userData) {
          setUser(userData);
          setLoading(false);
          return;
        }
        console.log('Access token expired, attempting refresh...');
        
        const newToken = await refreshAccessToken();
        if (newToken) {
          const userData = await verifyAccessToken(newToken);
          if (userData) {
            setUser(userData);
            setLoading(false);
            return;
          }
        }
        
        clearAuth();
      } else {
        clearAuth();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const signup = async (name: string, email: string, password: string, restaurant: string) => {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name, email, password, restaurant }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      const token = getAccessToken();
      
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}