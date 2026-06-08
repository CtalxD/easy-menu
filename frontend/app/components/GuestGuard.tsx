// frontend/app/components/GuestGuard.tsx

"use client";

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function GuestGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // If user is logged in, redirect to dashboard
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="guest-loading" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#FAF7F2',
        gap: '20px',
        fontFamily: "'Outfit', sans-serif",
      }}>
        <Loader2 
          size={40} 
          strokeWidth={1.5} 
          style={{ 
            color: '#C45E3A',
            animation: 'spin 0.8s linear infinite'
          }} 
        />
        <p style={{ 
          fontSize: '15px', 
          color: '#6B6560', 
          fontWeight: 500 
        }}>
          Redirecting...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Only render children if user is NOT logged in
  if (!user) {
    return <>{children}</>;
  }

  return null;
}