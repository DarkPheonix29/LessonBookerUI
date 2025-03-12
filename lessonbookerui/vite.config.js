import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    server: {
        proxy: {
            '^/api/': {
                target: 'https://localhost:7012', // Change this if your backend runs on a different port
                secure: false,
                changeOrigin: true
            }
        },
        port: 50623
    }
})