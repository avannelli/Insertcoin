import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    // Wait for editor writes to finish before transforming a partially written module.
    watch: { awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 25 } },
  },
  build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
});
