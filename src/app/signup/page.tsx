import SignupSimple from './simple';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SignUpPage() {
  return <SignupSimple />;
}
