import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const allowedHosts = [
  'inventoryadmin.htetzawphyo.dev',
  'inventoryclient.htetzawphyo.dev'
];

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts
  }
});
