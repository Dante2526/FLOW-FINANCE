
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill for process.env to prevent runtime crashes in browser
    'process.env': {},
    // Inject API Key safely
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
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
      // Externalize dependencies in Production Build
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
