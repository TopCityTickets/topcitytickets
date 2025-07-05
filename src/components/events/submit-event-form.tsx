"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ClockIcon, DollarSignIcon, ImageIcon, InfoIcon, MapPinIcon, TagIcon, UserIcon, UploadIcon, XIcon, AlertCircle } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function SubmitEventForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [stripeConnected, setStripeConnected] = useState<boolean | null>(null);
  const [checkingStripe, setCheckingStripe] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Check Stripe Connect status on component mount
  useEffect(() => {
    checkStripeStatus();
  }, [user]);

  const checkStripeStatus = async () => {
    if (!user) return;
    
    setCheckingStripe(true);
    try {
      const response = await fetch('/api/stripe-connect/status');
      const data = await response.json();
      setStripeConnected(data.connected && data.accountEnabled);
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      setStripeConnected(false);
    } finally {
      setCheckingStripe(false);
    }
  };

  // Handle image upload to Supabase storage
  const handleImageUpload = async (file: File) => {
    if (!file) return null;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return null;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return null;
    }

    setIsUploadingImage(true);

    try {
      const supabaseClient = supabase();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabaseClient.storage
        .from('pub')
        .upload(`event-flyers/${fileName}`, file);

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload Failed',
          description: 'Failed to upload image. Please try again.',
          variant: 'destructive',
        });
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('pub')
        .getPublicUrl(`event-flyers/${fileName}`);

      setUploadedImage(publicUrl);
      toast({
        title: 'Image Uploaded!',
        description: 'Your event flyer has been uploaded successfully.',
        variant: 'default',
      });

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get the session token from client-side Supabase
      const { data: { session }, error: sessionError } = await supabase().auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: 'Authentication Error',
          description: 'Please sign in again to submit events.',
          variant: 'destructive',
        });
        return;
      }

      // Get form data from the form ref instead of currentTarget
      const form = formRef.current;
      if (!form) {
        toast({
          title: 'Form Error',
          description: 'Form not found. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      const formData = new FormData(form);      const data = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
        time: formData.get('time') as string,
        venue: formData.get('venue') as string,
        ticketPrice: formData.get('ticketPrice') as string,
        organizerEmail: formData.get('organizerEmail') as string,
        imageUrl: uploadedImage || (formData.get('imageUrl') as string) || '',
      };

      const response = await fetch('/api/submit-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();      if (response.ok) {
        toast({
          title: '🎉 Event Submitted Successfully!',
          description: 'Your event has been submitted for review. Our admin team will review your submission and notify you once it\'s approved and live on the platform. This typically takes 1-2 business days.',
          variant: 'default',        });
        formRef.current?.reset();
        setUploadedImage(null);
      } else {
        console.error('Submission failed:', result);
        toast({
          title: 'Submission Failed',
          description: result.error || 'An error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission Failed',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonInputProps = "pl-10";
  const iconProps = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stripe Connect Requirement Check */}
      {checkingStripe ? (
        <Card className="shadow-xl mb-6">
          <CardContent className="p-6 text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Checking payment setup...</p>
            </div>
          </CardContent>
        </Card>
      ) : !stripeConnected ? (
        <Card className="shadow-xl mb-6 border-orange-500/50 bg-orange-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-500 mb-2">
                  Stripe Connect Required
                </h3>
                <p className="text-muted-foreground mb-4">
                  You need to connect your Stripe account before submitting events. This ensures you can receive payments when tickets are sold.
                </p>
                <Button 
                  onClick={() => window.location.href = '/api/stripe-connect/setup'}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Connect Stripe Account First
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-xl">        {stripeConnected === false ? (
          <CardContent className="p-8 text-center text-muted-foreground">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h3 className="text-xl font-semibold mb-2">Payment Setup Required</h3>
            <p className="mb-4">Connect your Stripe account to submit events and receive payments.</p>
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">Submit Your Event</CardTitle>
              <CardDescription>
                Fill out the form below to request your event to be listed on Top City Tickets. 
                All submissions are reviewed by our admin team within 1-2 business days before going live.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit} ref={formRef}>
              <CardContent className="space-y-6">
            <div>
              <Label htmlFor="name">Event Name</Label>
              <div className="relative mt-1">
                <TagIcon className={iconProps} />
                <Input id="name" name="name" placeholder="e.g., Grand Charity Gala" required className={commonInputProps} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="date">Date</Label>
                 <div className="relative mt-1">
                  <CalendarIcon className={iconProps} />
                  <Input id="date" name="date" type="date" required className={commonInputProps} />
                </div>
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <div className="relative mt-1">
                  <ClockIcon className={iconProps} />
                  <Input id="time" name="time" type="time" required className={commonInputProps} />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="venue">Venue</Label>
              <div className="relative mt-1">
                <MapPinIcon className={iconProps} />
                <Input id="venue" name="venue" placeholder="e.g., City Convention Hall" required className={commonInputProps}/>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <div className="relative mt-1">
                <Textarea id="description" name="description" placeholder="Tell us more about your event..." required rows={5} />
              </div>
            </div>

            <div>
              <Label htmlFor="ticketPrice">Ticket Price (USD)</Label>
              <div className="relative mt-1">
                <DollarSignIcon className={iconProps} />
                <Input id="ticketPrice" name="ticketPrice" type="number" placeholder="e.g., 25.00 (enter 0 for free events)" required min="0" step="0.01" className={commonInputProps} />
              </div>
            </div>
            
            <div>
              <Label htmlFor="organizerEmail">Organizer Email</Label>
              <div className="relative mt-1">
                <UserIcon className={iconProps} />
                <Input id="organizerEmail" name="organizerEmail" type="email" placeholder="Your contact email for event inquiries" required className={commonInputProps} />
              </div>
            </div>            <div>
              <Label htmlFor="eventFlyer">Event Flyer / Image</Label>
              <div className="mt-2">
                {/* Upload Interface */}
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  {uploadedImage ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <img 
                          src={uploadedImage} 
                          alt="Event flyer preview" 
                          className="max-w-48 max-h-64 object-cover rounded-lg shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-green-600 font-medium">✅ Flyer uploaded successfully!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-muted-foreground">
                        <UploadIcon className="h-12 w-12 mx-auto mb-3" />
                        <h3 className="font-medium text-lg">Upload Event Flyer</h3>
                        <p className="text-sm">Drag and drop or click to upload</p>
                      </div>
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="w-full"
                        >
                          {isUploadingImage ? 'Uploading...' : 'Choose Image File'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Format Guidelines */}
                <div className="mt-3 p-3 bg-blue-50/50 border border-blue-200/50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Recommended Format:</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• <strong>Orientation:</strong> Vertical/Portrait (3:4 or 9:16 ratio)</li>
                    <li>• <strong>Size:</strong> At least 800x1200 pixels</li>
                    <li>• <strong>Format:</strong> JPG, PNG, or WebP</li>
                    <li>• <strong>File size:</strong> Under 5MB</li>
                    <li>• <strong>Content:</strong> Event name, date, venue clearly visible</li>
                  </ul>
                </div>

                {/* Fallback URL Input */}
                <div className="mt-4">
                  <Label htmlFor="imageUrl" className="text-sm">Or provide an image URL (alternative)</Label>
                  <div className="relative mt-1">
                    <ImageIcon className={iconProps} />
                    <Input 
                      id="imageUrl" 
                      name="imageUrl" 
                      type="url" 
                      placeholder="https://example.com/your-flyer.jpg" 
                      className={commonInputProps}
                      disabled={!!uploadedImage}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploadedImage ? 'Image uploaded above will be used' : 'If no image is provided, a default placeholder will be used'}
                  </p>
                </div>
              </div>
            </div></CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <InfoIcon className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  <strong>Review Process:</strong> After submission, our admin team will review your event within 1-2 business days. You'll be notified once it's approved and live!
                </p>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || !stripeConnected}>
              {isSubmitting ? 'Submitting Event...' : 'Submit Event for Approval'}
            </Button>
          </CardFooter>
        </form>
        </>
      )}
      </Card>
    </div>
  );
}
