import { Navigate } from 'react-router';
import { useApp } from '../context/AppContext';
import React, { Suspense } from 'react';

export function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();

  if (loading) {
    return <PageFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}
