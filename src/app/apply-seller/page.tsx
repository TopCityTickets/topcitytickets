"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { sellerActions } from '@/lib/actions/seller';
import { useRouter } from 'next/navigation';

interface FormData {
  businessName: string;
  businessType: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
}

export default function ApplySellerPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      setError('You must be logged in to apply as a seller');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await sellerActions.autoApproveSeller({
        business_name: formData.businessName,
        business_type: formData.businessType,
        description: formData.description,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        website_url: formData.websiteUrl,
      }, user.id);

      alert('🎉 Congratulations! You are now a seller! Redirecting to seller dashboard...');
      router.push('/seller/dashboard');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      setError(error.message || 'Error submitting application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="ultra-dark-card w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-slate-300 mb-6">You must be logged in to apply as a seller.</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="ultra-dark-card w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black brand-text-gradient mb-4">Become a Seller</h1>
          <p className="text-slate-300">
            Join our platform and start selling your events to thousands of customers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-slate-200 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Your business name"
              required
            />
          </div>

          <div>
            <label htmlFor="businessType" className="block text-sm font-medium text-slate-200 mb-2">
              Business Type *
            </label>
            <select
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Select business type</option>
              <option value="event_organizer">Event Organizer</option>
              <option value="venue">Venue</option>
              <option value="artist">Artist/Performer</option>
              <option value="promoter">Promoter</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-200 mb-2">
              Business Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Tell us about your business..."
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-200 mb-2">
              Contact Email *
            </label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-slate-200 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-slate-200 mb-2">
              Website URL
            </label>
            <input
              type="url"
              id="websiteUrl"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all dark-button-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting Application...' : 'Apply to Become a Seller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}