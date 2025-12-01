import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for PWA capabilities and Android Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Explicitly register at root scope
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered successfully:', registration.scope);
      })
      .catch(registrationError => {
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
