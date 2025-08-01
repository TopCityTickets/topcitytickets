"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { withAuth } from '@/components/auth/with-auth';
import { Button } from '@/components/ui/button';

function ProfilePage() {
  const supabase = createClientComponentClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
      }
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (!profile) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        alert('Error updating profile: ' + error.message);
      } else {
        alert('Profile updated successfully!');
        setProfile({ ...profile, full_name: fullName });
      }
    } catch (error) {
      alert('An unexpected error occurred');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-cyan-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-6 sm:px-8">
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-6">Your Profile</h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <p className="text-white bg-slate-700 p-3 rounded border">
                {profile?.email}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Email cannot be changed from this page
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white focus:border-cyan-500 focus:outline-none"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role
              </label>
              <p className="text-white bg-slate-700 p-3 rounded border capitalize">
                {profile?.role || 'User'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Member Since
              </label>
              <p className="text-white bg-slate-700 p-3 rounded border">
                {new Date(profile?.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-600">
              <Button
                onClick={handleUpdateProfile}
                disabled={updating}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
              >
                {updating ? 'Updating...' : 'Update Profile'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);
