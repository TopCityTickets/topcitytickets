'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { LogOut, UserCircle2, PlusCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';

interface UserNavProps {
  user: User | null;
}

export default function UserNav({ user }: UserNavProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh(); // Refresh to update server-side data and re-trigger middleware
    router.push('/'); 
  };

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email[0].toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4" /> Login
          </Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            {/* Placeholder for user avatar image if available */}
            {/* <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} /> */}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none font-headline">
              {user.user_metadata?.full_name || user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="flex items-center cursor-pointer">
            <UserCircle2 className="mr-2 h-4 w-4" />
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/submit-event" className="flex items-center cursor-pointer">
            <PlusCircle className="mr-2 h-4 w-4" />
            Submit Event
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
