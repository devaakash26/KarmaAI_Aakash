'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refresh session every 5 minutes
      refetchOnWindowFocus={true} // Refresh session when window gets focus
    >
      {children}
    </SessionProvider>
  );
} 