
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Increases limit to suppress warning, but keeps default safe bundling strategy
    chunkSizeWarningLimit: 1600,
  }
});
