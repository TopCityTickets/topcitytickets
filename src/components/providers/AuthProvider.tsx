"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/hooks/useAuth";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
