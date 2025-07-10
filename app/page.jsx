'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { useEffect } from 'react';
import { WrenchScrewdriverIcon, DevicePhoneMobileIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Redirecting to dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Workshop Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-blue-600 font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
                <span className="text-blue-600">REVOLUTIONIZE</span><br />
                Your Workshop<br />
                <span className="text-blue-600">MANAGEMENT</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Complete workshop management solution with real-time analytics, job tracking, 
                invoice generation, and customer management. Available on web and mobile.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium text-lg"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/login"
                  className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 font-medium text-lg"
                >
                  Sign In
                </Link>
              </div>

              {/* Mobile App Highlight */}
              <div className="inline-flex items-center bg-blue-50 px-6 py-3 rounded-full">
                <DevicePhoneMobileIcon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">Mobile app available for iOS & Android</span>
              </div>
            </div>
            
            <div className="lg:order-2">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1632823469606-c715fa1d8b47?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Professional car mechanic working on vehicle repairs"
                  className="w-full h-96 object-cover rounded-lg shadow-2xl"
                />
                <div className="absolute inset-0 bg-blue-600 bg-opacity-10 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Dashboard Analytics
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get comprehensive insights into your workshop performance with real-time data, 
              revenue tracking, and detailed analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">Real-time</div>
              <div className="text-gray-600">Live Data Updates</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">Revenue</div>
              <div className="text-gray-600">Growth Analytics</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">Job Status</div>
              <div className="text-gray-600">Progress Tracking</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-2xl font-bold text-orange-600 mb-2">Customer</div>
              <div className="text-gray-600">Management</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue Charts</h3>
                <p className="text-gray-600">Monthly revenue trends and growth analysis</p>
              </div>
              <div className="text-center">
                <CogIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Insights</h3>
                <p className="text-gray-600">Stock levels, low stock alerts, and value tracking</p>
              </div>
              <div className="text-center">
                <WrenchScrewdriverIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Analytics</h3>
                <p className="text-gray-600">Job completion rates and performance metrics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Complete Workshop Solution
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CogIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Management</h3>
              <p className="text-gray-600">Track products, manage stock levels, and get low stock alerts</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <WrenchScrewdriverIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Card System</h3>
              <p className="text-gray-600">Create, track, and manage job cards with status updates</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue Analytics</h3>
              <p className="text-gray-600">Track revenue trends, growth rates, and financial insights</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DevicePhoneMobileIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Generation</h3>
              <p className="text-gray-600">Create professional invoices and track payments</p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DevicePhoneMobileIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Management</h3>
              <p className="text-gray-600">Track top customers and manage customer relationships</p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DevicePhoneMobileIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile App</h3>
              <p className="text-gray-600">Access everything on-the-go with iOS & Android apps</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <DevicePhoneMobileIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Take Your Workshop Mobile
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Access your complete workshop management system on the go. 
              Update job cards, check inventory, generate invoices, and view analytics from anywhere.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">On-the-Go Management</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Update job card status instantly</li>
                <li>• Check inventory levels in real-time</li>
                <li>• Generate invoices on-site</li>
                <li>• View customer history</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Across Devices</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Real-time data synchronization</li>
                <li>• Offline mode support</li>
                <li>• Cross-platform compatibility</li>
                <li>• Secure cloud backup</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-gray-900 text-white px-6 py-3 rounded-lg flex items-center">
              <span className="text-lg font-medium">📱 Download for iOS</span>
            </div>
            <div className="bg-gray-900 text-white px-6 py-3 rounded-lg flex items-center">
              <span className="text-lg font-medium">📱 Download for Android</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of workshop owners who trust us to manage their business
          </p>
          <Link
            href="/signup"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 font-medium text-lg inline-block"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-gray-600">Workshop Manager</span>
            </div>
            <div className="flex space-x-6">
              <Link href="/terms" className="text-gray-500 hover:text-gray-700">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-500 hover:text-gray-700">
                Privacy
              </Link>
              <Link href="/contact" className="text-gray-500 hover:text-gray-700">
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Workshop Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}