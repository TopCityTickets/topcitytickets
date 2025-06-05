import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
