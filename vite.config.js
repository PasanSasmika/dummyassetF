import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
    server: {
    host: '0.0.0.0', // Alternately, set to true
    port: 5173,      // Optional: Specify your preferred port
  }
})