"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="ultra-dark-card max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <CardTitle className="text-xl font-bold text-white">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem completing your sign-in process.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>This could happen due to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>An expired or invalid authentication link</li>
              <li>The link was already used</li>
              <li>Browser security settings blocking the redirect</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full dark-button-glow">
              <Link href="/login">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Signing In Again
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center mt-6">
            <p>If this problem persists, please contact support.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
