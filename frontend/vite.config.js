import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  const BASE_PATH = env.VITE_PUBLIC_URL || '/';
  const API_BASE  = env.VITE_API_BASE_URL || '/api';
  const BACKEND_URL = env.VITE_API_URL || `http://localhost:3000`; 

  console.log('VITE BACKEND URL:', BACKEND_URL);
  console.log('VITE BASE PATH:', BASE_PATH);

  return {
    base: BASE_PATH,
    plugins: [react()],
    server: {
      proxy: {
        [API_BASE]: {
          target: BACKEND_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
