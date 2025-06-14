import { useState, useCallback } from 'react';

export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const withLoading = useCallback(async (fn: () => Promise<any>) => {
    try {
      setIsLoading(true);
      return await fn();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, withLoading };
}
