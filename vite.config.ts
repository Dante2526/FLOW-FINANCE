import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite para suprimir o aviso, mas mantem o bundling padrão do Vite
    // para evitar erros de carregamento (white screen/404s) causados por manualChunks incorretos.
    chunkSizeWarningLimit: 1600,
  }
});