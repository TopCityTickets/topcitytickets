import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle2 } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // This should ideally be handled by middleware or layout, but as a fallback:
    return <p>Please log in to view your profile.</p>;
  }
  
  const getInitials = (email?: string) => {
    if (!email) return 'U';
    const name = user.user_metadata?.full_name;
    if (name) {
      const parts = name.split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name[0].toUpperCase();
    }
    return email[0].toUpperCase();
  };


  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Avatar className="h-24 w-24 border-2 border-primary">
              {/* <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} /> */}
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {getInitials(user.email)}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-3xl font-headline">My Profile</CardTitle>
          <CardDescription>View and manage your profile information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold font-headline">Personal Information</h3>
            <div className="p-4 border rounded-md bg-muted/50">
              <p><strong>Full Name:</strong> {user.user_metadata?.full_name || 'Not set'}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold font-headline">Account Details</h3>
            <div className="p-4 border rounded-md bg-muted/50">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
          {/* Add more profile sections or edit functionality as needed */}
        </CardContent>
      </Card>
    </div>
  );
}
