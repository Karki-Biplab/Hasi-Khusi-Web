'use client';

import { useAuthStore } from '@/lib/store/auth';
import { BellIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const { user } = useAuthStore();

  return (
    <header className="bg-white shadow-sm lg:pl-72">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-x-4">
            <button className="text-gray-400 hover:text-gray-500">
              <BellIcon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}