import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // allow the external host used by the sandbox/csb preview
    allowedHosts: [
      'gqz6hh-5173.csb.app'
    ]
  }
})
