import '@/styles/globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { useState, useEffect } from 'react';

// Create a client
const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Mount effect to handle client-side initialization
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return the properly structured application
  return (
    <QueryClientProvider client={queryClient}>
      {isMounted ? (
        // Only render AuthProvider after client-side hydration is complete
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster />
      </AuthProvider>
      ) : (
        // During SSR or before hydration, render without auth to prevent hook errors
        <>
          <Component {...pageProps} />
          {/* Don't render Toaster during SSR */}
        </>
      )}
    </QueryClientProvider>
  );
}
