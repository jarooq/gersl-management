import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Output directory
    outDir: 'dist',
    // Generate sourcemaps for production (disable for smaller builds)
    sourcemap: false,
    // Chunk size warning limit (500kb)
    chunkSizeWarningLimit: 500,
    // Rollup options for advanced bundling
    rollupOptions: {
      output: {
        // Manual chunking strategy
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'utils-vendor': ['date-fns', 'axios', 'zustand'],
          'chart-vendor': ['recharts'],
          'document-vendor': ['jspdf', 'xlsx'],

          // Page chunks by module
          'pages-core': [
            './src/pages/Dashboard/Dashboard.jsx',
            './src/pages/Login.jsx'
          ],
          'pages-orphans': [
            './src/pages/Orphans/OrphansPage.jsx'
          ],
          'pages-projects': [
            './src/pages/Projects/ProjectsPage.jsx'
          ],
          'pages-finance': [
            './src/pages/Finance/FinancePage.jsx'
          ],
          'pages-hr': [
            './src/pages/HR/HRPage.jsx',
            './src/pages/HR/AttendancePage.jsx',
            './src/pages/HR/OnboardingPage.jsx',
            './src/pages/HR/AppraisalPage.jsx'
          ],
          'pages-proposals': [
            './src/pages/Proposals/ProposalsPage.jsx'
          ],
          'pages-settings': [
            './src/pages/Settings/SettingsPage.jsx',
            './src/pages/SystemSettings/SystemSettingsPage.jsx'
          ]
        },
        // Asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        // Chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        // Entry file names
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Minify options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
      },
      format: {
        comments: false, // Remove comments
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  // Optimize deps
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lucide-react',
      'date-fns',
      'zustand'
    ],
    exclude: [],
  },
  server: {
    port: 5173,
    middlewareMode: false,
    hmr: {
      overlay: true,
    },
    watch: {
      // Reduce aggressive file watching
      usePolling: false,
      interval: 1000,
    },
    proxy: {
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 5173,
  },
})