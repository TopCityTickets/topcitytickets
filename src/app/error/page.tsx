"use client";

import { useSearchParams } from "next/navigation";
import { AuthError } from "@/components/auth/auth-error";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (!error) {
    return null;
  }

  return (
    <AuthError
      error={error}
      errorCode={errorCode || undefined}
      errorDescription={errorDescription || undefined}
    />
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
