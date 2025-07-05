"use client";

import { useFormState, useFormStatus } from 'react-dom';
import { signIn, signUp } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const initialState = {
  message: '',
  error: false,
};

function SubmitButton({ mode }: { mode: 'signin' | 'signup' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Loading...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
    </Button>
  );
}

export default function AuthForm({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const action = mode === 'signup' ? signUp : signIn;
  const [state, formAction] = useFormState(action, initialState);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (state?.message) {
      setMessage(state.message);
    }
  }, [state]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md mx-auto p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-4">
          {mode === 'signup' ? 'Create an Account' : 'Sign In'}
        </h2>

        <form action={formAction}>
          <div className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" type="text" required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" type="text" required />
                  </div>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <SubmitButton mode={mode} />
          </div>
        </form>

        {message && (
          <div className={`mt-4 p-3 text-sm rounded ${state?.error || message.includes('error') || message.includes('Invalid') ? 'bg-destructive/20 border border-destructive/50 text-destructive' : 'bg-primary/10 border border-primary/20 text-primary'}`}>
            {message}
          </div>
        )}

        <div className="relative mt-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2 mt-4">
          <p className="text-sm text-muted-foreground">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            <Button variant="link" asChild className="text-primary">
              <Link href={mode === 'signin' ? '/signup' : '/login'}>
                {mode === 'signin' ? 'Sign Up' : 'Login'}
              </Link>
            </Button>
          </p>
        </div>
      </Card>
    </div>
  );
}

const initialState = {
  message: '',
  error: false,
};

function SubmitButton({ mode }: { mode: 'signin' | 'signup' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Loading...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
    </Button>
  );
}

export default function AuthForm({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const action = mode === 'signup' ? signUp : signIn;
  const [state, formAction] = useFormState(action, initialState);
  const [message, setMessage] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [userPhoneData, setUserPhoneData] = useState({
    firstName: '',
    lastName: ''
  });

  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Format phone number to E.164 format (+1XXXXXXXXXX)
  const formatPhoneToE164 = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // If it's already 11 digits and starts with 1, it's likely +1XXXXXXXXXX
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    // If it's 10 digits, assume US number and add +1
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // If it starts with +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default: add +1 if not already there
    return `+1${digits}`;
  };

  // Format phone number for display (XXX) XXX-XXXX
  const formatPhoneDisplay = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    
    return phone; // Return as-is if we can't format it
  };

  const handlePhoneInputChange = (value: string) => {
    // Limit to 10 digits for US numbers
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      const formatted = formatPhoneDisplay(value);
      setPhoneNumber(formatted);
    }
  };

  useEffect(() => {
    if (state?.message) {
      setMessage(state.message);
    }
  }, [state]);

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    if (!phoneNumber) return;

    try {
      if (!isOtpSent) {
        // For signup, collect user data first
        if (mode === 'signup') {
          const firstName = formData.get('firstName') as string;
          const lastName = formData.get('lastName') as string;
          
          if (!firstName || !lastName) {
            setMessage('Please enter your first and last name');
            return;
          }
          
          setUserPhoneData({ firstName, lastName });
        }

        // Validate and format phone number
        const e164Phone = formatPhoneToE164(phoneNumber);
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        
        if (!phoneRegex.test(e164Phone)) {
          setMessage('Please enter a valid 10-digit US phone number');
          return;
        }

        console.log('Sending OTP to:', e164Phone);

        // Send OTP for both signup and signin
        const { error } = await supabase.auth.signInWithOtp({
          phone: e164Phone,
        });
        
        if (error) {
          console.error('OTP Error:', error);
          let errorMessage = error.message;
          
          // Provide more helpful error messages
          if (error.message.includes('Invalid phone number')) {
            errorMessage = 'Please enter a valid 10-digit US phone number';
          } else if (error.message.includes('SMS')) {
            errorMessage = 'Unable to send SMS. Please check your phone number and try again.';
          } else if (error.message.includes('rate limit')) {
            errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
          }
          
          setMessage(errorMessage);
        } else {
          setIsOtpSent(true);
          setMessage(`Verification code sent to ${phoneNumber}!`);
        }
      } else {
        // Verify OTP
        const otpValue = formData.get('otp') as string;
        
        if (!otpValue) {
          setMessage('Please enter the verification code');
          return;
        }

        if (otpValue.length !== 6) {
          setMessage('Please enter a 6-digit verification code');
          return;
        }

        console.log('Verifying OTP:', otpValue);

        const e164Phone = formatPhoneToE164(phoneNumber);

        if (mode === 'signup') {
          // For signup: verify OTP and create account with user data
          const { data, error } = await supabase.auth.verifyOtp({
            phone: e164Phone,
            token: otpValue,
            type: 'sms',
          });

          if (error) {
            console.error('Verification Error:', error);
            setMessage('Invalid verification code: ' + error.message);
          } else if (data.user) {
            // Update user profile with name after phone verification
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                first_name: userPhoneData.firstName,
                last_name: userPhoneData.lastName,
                display_name: `${userPhoneData.firstName} ${userPhoneData.lastName}`,
              }
            });

            if (updateError) {
              console.error('Profile update error:', updateError);
              setMessage('Account created but profile update failed. Please complete your profile.');
            } else {
              setMessage('Account created successfully! Redirecting...');
              setTimeout(() => router.push('/dashboard'), 1500);
            }
          }
        } else {
          // For signin: just verify OTP
          const { data, error } = await supabase.auth.verifyOtp({
            phone: e164Phone,
            token: otpValue,
            type: 'sms',
          });

          if (error) {
            console.error('Login Error:', error);
            setMessage('Invalid verification code: ' + error.message);
          } else if (data.user) {
            setMessage('Successfully signed in! Redirecting...');
            setTimeout(() => router.push('/dashboard'), 1500);
          }
        }
      }
    } catch (error) {
      console.error('Phone auth error:', error);
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md mx-auto p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-4">
          {mode === 'signup' ? 'Create an Account' : 'Sign In'}
        </h2>

        <Tabs value={authMethod} onValueChange={(value: string) => setAuthMethod(value as 'email' | 'phone')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            <form action={formAction}>
              <div className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" name="firstName" type="text" required />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" name="lastName" type="text" required />
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <SubmitButton mode={mode} />
              </div>
            </form>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4 mt-4">
            {!isOtpSent ? (
              <form onSubmit={handlePhoneAuth}>
                <div className="space-y-4">
                  {mode === 'signup' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" name="firstName" type="text" required />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" name="lastName" type="text" required />
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      type="tel" 
                      placeholder="(555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneInputChange(e.target.value)}
                      required 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your 10-digit US phone number
                    </p>
                  </div>
                  <Button type="submit" className="w-full">
                    Send Verification Code
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePhoneAuth}>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      We sent a 6-digit code to <strong>{phoneNumber}</strong>
                    </p>
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input 
                      id="otp" 
                      name="otp" 
                      type="text" 
                      placeholder="123456"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required 
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Verify Code
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setIsOtpSent(false);
                      setMessage('');
                      setPhoneNumber('');
                      setOtp('');
                    }}
                  >
                    ← Use Different Phone Number
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>
        </Tabs>

        {message && (
          <div className={`mt-4 p-3 text-sm rounded ${state?.error || message.includes('error') || message.includes('Invalid') ? 'bg-destructive/20 border border-destructive/50 text-destructive' : 'bg-primary/10 border border-primary/20 text-primary'}`}>
            {message}
          </div>
        )}

        <div className="relative mt-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2 mt-4">
          <p className="text-sm text-muted-foreground">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            <Button variant="link" asChild className="text-primary">
              <Link href={mode === 'signin' ? '/signup' : '/login'}>
                {mode === 'signin' ? 'Sign Up' : 'Login'}
              </Link>
            </Button>
          </p>
        </div>
      </Card>
    </div>
  );
}
