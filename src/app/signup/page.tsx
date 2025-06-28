"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import Image from "next/image";
import { UserPlus, Mail, Lock, AlertCircle, Sparkles } from "lucide-react";

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!firstName.trim()) {
      setError("First name is required");
      setLoading(false);
      return;
    }

    if (!lastName.trim()) {
      setError("Last name is required");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting Supabase signup for:', email);
      
      // Use standard Supabase auth.signUp (the proper way)
      const { data, error } = await supabase().auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          }
        }
      });

      console.log('Supabase signup response:', { data, error });

      if (error) {
        console.error('Supabase signup error:', error);
        
        if (error.message.includes('already registered')) {
          setError('An account with this email already exists. Please log in instead.');
          setPassword('');
          setConfirmPassword('');
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('User created successfully:', data.user);
        setSuccess('Account created! Please check your email for a confirmation link.');
        
        // Clear form
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Redirect to login page
        setTimeout(() => {
          router.push('/login?message=Account created! Please check your email and then sign in.');
        }, 2000);
      }
    } catch (err) {
      console.error('Signup error details:', err);
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            Join TopCity
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Create your account and start discovering amazing events
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {success && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <Sparkles className="h-4 w-4 text-green-500" />              <AlertDescription className="text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />              <AlertDescription 
                className="text-destructive-foreground"
                dangerouslySetInnerHTML={{ __html: error }}
              />
            </Alert>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  className="ultra-dark-card border-primary/20 focus:border-primary/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  className="ultra-dark-card border-primary/20 focus:border-primary/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email address
              </Label>              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                autoComplete="email"
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
              </Label>              <Input
                id="password"
                type="password"
                placeholder="Create a password (min 6 characters)"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="ultra-dark-card border-primary/20 focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirm Password
              </Label>              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="ultra-dark-card border-primary/20 focus:border-primary/50"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full dark-button-glow"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-muted/20">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-medium text-primary hover:text-primary/80 transition-colors dark-text-glow"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              Start as a user, apply for seller status later
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
