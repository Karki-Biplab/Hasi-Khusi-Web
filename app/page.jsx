'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { login } from '@/lib/firebase/auth';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  WrenchScrewdriverIcon, 
  ChartBarIcon, 
  CogIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  // Auto-login for demo purposes
  useEffect(() => {
    const autoLogin = async () => {
      if (!user && !isLoading) {
        setIsLoading(true);
        try {
          const userData = await login('owner@workshop.com', 'password123');
          setUser(userData);
          router.push('/dashboard');
          toast.success('Auto-logged in as Owner for demo!');
        } catch (error) {
          // If auto-login fails, just continue to show login form
          console.log('Auto-login failed, showing login form');
        } finally {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(autoLogin, 1000); // Auto-login after 1 second
    return () => clearTimeout(timer);
  }, [user, isLoading, setUser, router]);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Don't render login form if user is already authenticated
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData = await login(email, password);
      setUser(userData);
      router.push('/dashboard');
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Workshop Manager</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <div className="flex items-center text-sm text-gray-600">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Analytics Dashboard
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CogIcon className="h-5 w-5 mr-2" />
                Inventory Management
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Secure & Reliable
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Auto-login notification */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  Auto-logging you in as Worker for demo...
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
        <div>
              <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <WrenchScrewdriverIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                Sign in to your account
          </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Manage your workshop efficiently
          </p>
        </div>
        
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
            <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Sign in'}
            </button>
          </div>
        </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Demo credentials</span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 gap-3">
                <div className="text-center">
                  <div className="text-xs text-gray-600 space-y-1">
            Demo credentials (after Firebase setup):
                    <div className="bg-gray-50 p-2 rounded text-left">
                      <div><strong>Owner:</strong> owner@workshop.com / password123</div>
                      <div><strong>Admin:</strong> admin@workshop.com / password123</div>
                      <div><strong>Worker:</strong> worker@workshop.com / password123</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}