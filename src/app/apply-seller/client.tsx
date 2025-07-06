"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ApplySellerClient() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    businessDescription: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: ''
  });

  useEffect(() => {
    // Only run auth check on client side
    if (typeof window !== 'undefined') {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        setLoading(false); // Set loading to false even if no user
        return;
      }

      setUser(user);
      setFormData(prev => ({ ...prev, contactEmail: user.email || '' }));
      setLoading(false);
    } catch (error) {
      console.error('Auth check error:', error);
      setLoading(false); // Set loading to false on error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    if (!formData.businessName || !formData.businessType || !formData.contactEmail) {
      setMessage('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/apply-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Seller application submitted successfully! You will be notified once it is reviewed.');
        setFormData({
          businessName: '',
          businessType: '',
          businessDescription: '',
          contactEmail: user?.email || '',
          contactPhone: '',
          websiteUrl: ''
        });
      } else {
        setMessage(`Application failed: ${result.error || 'Unknown error'}`);
      }

    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-4">Please sign in to apply as a seller.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Apply to Become a Seller</h1>
        
        <div className="bg-gray-900 p-6 rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Business Name *</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Type *</label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                required
              >
                <option value="">Select a business type</option>
                <option value="event-organizer">Event Organizer</option>
                <option value="venue">Venue</option>
                <option value="promoter">Promoter</option>
                <option value="artist">Artist/Performer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Description</label>
              <textarea
                value={formData.businessDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                placeholder="Tell us about your business..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Email *</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Phone</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Website URL</label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                placeholder="https://..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 disabled:bg-gray-600"
            >
              {submitting ? 'Submitting Application...' : 'Submit Seller Application'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded text-sm ${
              message.includes('successfully') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
