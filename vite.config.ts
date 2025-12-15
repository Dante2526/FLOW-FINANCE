
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Explicitly define env variables to ensure they are replaced at build time
    // This handles the process.env access in the browser safely
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    // Exclude dependencies that are loaded via CDN in index.html
    exclude: [
      'react',
      'react-dom',
      'react-dom/client',
      'lucide-react',
      'recharts',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      '@google/genai'
    ]
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Treat CDN dependencies as external so they aren't bundled
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'lucide-react',
        'recharts',
        '@supabase/supabase-js',
        '@tanstack/react-query',
        '@google/genai'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'lucide-react': 'LucideReact',
          'recharts': 'Recharts',
          '@supabase/supabase-js': 'Supabase',
          '@tanstack/react-query': 'ReactQuery',
          '@google/genai': 'GoogleGenAI'
        }
      }
    }
  }
});
