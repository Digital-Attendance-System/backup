'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Spinner } from '@/components/UI/Spinner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Role-based access control
    if (user) {
      const role = user.role;
      
      // Admin trying to access non-admin pages
      if (role === 'admin' && !pathname.startsWith('/admin')) {
        router.push('/admin');
        return;
      }
      
      // Teacher trying to access non-teacher pages
      if (role === 'teacher' && !pathname.startsWith('/teacher')) {
        router.push('/teacher');
        return;
      }
      
      // Student trying to access non-student pages
      if (role === 'student' && !pathname.startsWith('/student')) {
        router.push('/student');
        return;
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}