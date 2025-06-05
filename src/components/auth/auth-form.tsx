'use client';

import { useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { signInWithPassword, signUpWithPassword } from '@/lib/actions/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  name: z.string().optional(), // Optional for login
});

type AuthFormValues = z.infer<typeof formSchema>;

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  const onSubmit = async (values: AuthFormValues) => {
    startTransition(async () => {
      try {
        let error;
        if (mode === 'login') {
          error = await signInWithPassword(values);
        } else {
          if (!values.name) {
            form.setError('name', { type: 'manual', message: 'Name is required for signup.' });
            return;
          }
          error = await signUpWithPassword(values);
        }

        if (error) {
          toast({
            title: 'Authentication Error',
            description: error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: mode === 'login' ? 'Login Successful' : 'Signup Successful',
            description: mode === 'login' ? 'Welcome back!' : 'Please check your email to verify your account.',
          });
          const redirectedFrom = searchParams.get('redirectedFrom') || '/';
          router.push(redirectedFrom);
          router.refresh(); // Important to update server state
        }
      } catch (err: any) {
        toast({
          title: 'An Unexpected Error Occurred',
          description: err.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">
            {mode === 'login' ? 'Welcome Back!' : 'Create an Account'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Enter your credentials to access your account.' : 'Fill in the details to join Top City Tickets.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    {...form.register('name')}
                    className="pl-10"
                    disabled={isPending}
                  />
                </div>
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...form.register('email')}
                  className="pl-10"
                  disabled={isPending}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...form.register('password')}
                  className="pl-10 pr-10"
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isPending} variant="default">
              {isPending ? (mode === 'login' ? 'Logging in...' : 'Signing up...') : (mode === 'login' ? 'Login' : 'Sign Up')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
           <p className="text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <Button variant="link" asChild className="text-primary">
              <Link href={mode === 'login' ? '/signup' : '/login'}>
                {mode === 'login' ? 'Sign Up' : 'Login'}
              </Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
