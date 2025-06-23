"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import Image from "next/image";
import { LogIn, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get('message');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setIsSigningIn(true);

    try {
      const client = supabase();
      const { data, error: authError } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;      if (data.user) {
        // Get user role to determine redirect, with fallback for missing users
        try {
          const { data: userData, error: userError } = await client
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (userError && userError.code === 'PGRST116') {
            // User doesn't exist in public.users, create them
            await client
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                role: 'user',
                created_at: data.user.created_at
              });
            
            // Default to user role
            router.replace('/dashboard');
          } else {
            const role = userData?.role || 'user';
            
            // Redirect based on role
            if (role === 'admin') {
              router.replace('/admin/dashboard');
            } else {
              router.replace('/dashboard');
            }
          }
        } catch (roleError) {
          console.error('Role check error:', roleError);
          // Default redirect on any error
          router.replace('/dashboard');
        }
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      setLoading(false);
      setIsSigningIn(false);
    }  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
      <Card className="ultra-dark-card max-w-md w-full shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image 
              src="https://vzndqhzpzdphiiblwplh.supabase.co/storage/v1/object/public/pub/logo.png" 
              alt="TopCityTickets Logo" 
              width={80} 
              height={80}
              className="logo-glow"
            />
          </div>
          <CardTitle className="text-3xl font-black brand-text-gradient">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to your TopCityTickets account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {message && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive-foreground">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="ultra-dark-card border-primary/20 focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="ultra-dark-card border-primary/20 focus:border-primary/50"
              />            </div>

            <Button 
              type="submit" 
              className="w-full dark-button-glow"
              disabled={loading || isSigningIn}
            >
              {loading || isSigningIn ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-muted/20">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link 
                href="/signup" 
                className="font-medium text-primary hover:text-primary/80 transition-colors dark-text-glow"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
