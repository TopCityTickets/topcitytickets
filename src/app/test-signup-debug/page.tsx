"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function TestSignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const testOriginalSignup = async () => {
    setIsSubmitting(true);
    setResult(null);

    try {
      console.log('🧪 Testing original signup action...');
      
      // Create FormData like the original form does
      const formDataObj = new FormData();
      formDataObj.append('email', formData.email);
      formDataObj.append('password', formData.password);
      formDataObj.append('firstName', formData.firstName);
      formDataObj.append('lastName', formData.lastName);

      // Import and call the actual signup action
      const { signUp } = await import('@/lib/actions/auth');
      const result = await signUp(null, formDataObj);
      
      console.log('📋 Original signup result:', result);
      setResult({ 
        type: 'original', 
        success: !result.error, 
        data: result 
      });

    } catch (error) {
      console.error('❌ Original signup test error:', error);
      setResult({ 
        type: 'original', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    setIsSubmitting(false);
  };

  const testDebugSignup = async () => {
    setIsSubmitting(true);
    setResult(null);

    try {
      console.log('🧪 Testing debug signup endpoint...');
      
      const response = await fetch('/api/debug/frontend-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('📋 Debug signup result:', data);
      
      setResult({ 
        type: 'debug', 
        success: data.success, 
        data 
      });

    } catch (error) {
      console.error('❌ Debug signup test error:', error);
      setResult({ 
        type: 'debug', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    setIsSubmitting(false);
  };

  const clearResult = () => {
    setResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Signup Testing Interface</CardTitle>
          <p className="text-muted-foreground">
            Test both the original signup flow and debug endpoint to identify issues
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john.doe@example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="password123"
            />
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={testOriginalSignup} 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Testing...' : 'Test Original Signup'}
            </Button>
            <Button 
              onClick={testDebugSignup} 
              disabled={isSubmitting}
              variant="outline"
              className="flex-1"
            >
              {isSubmitting ? 'Testing...' : 'Test Debug Endpoint'}
            </Button>
          </div>

          {result && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {result.type === 'original' ? 'Original Signup Result' : 'Debug Endpoint Result'}
                </h3>
                <Button onClick={clearResult} variant="ghost" size="sm">
                  Clear
                </Button>
              </div>
              
              <div className={`p-4 rounded-lg border ${
                result.success 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                  : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
              }`}>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
