import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dns from 'node:dns'

dns.setDefaultResultOrder('verbatim')

// https://vite.dev/config/
export default defineConfig({
  base: '/your-repo-name/', // Must match your GitHub repo name
  plugins: [react()],
  server: {
  port: 8080,
  host: '192.168.86.179'
}}) 
