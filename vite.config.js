import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    base: '/WOS1.0/',
    plugins: [react()],
    server: {
        host: true,
        port: 80,
        allowedHosts: ['wo.local'],
    },
})
