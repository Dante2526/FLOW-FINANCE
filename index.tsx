import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for PWA capabilities and Android Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Explicitly register with relative path to avoid Origin mismatch in previews
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        // Registration successful
      })
      .catch(registrationError => {
        // Silently skip specific error in preview environments to keep console clean
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

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);