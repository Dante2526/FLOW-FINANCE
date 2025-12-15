
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Explicitly define env variables instead of replacing the whole process.env object
    // This prevents breaking other libraries that rely on process.env check
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    // Exclude dependencies served via CDN to prevent "failed to resolve" errors in Dev
    exclude: [
      'react',
      'react-dom',
      'react-dom/client',
      'lucide-react',
      'recharts',
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ]
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Externalize dependencies in Production Build to use CDN versions defined in index.html
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'lucide-react',
        'recharts',
        '@supabase/supabase-js',
        '@tanstack/react-query'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'lucide-react': 'LucideReact',
          'recharts': 'Recharts',
          '@supabase/supabase-js': 'Supabase',
          '@tanstack/react-query': 'ReactQuery'
        }
      }
    }
  }
});
