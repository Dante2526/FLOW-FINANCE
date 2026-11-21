import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapacitorApp } from '@capacitor/app';
import './index.css';
import App from './App';

// Initialize Native Capacitor Plugins (Android / iOS)
if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#0a0a0b' }).catch(() => {});
  SplashScreen.hide().catch(() => {});

  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      CapacitorApp.minimizeApp().catch(() => CapacitorApp.exitApp());
    }
  });
}

// Register Service Worker only on Web (not inside native Capacitor WebView)
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Explicitly register with relative path to avoid Origin mismatch in previews
    navigator.serviceWorker.register('./sw.js')
      .then(() => {
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

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
