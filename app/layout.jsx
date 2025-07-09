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

const inter = Inter({ subsets: ['latin'] });
const queryClient = new QueryClient();

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
            name: userData?.name || 'User'
          });
          
          if (pathname === '/') {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          logout();
        }
      } else {
        logout();
        // Only redirect to login if user is on a protected route
        if (pathname !== '/' && pathname !== '/login') {
          router.push('/');
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, logout, setLoading, router, pathname]);

  // Show loading spinner during initial auth check
  if (isLoading) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <QueryClientProvider client={queryClient}>
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
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