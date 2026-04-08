'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, rtdb } from '@/lib/firebase';

interface AuthContextType {
  user: User | { email: string; uid: string; displayName: string; getIdToken: () => Promise<string> } | null;
  role: 'viewer' | 'editor' | null;
  loading: boolean;
  loginWithPassword: (password: string) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  loginWithPassword: () => false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | { email: string; uid: string; displayName: string; getIdToken: () => Promise<string> } | null>(null);
  const [role, setRole] = useState<'viewer' | 'editor' | null>(null);
  const [loading, setLoading] = useState(true);

  // Senha fixa para o admin
  const ADMIN_PASSWORD = 'promox2026';

  useEffect(() => {
    // 1. Verificar se existe sessão por senha no localStorage primeiro
    const savedAuth = localStorage.getItem('promox_auth_v1');
    if (savedAuth === ADMIN_PASSWORD) {
      setUser({
        email: 'admin@promox.livre',
        uid: 'admin-simple-id',
        displayName: 'Administrador',
        getIdToken: async () => ADMIN_PASSWORD
      });
      setRole('editor');
      setLoading(false);
      return;
    }

    // 2. Fallback para Firebase se não houver senha fixa
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        // Buscar role no RTDB
        try {
          const userRef = ref(rtdb, `users/${firebaseUser.uid}/role`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setRole(snapshot.val());
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error('[AUTH] erro ao buscar role:', error);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithPassword = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('promox_auth_v1', password);
      setUser({
        email: 'admin@promox.livre',
        uid: 'admin-simple-id',
        displayName: 'Administrador',
        getIdToken: async () => ADMIN_PASSWORD
      });
      setRole('editor');
      return true;
    }
    return false;
  };

  const logout = async () => {
    localStorage.removeItem('promox_auth_v1');
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout, loginWithPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
