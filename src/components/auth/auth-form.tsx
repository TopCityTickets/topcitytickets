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
          <div className={`mt-4 p-3 text-sm rounded ${state.error ? 'bg-destructive/20 border-destructive' : 'bg-blue-50 border-blue-200'}`}>
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
    } else {
      handleSignIn(e);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md mx-auto p-6 shadow-xl">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Loading...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
            </Button>
          </div>
        </form>
        {message && (
          <div className="mt-4 p-3 text-sm bg-blue-50 border border-blue-200 rounded">
            {message}
          </div>
        )}

        <div className="relative mt-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
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
