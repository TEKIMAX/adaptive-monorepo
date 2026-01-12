import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-helmet-async'],
            'vendor-convex': ['convex', '@convex-dev/stripe', '@convex-dev/workos-authkit'],
            'vendor-ui': ['@radix-ui/themes', 'lucide-react', 'framer-motion', 'sonner', 'classcat', 'recharts'],
            'vendor-editor': ['@tiptap/core', '@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-placeholder'],
            'vendor-utils': ['pdfjs-dist', 'react-markdown', 'zustand'],
            'vendor-ai': ['@google/genai'],
            'vendor-payment': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
            'vendor-flow': ['@xyflow/react', '@xyflow/system'],
            'vendor-auth': ['@workos-inc/authkit-react', '@workos-inc/authkit-js']
          }
        }
      }
    }
  };
});
