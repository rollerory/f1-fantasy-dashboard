import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// GitHub Pages serves project sites from /<repo-name>/, so the base path
// must match the repository name if you deploy there.
export default defineConfig({
  base: '/f1-fantasy-dashboard/',
  plugins: [react()],
})
