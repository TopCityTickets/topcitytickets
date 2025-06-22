"use client";

import AuthForm from '@/components/auth/auth-form';

export default function SignUpPage() {
  return <AuthForm mode="signup" />;
}
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { role: 'user' }
        }
      });

      if (error) throw error;
      
      router.push('/login?message=Check your email to confirm your account');
    } catch (err) {
      console.error(err);
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6">
      <h1 className="text-2xl font-bold mb-6">Create an Account</h1>
      <form onSubmit={handleSignUp} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>
        <div className="text-sm text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </div>
      </form>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
