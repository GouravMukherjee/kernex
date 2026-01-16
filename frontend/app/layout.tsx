'use client';

import type React from 'react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Kernex - Edge AI Control Plane" />
        <title>Kernex Dashboard</title>
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <main className="min-h-screen bg-background-base">
            {children}
          </main>
          <Toaster position="top-right" />
        </QueryClientProvider>
      </body>
    </html>
  );
}
