import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Building2, Wallet } from 'lucide-react';
import MobiusLogo from '../jira-logo-scaled.png';
interface UserData {
  email: string;
  password: string;
  walletAddress: string;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('chakravarthi.l@mobiusdtaas.ai');
  const [password, setPassword] = useState('1234');
  const [walletAddress, setWalletAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          console.log('Wallet address:', accounts[0]);
          
        }
      } catch (err) {
        setError('Failed to connect wallet');
      }
    } else {
      setError('Please install MetaMask');
    }
  };
  if(walletAddress){
    console.log(walletAddress);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const users: UserData[] = JSON.parse(localStorage.getItem('demoUsers') || '[]');
      console.log('Stored users:', users); // Debug log
      
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        setError('No account found with this email');
        return;
      }

      if (user.password !== password) {
        setError('Incorrect password');
        return;
      }

      if (walletAddress && user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        setError('Wallet address mismatch');
        return;
      }

      const success = await login(user.email, user.password, user.walletAddress);
      console.log('Login success:', success); // Debug log
      
      if (!success) {
        setError('Invalid credentials');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
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
            <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>
            <p className="mt-2 text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/signUp" className="font-medium text-indigo-600 hover:text-indigo-500">
                Create your account
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
                    placeholder="password"
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
                <button
                  type="button"
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Show password
                </button>
              </div>
            </div>
            <button 
            className='w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors'
        onClick={connectWallet}
        disabled={!!walletAddress}
      >
        {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...` : 'Connect Wallet'}
      </button>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              
              >
                {isLoading ? 'Signing in...' : 'Sign in →'}
              </button>
            </div>

            <div className="text-center">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Forgot my password
              </a>
            </div>
          </form>

          <div className="text-xs text-gray-400 text-center">
            Demo credentials: user@example.com / password
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;