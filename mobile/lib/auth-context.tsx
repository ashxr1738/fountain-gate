import React, { createContext, useContext, useEffect, useState } from 'react';
import { mobileApi } from './api';
import { tokenStorage } from './storage';
import type { Profile } from './types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const token = await tokenStorage.getToken();
      if (token) {
        const data = await mobileApi.getProfile();
        if (data) {
          setUser(data.user);
          setProfile(data.profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await mobileApi.login(email, password);
    setUser(res.user);
    setProfile(res.profile);
  };

  const signUp = async (email: string, password: string, name?: string) => {
    await mobileApi.register(email, password, name);
  };

  const signOut = async () => {
    await mobileApi.logout();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
