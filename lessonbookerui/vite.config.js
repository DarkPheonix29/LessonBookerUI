import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    server: {
        proxy: {
            '^/api/': {
                target: 'https://your-cloud-run-service-xyz.a.run.app',
                changeOrigin: true,
                secure: true
            }
        }
    }
})