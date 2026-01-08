/**
 * Configuration Vite avec proxy pour le backend
 * 
 * Copiez ce fichier vers vite.config.js dans votre projet frontend
 * 
 * Ce proxy redirige toutes les requêtes /api vers http://localhost:5000/api
 * Cela évite les problèmes CORS en développement
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 5173,
    proxy: {
      // Redirige toutes les requêtes /api vers le backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Optionnel : réécrire le chemin si nécessaire
        // rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  
  // Configuration pour la production (optionnel)
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

