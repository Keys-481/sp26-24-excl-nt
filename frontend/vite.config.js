import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const BACKEND_URL = env.API_URL || `http://localhost:${env.PORT || 3000}`;
  console.log('VITE BACKEND URL:', BACKEND_URL);

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
