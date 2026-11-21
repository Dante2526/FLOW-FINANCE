import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nearn.flowfinance',
  appName: 'Flow Finance',
  webDir: 'dist',
  backgroundColor: '#0a0a0b',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#0a0a0b',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0a0a0b',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0b',
      overlaysWebView: false
    }
  }
};

export default config;
