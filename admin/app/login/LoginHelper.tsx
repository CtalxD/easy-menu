"use client";

import { useEffect } from "react";

export default function LoginHelper() {
  useEffect(() => {
    // Auto-fill and login for development
    const autoLogin = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            email: 'admin@easymenu.com', 
            password: 'Admin@123!',
            rememberMe: true 
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Auto-login successful:', data.user.email);
          console.log('Access Token:', data.accessToken?.substring(0, 20) + '...');
        } else {
          const error = await response.json();
          console.error('❌ Auto-login failed:', error);
        }
      } catch (err) {
        console.error('❌ Auto-login error:', err);
      }
    };

    // Uncomment to test auto-login:
    // autoLogin();
  }, []);

  return null;
}