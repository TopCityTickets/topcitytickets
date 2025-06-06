'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff, User, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const user = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('currentUser') || 'null' : 'null');
    if (user) {
      router.push('/dashboard/profile');
    }
  }, []);

  const onSubmit = async (values: AuthFormValues) => {
    startTransition(() => {
      let users = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('users') || '{}' : '{}');
      let error = null;
      if (mode === 'login') {
        const user = users[values.email];
        if (!user || user.password !== values.password) {
          error = 'Invalid email or password.';
        } else {
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      } else {
        if (!values.name) {
          form.setError('name', { type: 'manual', message: 'Name is required for signup.' });
          return;
        }
        if (users[values.email]) {
          error = 'User already exists.';
        } else {
          const role = values.email === 'topcitytickets@gmail.com' ? 'admin' : 'user';
          const user = { email: values.email, password: values.password, name: values.name, role };
          users[values.email] = user;
          localStorage.setItem('users', JSON.stringify(users));
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
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
          description: mode === 'login' ? 'Welcome back!' : 'Account created!',
        });
        const redirectedFrom = searchParams.get('redirectedFrom') || '/dashboard/profile';
        router.push(redirectedFrom);
        router.refresh();
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
        <CardContent className="space-y-6">
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
                  disabled={isPending}
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
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
