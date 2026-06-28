import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://pivotvault-production.up.railway.app',
        changeOrigin: true
      }
    }
  },
  // Strip console/debugger noise from production bundles only.
  esbuild: command === 'build' ? { drop: ['console', 'debugger'] } : {},
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split heavy third-party libraries into cacheable vendor chunks so the
        // initial route does not pay for charts/graph/animation code it never uses.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts', 'react-countup'],
          d3: ['d3-selection', 'd3-zoom', 'd3-drag', 'd3-force', 'd3-transition'],
          gsap: ['gsap'],
          motion: ['framer-motion'],
          vendor: ['axios', 'clsx', 'tailwind-merge', 'jszip']
        }
      }
    }
  }
}));
