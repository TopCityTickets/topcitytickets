"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/types/auth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("user");
  const router = useRouter();

  useEffect(() => {
    const supabaseClient = supabase();
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        const { data: userData } = await supabaseClient
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (userData) {
          setUserRole(userData.role as UserRole);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data: userData } = await supabaseClient
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (userData) {
            setUserRole(userData.role as UserRole);
          }
        } else {
          setUser(null);
          setUserRole("user");
        }
        router.refresh();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    const supabaseClient = supabase();
    await supabaseClient.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link href="/" className="font-bold text-xl">
          TopCityTickets
        </Link>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/events">Events</Link>
              </Button>
              {userRole === "admin" && (
                <Button variant="ghost" asChild>
                  <Link href="/admin/dashboard">Admin</Link>
                </Button>
              )}
              {userRole === "seller" && (
                <Button variant="ghost" asChild>
                  <Link href="/seller/dashboard">Seller</Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
