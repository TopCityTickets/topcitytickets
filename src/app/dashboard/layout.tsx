export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Let client-side auth handle the authentication check
  // since server-side session sync has issues with our setup
  return <>{children}</>;
}
