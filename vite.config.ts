import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          maps: ['leaflet', 'react-leaflet', '@react-google-maps/api'],
          utils: ['axios', 'papaparse', 'html2pdf.js'],
        },
      },
    },
  },
  define: {
    'process.env': {},
  },
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet'],
  },
});