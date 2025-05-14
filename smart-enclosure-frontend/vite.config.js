import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allows network access
    port: 5173, // Adjust the port if needed
    allowedHosts: ['bruck.gg', 'localhost'] // Add your domain and any other desired hosts
  }
})
