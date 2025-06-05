
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BadgePercent, ShieldCheck } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }
  
  const getInitials = (email?: string) => {
    if (!email) return 'U';
    const name = user.user_metadata?.full_name;
    if (name && typeof name === 'string') {
      const parts = name.split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name[0].toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const userRole = user.user_metadata?.role as string | undefined;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {getInitials(user.email)}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-3xl font-headline">
            {userRole === 'seller' ? 'Seller Dashboard & Profile' : (user.user_metadata?.full_name || user.email)}
          </CardTitle>
          <CardDescription>
            {userRole === 'seller' ? 'Manage your seller activities and profile.' : 'View and manage your profile information.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold font-headline">Personal Information</h3>
            <div className="p-4 border rounded-md bg-muted/50 space-y-1">
              <p><strong>Full Name:</strong> {user.user_metadata?.full_name || 'Not set'}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold font-headline">Account Details</h3>
            <div className="p-4 border rounded-md bg-muted/50 space-y-1">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
              {userRole && (
                <p className="flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-primary" />
                  <strong>Role:</strong> <span className="ml-1 capitalize px-2 py-0.5 bg-accent text-accent-foreground text-xs rounded-full">{userRole}</span>
                </p>
              )}
            </div>
          </div>

          {userRole !== 'seller' && (
             <div className="space-y-2 pt-4 border-t" id="request-seller">
                <h3 className="text-lg font-semibold font-headline">Become a Seller</h3>
                <div className="p-4 border rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground mb-3">
                    Interested in listing your events on Top City Tickets? Request to become a seller!
                    Your request will be reviewed by an administrator.
                </p>
                <Button 
                    className="w-full" 
                    onClick={() => {
                        alert("Seller status request noted. An admin will review your account. This is a manual process for now.");
                    }}
                >
                    <BadgePercent className="mr-2 h-5 w-5" />
                    Request Seller Status
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    (Admin will manually update your role upon approval)
                </p>
                </div>
          </div>
          )}
        </CardContent>
        <CardFooter>
            {/* Could add edit profile button here later */}
        </CardFooter>
      </Card>
    </div>
  );
}
