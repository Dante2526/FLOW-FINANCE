
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Exclude dependencies served via CDN to prevent "failed to resolve" errors in Dev
    exclude: [
      'react',
      'react-dom',
      'react-dom/client',
      'lucide-react',
      'recharts',
      '@supabase/supabase-js'
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
        '@supabase/supabase-js'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'lucide-react': 'LucideReact',
          'recharts': 'Recharts',
          '@supabase/supabase-js': 'Supabase'
        }
      }
    }
  }
});
