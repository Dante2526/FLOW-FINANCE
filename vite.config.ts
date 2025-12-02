import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite de aviso para 1.5MB para limpar o log da Vercel
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Estratégia de divisão de código para performance
          if (id.includes('node_modules')) {
            // Separa o Firebase (que é pesado) em um arquivo isolado
            if (id.includes('firebase')) {
              return 'firebase';
            }
            // Separa bibliotecas visuais pesadas
            if (id.includes('recharts') || id.includes('lucide-react')) {
              return 'ui-libs';
            }
            // Separa o core do React
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // O restante vai para um vendor genérico
            return 'vendor';
          }
        }
      }
    }
  }
});