import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AuthErrorProps {
  error: string;
  errorCode?: string;
  errorDescription?: string;
}

export function AuthError({ error, errorCode, errorDescription }: AuthErrorProps) {
  const getErrorMessage = () => {
    switch (errorCode) {
      case 'otp_expired':
        return {
          title: 'Link Expired',
          description: 'The email verification link has expired. Please request a new one.',
          action: '/login'
        };
      case 'access_denied':
        return {
          title: 'Access Denied',
          description: 'Unable to verify your email. Please try signing in again.',
          action: '/login'
        };
      default:
        return {
          title: 'Authentication Error',
          description: errorDescription || 'An error occurred during authentication.',
          action: '/login'
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">
        <Alert variant="destructive" className="bg-red-950/50 border-red-500">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <AlertTitle className="text-red-400">{errorInfo.title}</AlertTitle>
          <AlertDescription className="text-gray-300 mt-2">
            {errorInfo.description}
          </AlertDescription>
        </Alert>
        
        <div className="text-center">
          <Link href={errorInfo.action}>
            <Button 
              className="bg-neon-cyan hover:bg-cyan-600 text-black font-bold"
            >
              Try Again
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
