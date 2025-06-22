"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import CopyrightYear from "./copyright-year";
import Navbar from "@/components/Navbar";

export default function Header() {
  const { user, role, loading } = useAuth();

  const handleLogout = async () => {
    await supabase().auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link href="/" className="flex items-center space-x-2">
            <Ticket className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight">
                TopCityTickets
              </span>
              <span className="text-xs text-muted-foreground">
                © <CopyrightYear />
              </span>
            </div>
          </Link>
          <div>Loading...</div>
        </div>
      </header>
    );
  }

  return <Navbar />;
}
        <Link href="/" className="flex items-center space-x-2">
          <Ticket className="h-8 w-8 text-primary" />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight">
              TopCityTickets
            </span>
            <span className="text-xs text-muted-foreground">
              © <CopyrightYear />
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/events">Events</Link>
              </Button>

              {role === "admin" && (
                <Button variant="ghost" asChild>
                  <Link href="/admin/dashboard">Admin</Link>
                </Button>
              )}

              {role === "seller" && (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/seller/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/submit-event">Submit Event</Link>
                  </Button>
                </>
              )}

              {role === "user" && (
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-primary/50 hover:bg-primary/10"
              >
                Logout ({user.email})
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                asChild
              >
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
