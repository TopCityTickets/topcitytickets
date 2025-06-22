"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
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
      }
    };

    // subscribe to changes
    const { data: subs } = client.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await client
          .from<Database["public"]["Tables"]["users"]["Row"]>("users")
          .select("role")
          .eq("id", session.user.id)
          .single();
        setState({ user: session.user, role: data?.role || "user", loading: false });
      } else {
        setState({ user: null, role: "user", loading: false });
      }
    });

    init();
    return () => subs.subscription.unsubscribe();
  }, [client]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
