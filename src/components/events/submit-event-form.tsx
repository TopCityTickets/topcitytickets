"use client";

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { SubmitEventState } from '@/lib/actions/events';
import { submitEvent } from '@/lib/actions/events';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ClockIcon, DollarSignIcon, ImageIcon, InfoIcon, MapPinIcon, TagIcon, UserIcon } from 'lucide-react';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Submitting Event...' : 'Submit Event for Approval'}
    </Button>
  );
}

export default function SubmitEventForm() {
  const initialState: SubmitEventState = { message: null, errors: {}, success: false };

  const reducer = async (
    prevState: SubmitEventState,
    formData: FormData
  ): Promise<SubmitEventState> => {
    return await submitEvent(prevState, formData);
  };

  const [state, formAction] = useFormState(reducer, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? 'Submission Successful' : 'Submission Failed',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        formRef.current?.reset(); // Reset form on success
      }
    }
  }, [state]);

  const commonInputProps = "pl-10";
  const iconProps = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground";


  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Submit Your Event</CardTitle>
          <CardDescription>
            Fill out the form below to request your event to be listed on Top City Tickets. 
            All submissions are subject to review.
          </CardDescription>
        </CardHeader>
        <form action={formAction} ref={formRef}>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="name">Event Name</Label>
              <div className="relative mt-1">
                <TagIcon className={iconProps} />
                <Input id="name" name="name" placeholder="e.g., Grand Charity Gala" required className={commonInputProps} />
              </div>
              {state?.errors?.name && <p className="text-sm text-destructive mt-1">{state.errors.name.join(', ')}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="date">Date</Label>
                 <div className="relative mt-1">
                  <CalendarIcon className={iconProps} />
                  <Input id="date" name="date" type="date" required className={commonInputProps} />
                </div>
                {state?.errors?.date && <p className="text-sm text-destructive mt-1">{state.errors.date.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <div className="relative mt-1">
                  <ClockIcon className={iconProps} />
                  <Input id="time" name="time" type="time" required className={commonInputProps} />
                </div>
                {state?.errors?.time && <p className="text-sm text-destructive mt-1">{state.errors.time.join(', ')}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="venue">Venue</Label>
              <div className="relative mt-1">
                <MapPinIcon className={iconProps} />
                <Input id="venue" name="venue" placeholder="e.g., City Convention Hall" required className={commonInputProps}/>
              </div>
              {state?.errors?.venue && <p className="text-sm text-destructive mt-1">{state.errors.venue.join(', ')}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <div className="relative mt-1">
                 {/* InfoIcon might be too generic, using Textarea directly for now */}
                <Textarea id="description" name="description" placeholder="Tell us more about your event..." required rows={5} />
              </div>
              {state?.errors?.description && <p className="text-sm text-destructive mt-1">{state.errors.description.join(', ')}</p>}
            </div>

            <div>
              <Label htmlFor="ticketPrice">Ticket Price (USD)</Label>
              <div className="relative mt-1">
                <DollarSignIcon className={iconProps} />
                <Input id="ticketPrice" name="ticketPrice" type="number" placeholder="e.g., 25.00 (enter 0 for free events)" required min="0" step="0.01" className={commonInputProps} />
              </div>
              {state?.errors?.ticketPrice && <p className="text-sm text-destructive mt-1">{state.errors.ticketPrice.join(', ')}</p>}
            </div>
            
            <div>
              <Label htmlFor="organizerEmail">Organizer Email</Label>
              <div className="relative mt-1">
                <UserIcon className={iconProps} />
                <Input id="organizerEmail" name="organizerEmail" type="email" placeholder="Your contact email for event inquiries" required className={commonInputProps} />
              </div>
              {state?.errors?.organizerEmail && <p className="text-sm text-destructive mt-1">{state.errors.organizerEmail.join(', ')}</p>}
            </div>

            <div>
              <Label htmlFor="imageUrl">Event Image URL (Optional)</Label>
              <div className="relative mt-1">
                <ImageIcon className={iconProps} />
                <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://example.com/image.png" className={commonInputProps}/>
              </div>
              {state?.errors?.imageUrl && <p className="text-sm text-destructive mt-1">{state.errors.imageUrl.join(', ')}</p>}
              <p className="text-xs text-muted-foreground mt-1">Provide a direct link to an image for your event.</p>
            </div>
            {state?.errors?.general && <p className="text-sm text-destructive mt-1">{state.errors.general.join(', ')}</p>}
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
