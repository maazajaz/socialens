"use client";
import React, { useEffect } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (garbage collection time - replaces cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 404 or auth errors
        if (error?.status === 404 || error?.status === 401) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      networkMode: 'offlineFirst', // Try cache first when offline
    },
  },
});

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('App came online, refetching queries...')
      queryClient.refetchQueries()
    }

    const handleOffline = () => {
      console.log('App went offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
