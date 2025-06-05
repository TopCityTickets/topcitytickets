'use client';

import { useState, useEffect } from 'react';

export default function CopyrightYear() {
  // Initialize with the current year. This will be consistent for server and client initial render.
  const [year, setYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    // This effect ensures that if the component stays mounted for a very long time
    // (e.g., across midnight on New Year's Eve), the year would update.
    // For typical page loads, the initial useState is sufficient.
    // It also confirms client-side determination of the year.
    const currentClientYear = new Date().getFullYear();
    if (year !== currentClientYear) {
      setYear(currentClientYear);
    }
  }, [year]); // Re-run if 'year' state changes or to ensure consistency. An empty array [] would also generally work.

  return <>{year}</>;
}
