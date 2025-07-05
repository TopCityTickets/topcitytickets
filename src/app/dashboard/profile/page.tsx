'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BadgePercent, 
  ShieldCheck, 
  Camera, 
  Save, 
  Loader2, 
  CreditCard,
  ExternalLink,
  User,
  Mail,
  Phone,
  Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import ProfilePictureUpload from '@/components/user/ProfilePictureUpload';

interface UserData {
  id: string;
  email: string;
  role: 'admin' | 'seller' | 'customer';
  seller_status: 'none' | 'pending' | 'approved' | 'denied';
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  profile_picture_url: string | null;
  bio: string | null;
  phone: string | null;
  website_url: string | null;
  stripe_customer_id: string | null;
  stripe_connect_account_id: string | null;
  stripe_onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [isLinkingPhone, setIsLinkingPhone] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [linkPhoneNumber, setLinkPhoneNumber] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    phone: '',
    website_url: ''
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchUserData();
    }
  }, [user, authLoading, router]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      setUserData(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        bio: data.bio || '',
        phone: data.phone || '',
        website_url: data.website_url || ''
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // For now, let's use a simple file upload to a public storage
      // In production, you'd want to set up proper Supabase storage buckets
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      // For now, we'll just update the user without actually uploading
      // You'll need to set up Supabase storage bucket first
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: '/placeholder-avatar.png' }) // Temporary placeholder
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setUserData(prev => prev ? { ...prev, avatar_url: '/placeholder-avatar.png' } : null);
      alert('Profile picture upload coming soon! For now, we\'ve saved your selection.');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading profile picture. Storage bucket needs to be configured.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !userData) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          bio: formData.bio || null,
          phone: formData.phone || null,
          website_url: formData.website_url || null
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      await fetchUserData();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStripeConnect = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('Please log in again.');
        return;
      }

      const response = await fetch('/api/stripe-connect/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/profile?stripe_success=true`
        })
      });

      const data = await response.json();

      if (response.ok && data.accountLink) {
        // Redirect to Stripe onboarding or dashboard
        window.location.href = data.accountLink;
      } else {
        alert('Error setting up Stripe Connect: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error with Stripe Connect:', error);
      alert('Error setting up Stripe Connect. Please try again.');
    }
  };

  const handlePaymentMethods = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('Please log in again.');
        return;
      }

      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_payment_method_setup'
        })
      });

      const data = await response.json();

      if (response.ok && data.client_secret) {
        // For now, just show that it's working
        alert('Payment method setup coming soon! Client secret received: ' + data.client_secret.substring(0, 20) + '...');
      } else {
        alert('Error setting up payment methods: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error with payment methods:', error);
      alert('Error setting up payment methods. Please try again.');
    }
  };

  const handleLinkPhone = async () => {
    if (!linkPhoneNumber) {
      alert('Please enter a phone number');
      return;
    }

    setIsLinkingPhone(true);
    try {
      const { error } = await supabase.auth.updateUser({
        phone: linkPhoneNumber
      });

      if (error) {
        alert('Error linking phone: ' + error.message);
      } else {
        setIsOtpSent(true);
        alert('Verification code sent to your phone!');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsLinkingPhone(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp) {
      alert('Please enter the verification code');
      return;
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: linkPhoneNumber,
        token: phoneOtp,
        type: 'phone_change'
      });

      if (error) {
        alert('Invalid verification code: ' + error.message);
      } else {
        alert('Phone number linked successfully!');
        setIsOtpSent(false);
        setPhoneOtp('');
        setLinkPhoneNumber('');
        fetchUserData(); // Refresh user data
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user || !userData) {
    return <p>Please log in to view your profile.</p>;
  }

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    const firstName = userData?.first_name;
    const lastName = userData?.last_name;
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const fullName = userData?.first_name && userData?.last_name 
    ? `${userData.first_name} ${userData.last_name}` 
    : userData?.first_name || userData?.last_name || null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 relative">
            <Avatar className="h-32 w-32 border-4 border-primary">
              {userData.avatar_url ? (
                <AvatarImage src={userData.avatar_url} alt="Profile picture" />
              ) : (
                <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                  {getInitials(user.email)}
                </AvatarFallback>
              )}
            </Avatar>
            <label className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl font-headline">
            {fullName || user.email}
          </CardTitle>
          <CardDescription className="text-lg">
            <Badge variant={userData.role === 'admin' ? 'default' : userData.role === 'seller' ? 'secondary' : 'outline'}>
              <ShieldCheck className="w-4 h-4 mr-1" />
              {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
            </Badge>
          </CardDescription>
          {userData.bio && (
            <p className="text-muted-foreground mt-2">{userData.bio}</p>
          )}
        </CardHeader>
      </Card>

      {/* Profile Picture Upload */}
      <ProfilePictureUpload 
        currentProfilePicture={userData.profile_picture_url || userData.avatar_url || undefined}
        onUploadSuccess={(newUrl) => {
          setUserData(prev => prev ? { ...prev, profile_picture_url: newUrl } : null);
        }}
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                  {!userData.phone && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Add your phone number to enable passwordless sign-in
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="website_url">Website</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <Button onClick={handleSave} className="w-full" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                {userData.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{userData.phone}</span>
                  </div>
                )}
                {userData.website_url && (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={userData.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center"
                    >
                      {userData.website_url}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  <p>Joined: {new Date(userData.created_at).toLocaleDateString()}</p>
                  <p>Last updated: {new Date(userData.updated_at).toLocaleDateString()}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Seller & Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Seller & Payment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userData.role === 'seller' ? (
              <>
                <div className="space-y-2">
                  <Label>Seller Status</Label>
                  <Badge variant={
                    userData.seller_status === 'approved' ? 'default' : 
                    userData.seller_status === 'pending' ? 'secondary' : 
                    'destructive'
                  }>
                    {userData.seller_status}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Stripe Connect Status</Label>
                  {userData.stripe_connect_account_id ? (
                    <div className="flex items-center justify-between">
                      <Badge variant={userData.stripe_onboarding_completed ? 'default' : 'secondary'}>
                        {userData.stripe_onboarding_completed ? 'Connected' : 'Setup Required'}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={handleStripeConnect}>
                        Manage
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleStripeConnect} className="w-full">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Connect Stripe Account
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Connect your Stripe account to receive payments for your events. Payouts happen the day after your event ends.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Information</Label>
                  <Button onClick={handlePaymentMethods} className="w-full" variant="outline">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Payment Methods
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Add and manage your payment methods for purchasing tickets
                  </p>
                </div>

                <Separator />

                <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg">
                  <BadgePercent className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="font-semibold mb-2">Become a Seller</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start selling tickets for your events on Top City Tickets
                  </p>
                  <Button onClick={() => router.push('/dashboard#seller-application')}>
                    Apply to Become a Seller
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Phone Authentication Section - Only show if no phone linked */}
      {!userData.phone && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Link Phone for Passwordless Sign-In
            </CardTitle>
            <CardDescription>
              Add your phone number to enable quick, passwordless authentication via SMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isOtpSent ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="link_phone_number">Phone Number</Label>
                  <Input
                    id="link_phone_number"
                    type="tel"
                    value={linkPhoneNumber}
                    onChange={(e) => setLinkPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                    disabled={isLinkingPhone}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include country code (e.g., +1 for US numbers)
                  </p>
                </div>
                <Button
                  onClick={handleLinkPhone}
                  className="w-full"
                  disabled={isLinkingPhone || !linkPhoneNumber}
                >
                  {isLinkingPhone ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Link Phone for Passwordless Sign-In
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone_otp">Verification Code</Label>
                  <Input
                    id="phone_otp"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the verification code sent to {linkPhoneNumber}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleVerifyPhoneOtp}
                    className="flex-1"
                    disabled={!phoneOtp}
                  >
                    Verify & Link Phone
                  </Button>
                  <Button
                    onClick={() => {
                      setIsOtpSent(false);
                      setPhoneOtp('');
                      setLinkPhoneNumber('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
