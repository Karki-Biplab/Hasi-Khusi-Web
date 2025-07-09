'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { logout as firebaseLogout } from '@/lib/firebase/auth';
import { toast } from 'sonner';
import {
  HomeIcon,
  CubeIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['owner', 'lv2', 'lv1'] },
  { name: 'Inventory', href: '/inventory', icon: CubeIcon, roles: ['owner', 'lv2', 'lv1'] },
  { name: 'Job Cards', href: '/job-cards', icon: DocumentTextIcon, roles: ['owner', 'lv2', 'lv1'] },
  { name: 'Invoices', href: '/invoices', icon: ReceiptPercentIcon, roles: ['owner', 'lv2', 'lv1'] },
  { name: 'Users', href: '/users', icon: UsersIcon, roles: ['owner'] },
  { name: 'Logs', href: '/logs', icon: ClipboardDocumentListIcon, roles: ['owner', 'lv2'] }
];

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole } = useAuthStore();

  const handleLogout = async () => {
    try {
      await firebaseLogout();
      logout();
      router.push('/');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out: ' + error.message);
    }
  };

  const filteredNavigation = navigation.filter(item => 
    hasRole(item.roles[item.roles.length - 1])
  );

  return (
    <>
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl">
            <SidebarContent 
              navigation={filteredNavigation} 
              pathname={pathname}
              user={user}
              onLogout={handleLogout}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-xl">
          <SidebarContent 
            navigation={filteredNavigation} 
            pathname={pathname}
            user={user}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

function SidebarContent({ navigation, pathname, user, onLogout, onClose }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Workshop Manager</h1>
        {onClose && (
          <button onClick={onClose} className="lg:hidden">
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                      pathname === item.href
                        ? 'bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          
          <li className="mt-auto">
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-x-4 px-2 py-3">
                <div className="flex-auto">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </>
  );
}