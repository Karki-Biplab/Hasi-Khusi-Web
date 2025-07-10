'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import { login, resetPassword } from '@/lib/firebase/auth';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  WrenchScrewdriverIcon, 
  ChartBarIcon, 
  CogIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Demo user credentials
const DEMO_USERS = [
  { email: 'owner@workshop.com', password: 'password123', role: 'Owner' },
  { email: 'admin@workshop.com', password: 'password123', role: 'Admin' },
  { email: 'worker@workshop.com', password: 'password123', role: 'Worker' }
];

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (email, password, isDemo = false, role = '') => {
    setIsLoading(true);
    try {
      const userData = await login(email, password);
      setUser(userData);
      const message = isDemo ? `Logged in as ${role} demo user!` : 'Login successful!';
      toast.success(message);
      router.push('/dashboard');
    } catch (error) {
      const errorMessage = isDemo ? `Demo login failed: ${error.message}` : error.message;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    await handleLogin(formData.email.trim(), formData.password);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!validateEmail(resetEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsResetting(true);
    try {
      await resetPassword(resetEmail.trim());
      toast.success('Password reset email sent! Check your inbox.');
      setShowResetPassword(false);
      setResetEmail('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDemoLogin = (userIndex) => {
    const { email, password, role } = DEMO_USERS[userIndex];
    handleLogin(email, password, true, role);
  };

  // Loading state while redirecting
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <Header />

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {showResetPassword ? (
            <ResetPasswordForm 
              resetEmail={resetEmail}
              setResetEmail={setResetEmail}
              isResetting={isResetting}
              onSubmit={handleResetPassword}
              onBack={() => setShowResetPassword(false)}
            />
          ) : (
            <LoginForm 
              formData={formData}
              errors={errors}
              showPassword={showPassword}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onInputChange={handleInputChange}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onShowResetPassword={() => setShowResetPassword(true)}
              onDemoLogin={handleDemoLogin}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Header Component
function Header() {
  const features = [
    { icon: ChartBarIcon, text: 'Analytics Dashboard' },
    { icon: CogIcon, text: 'Inventory Management' },
    { icon: ShieldCheckIcon, text: 'Secure & Reliable' }
  ];

  return (
    <div className="relative overflow-hidden bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <WrenchScrewdriverIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Workshop Manager</h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <feature.icon className="h-5 w-5 mr-2" />
                {feature.text}
              </div>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Need an account?</span>
            <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reset Password Form Component
function ResetPasswordForm({ resetEmail, setResetEmail, isResetting, onSubmit, onBack }) {
  return (
    <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email to receive a password reset link
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={onSubmit}>
        <div>
          <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="resetEmail"
              name="resetEmail"
              type="email"
              required
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Back to login
          </button>
        </div>

        <button
          type="submit"
          disabled={isResetting}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
        >
          {isResetting ? <LoadingSpinner size="sm" /> : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
}

// Login Form Component
function LoginForm({ 
  formData, 
  errors, 
  showPassword, 
  isLoading, 
  onSubmit, 
  onInputChange, 
  onTogglePassword, 
  onShowResetPassword, 
  onDemoLogin 
}) {
  return (
    <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
          <WrenchScrewdriverIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back! Please enter your credentials
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={onSubmit}>
        <div className="space-y-4">
          <InputField
            id="email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            value={formData.email}
            onChange={onInputChange}
            error={errors.email}
            icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
          />

          <InputField
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={onInputChange}
            error={errors.password}
            icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
            rightIcon={
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={onTogglePassword}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <button
            type="button"
            onClick={onShowResetPassword}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Forgot your password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Sign in'}
        </button>
      </form>

      <DemoSection onDemoLogin={onDemoLogin} />
    </div>
  );
}

// Input Field Component
function InputField({ 
  id, 
  name, 
  type, 
  label, 
  placeholder, 
  value, 
  onChange, 
  error, 
  icon, 
  rightIcon 
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
          {icon}
        </div>
        <input
          id={id}
          name={name}
          type={type}
          required
          className={`block w-full pl-10 ${rightIcon ? 'pr-10' : 'pr-3'} py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Demo Section Component
function DemoSection({ onDemoLogin }) {
  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or try demo accounts</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {DEMO_USERS.map((user, index) => (
          <button
            key={index}
            onClick={() => onDemoLogin(index)}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            Login as {user.role}
          </button>
        ))}
      </div>
    </div>
  );
}