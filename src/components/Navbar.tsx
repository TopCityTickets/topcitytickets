"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";
import { ADMIN_EMAIL } from '@/types/auth';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<"user" | "seller" | "admin">("user");
  const router = useRouter();
  const supabaseClient = supabase();

  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data: userData } = await supabaseClient
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();
          setUserRole(userData?.role || "user");
        } else {
          setUser(null);
          setUserRole("user");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link href="/" className="font-bold text-xl">
          TopCityTickets
          <span className="text-xs ml-1 text-muted-foreground">
            © {new Date().getFullYear()}
          </span>
        </Link>
        <div className="flex gap-4">
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/events">Events</Link>
              </Button>
              {userRole === "seller" && (
                <Button variant="ghost" asChild>
                  <Link href="/seller/dashboard">My Events</Link>
                </Button>
              )}
              {userRole === "admin" && (
                <Button variant="ghost" asChild>
                  <Link href="/admin/dashboard">Admin</Link>
                </Button>
              )}
              {userRole === "user" && (
                <Button variant="ghost" asChild>
                  <Link href="/become-seller">Become a Seller</Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// If you are using <Header /> everywhere, you can delete this file.
// Otherwise, ensure you only have one navigation/header component in use.
