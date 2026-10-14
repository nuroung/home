import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { worldsPlugin } from './vite-plugins/worlds.ts'

export default defineConfig({
  plugins: [react(), worldsPlugin()],
})
