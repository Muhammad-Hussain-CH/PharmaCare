// src/context/AuthContext.tsx
// Authentication context — manages user state, token, login/logout
// Authors: Muhammad Hussain & Ali Ahmed Mansoor

import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, getMe } from '../api/services';

export interface User {
  user_id: number;
  role: 'owner' | 'worker';
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── On mount: restore session from localStorage ──────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('pharmacy_token');
    const savedUser = localStorage.getItem('pharmacy_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));

      // Validate token with backend (optional but recommended)
      getMe()
        .then((res) => {
          setUser(res.data.user);
        })
        .catch(() => {
          // Token invalid or expired — clear storage
          localStorage.removeItem('pharmacy_token');
          localStorage.removeItem('pharmacy_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Login function ────────────────────────────────────────────
  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await loginUser(username, password);
      const { token: newToken, user: newUser } = res.data;

      setToken(newToken);
      setUser(newUser);

      // Persist to localStorage
      localStorage.setItem('pharmacy_token', newToken);
      localStorage.setItem('pharmacy_user', JSON.stringify(newUser));

      return newUser;
    } finally {
      setLoading(false);
    }
  };

  // ── Logout function ──────────────────────────────────────────
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pharmacy_token');
    localStorage.removeItem('pharmacy_user');
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Custom hook to use Auth context ─────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
