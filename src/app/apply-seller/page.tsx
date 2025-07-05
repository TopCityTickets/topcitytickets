"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, ShoppingCart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ApplySellerPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'denied'>('none');
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    websiteUrl: ''
  });

  // Check application status on load
  useEffect(() => {
    if (user) {
      checkApplicationStatus();
    }
  }, [user]);

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch('/api/seller-status');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setApplicationStatus(data.data.seller_status || 'none');
        }
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply as a seller.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.businessName || !formData.businessType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/apply-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessType: formData.businessType,
          description: formData.description,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          websiteUrl: formData.websiteUrl
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Application Submitted!",
          description: "Your seller application has been submitted for review. You'll be notified once it's processed.",
        });
        setApplicationStatus('pending');
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "Failed to submit application. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Network Error",
        description: "Failed to submit application. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="ultra-dark-card max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (role === 'seller' || role === 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="ultra-dark-card">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">You're Already a Seller!</CardTitle>
            <CardDescription>
              You have seller privileges and can create events.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/seller/dashboard')} className="mr-4">
              Go to Seller Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (applicationStatus === 'pending') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="ultra-dark-card">
          <CardHeader className="text-center">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Application Under Review</CardTitle>
            <CardDescription>
              Your seller application is currently being reviewed by our team.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              We'll notify you once your application has been processed. This usually takes 1-2 business days.
            </p>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (applicationStatus === 'denied') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="ultra-dark-card">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Application Denied</CardTitle>
            <CardDescription>
              Unfortunately, your seller application was not approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              You can reapply after addressing the feedback or wait for the specified period.
            </p>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="ultra-dark-card">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Become a Seller</CardTitle>
              <CardDescription>
                Apply to sell tickets on our platform
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Your business or organization name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Select 
                  value={formData.businessType} 
                  onValueChange={(value) => handleInputChange('businessType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event-organizer">Event Organizer</SelectItem>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="promoter">Promoter</SelectItem>
                    <SelectItem value="artist-band">Artist/Band</SelectItem>
                    <SelectItem value="nonprofit">Non-Profit</SelectItem>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your business and the types of events you plan to organize"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="bg-muted/20 border border-muted/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Application Review Process</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Applications are typically reviewed within 1-2 business days</li>
                    <li>• You'll be notified via email once your application is processed</li>
                    <li>• Additional verification may be required for certain business types</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting Application..." : "Submit Seller Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
