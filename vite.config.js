import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures asset paths map perfectly to relative locations
  build: {
    outDir: 'dist', 
  },
})