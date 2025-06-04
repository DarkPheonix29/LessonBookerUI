import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    server: {
        proxy: {
            '^/api/': {
                target: 'https://localhost:7012',
                changeOrigin: true,
                secure: false // Set to false for local HTTP
            },
            '^/calendarHub': { // <-- Add this block
                target: 'https://localhost:7012',
                changeOrigin: true,
                secure: false,
                ws: true
            }
        }
    }
})