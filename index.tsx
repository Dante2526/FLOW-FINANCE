
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { FinancialProvider } from './contexts/FinancialContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Cache garbage collection time
      refetchOnWindowFocus: true, // Refetch when returning to app
    },
  },
});

// Register Service Worker for PWA capabilities and Android Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        // Registration successful
      })
      .catch(registrationError => {
        if (registrationError.message?.includes('origin') || registrationError.message?.includes('failed')) {
           return;
        }
        console.warn('SW registration failed:', registrationError);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <FinancialProvider>
        <App />
      </FinancialProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
