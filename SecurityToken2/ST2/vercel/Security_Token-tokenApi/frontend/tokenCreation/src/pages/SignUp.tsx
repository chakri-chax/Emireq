import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Building2, Wallet } from 'lucide-react';
import MobiusLogo from '../jira-logo-scaled.png';
// Type for user data
interface UserData {
  email: string;
  password: string;
  walletAddress: string;
}
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<string[]>;
      isMetaMask?: boolean;
      // Add other methods you might use
    };
  }
}
const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (success) {
    return <Navigate to="/login" replace />;
  }

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        setError('');
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (err) {
        setError('Failed to connect MetaMask');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('MetaMask extension not detected');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!walletAddress) {
      setError('Please connect your MetaMask wallet');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get existing users from localStorage or initialize empty array
      const existingUsers: UserData[] = JSON.parse(localStorage.getItem('demoUsers') || '[]');
      
      // Check if email already exists
      if (existingUsers.some(user => user.email === email)) {
        setError('Email already registered');
        return;
      }
      
      // Check if wallet already exists
      if (existingUsers.some(user => user.walletAddress === walletAddress)) {
        setError('Wallet address already registered');
        return;
      }
      
      // Create new user object
      const newUser: UserData = {
        email,
        password, // Note: In a real app, you would hash the password before storing
        walletAddress
      };
      
      // Add new user and save to localStorage
      existingUsers.push(newUser);
      localStorage.setItem('demoUsers', JSON.stringify(existingUsers));
      
      setSuccess(true);
    } catch (err) {
      setError('An error occurred during registration');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 relative">
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="text-center text-white">
            <div className="mb-8">
              {/* <Building2 className="h-20 w-20 mx-auto mb-4" /> */}
              <img src={MobiusLogo} alt="MOBIUS Logo" className="h-20 w-25 mx-auto mb-4" />
              <h1 className="text-5xl font-bold mb-2">MOBIUS</h1>
              <p className="text-xl opacity-90">Token Management Platform</p>
            </div>
            <p className="text-lg opacity-80 max-w-md">
              Manage your security tokens with enterprise-grade compliance and control
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="lg:hidden mb-8">
              <Building2 className="h-12 w-12 mx-auto text-indigo-600 mb-4" />
              <h1 className="text-3xl font-bold text-gray-900">MOBIUS</h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Create account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </a>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-purple-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="appearance-none relative block w-full px-3 py-3 pr-10 border border-purple-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-purple-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="wallet" className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="wallet"
                    name="wallet"
                    type="text"
                    readOnly
                    className="appearance-none relative block w-full px-3 py-3 border border-purple-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 truncate"
                    placeholder="Connect your MetaMask wallet"
                    value={walletAddress}
                  />
                  <button
                    type="button"
                    onClick={connectMetaMask}
                    disabled={!!walletAddress || isLoading}
                    className="flex-shrink-0 p-3 border border-purple-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wallet className="h-5 w-5 text-indigo-600" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Connect your MetaMask wallet to associate with your account
                </p>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || !walletAddress}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating account...' : 'Create account →'}
              </button>
            </div>
          </form>

          <div className="text-xs text-gray-400 text-center">
            Demo data is stored in your browser's localStorage
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;