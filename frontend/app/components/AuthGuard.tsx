// frontend/app/components/AuthGuard.tsx
"use client";

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="auth-loading" style={{
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
          Verifying your session...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}