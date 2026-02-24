import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '../lib/api';

interface UserProfile {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  profile: UserProfile | null;
  login: (token: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // when the provider is first rendered we may already have a token
  // stored from a previous session; apply it to the axios instance
  const existingToken = localStorage.getItem('token');
  if (existingToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
  }

  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated]);

  const refreshProfile = async () => {
    try {
      const resp = await api.get('/auth/me');
      setProfile(resp.data);
      setIsAuthenticated(true);
    } catch (e) {
      setProfile(null);
      setIsAuthenticated(false);
    }
  };

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await refreshProfile();
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, profile, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
