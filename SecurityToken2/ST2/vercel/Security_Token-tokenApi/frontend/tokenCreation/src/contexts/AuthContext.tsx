import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  walletAddress: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  walletAddress: string | null;
  login: (email: string, password: string, walletAddress: string) => Promise<boolean>;
  logout: () => void;
  currentUser: User | null; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = async (email: string, password: string, walletAddress: string): Promise<boolean> => {
    try {
      // 1. Check localStorage for registered users
      const users = JSON.parse(localStorage.getItem('demoUsers') || '[]');
      
      // 2. Find matching user
      const user = users.find((u: any) => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );
      
      if (user) {
        // 3. If walletAddress was provided, verify it matches
        if (walletAddress && user.walletAddress !== walletAddress) {
          console.error('Wallet address mismatch');
          return false;
        }
        
        // 4. Set user in state
        setCurrentUser({
          id: user.id || Date.now().toString(),
          email: user.email,
          name: user.name || user.email.split('@')[0],
          walletAddress: user.walletAddress
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const value = {
    isAuthenticated: !!currentUser,
    userEmail: currentUser?.email || null,
    walletAddress: currentUser?.walletAddress || null,
    currentUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};