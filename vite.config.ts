
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase the warning limit slightly to reduce noise for moderate overages
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React dependencies
          'vendor-react': ['react', 'react-dom'],
          // UI Libraries
          'vendor-ui': ['lucide-react'],
          // Heavy Charting Library (only loaded when needed via lazy import)
          'vendor-charts': ['recharts'],
          // Backend Services
          'vendor-backend': ['@supabase/supabase-js', 'firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  }
});
