"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    displayName: '',
    bio: '',
    profileImage: null as File | null,
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      // Check if profile already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile?.setup_completed) {
        router.replace('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkSession();
  }, [supabase, router]);

  const handleSkip = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        setup_completed: true,
      });

    router.replace('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let profileImageUrl = null;

    if (userData.profileImage) {
      const fileExt = userData.profileImage.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('profile-images')
        .upload(fileName, userData.profileImage);

      if (!uploadError && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);
        
        profileImageUrl = publicUrl;
      }
    }

    // Update profile
    await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        display_name: userData.displayName || null,
        bio: userData.bio || null,
        avatar_url: profileImageUrl,
        setup_completed: true,
      });

    router.replace('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-neon-cyan">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-slate-900 p-4">
      <Card className="w-full max-w-md p-6 bg-slate-800 border-neon-cyan">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neon-cyan">Welcome!</h1>
            <p className="text-slate-400 mt-2">Let's set up your profile (optional)</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName" className="text-white">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="How should we call you?"
                  value={userData.displayName}
                  onChange={(e) => setUserData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-white">Bio</Label>
                <Input
                  id="bio"
                  type="text"
                  placeholder="Tell us about yourself"
                  value={userData.bio}
                  onChange={(e) => setUserData(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="profileImage" className="text-white">Profile Picture</Label>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUserData(prev => ({ ...prev, profileImage: file }));
                    }
                  }}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                type="submit"
                className="flex-1 bg-neon-cyan hover:bg-cyan-600 text-black font-bold"
              >
                Complete Setup
              </Button>
              <Button
                type="button"
                onClick={handleSkip}
                variant="outline"
                className="flex-1 border-neon-pink text-neon-pink hover:bg-pink-950"
              >
                Skip for now
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
