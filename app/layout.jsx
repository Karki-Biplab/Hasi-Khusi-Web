'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChange } from '@/lib/firebase/auth';
import { useAuthStore } from '@/lib/store/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'sonner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const inter = Inter({ subsets: ['latin'] });
const queryClient = new QueryClient();

const publicRoutes = ['/', '/login', '/signup', '/reset-password'];

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, logout, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setLoading(true);
      
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          const userData = userDoc.data();
          
          setUser({
            uid: authUser.uid,
            email: authUser.email,
            role: userData?.role || 'lv1',
            name: userData?.name || 'User',
            created_at: userData?.created_at?.toDate()?.toISOString()
          });
          
          // Redirect to dashboard if on public route
          if (publicRoutes.includes(pathname)) {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          logout();
          if (!publicRoutes.includes(pathname)) {
            router.push('/login');
          }
        }
      } else {
        logout();
        // Redirect to login if not on public route
        if (!publicRoutes.includes(pathname)) {
          router.push('/login');
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, logout, setLoading, router, pathname]);

  if (isLoading) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <QueryClientProvider client={queryClient}>
            <div className="flex min-h-screen items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="top-right" />
        </QueryClientProvider>
      </body>
    </html>
  );
}