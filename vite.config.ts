import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  base: "./",
  build: {
    outDir: "web"
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      xml2js: "browser-xml2js",
      "./html.js": path.resolve(process.cwd(), "./src/lib/html.js")
    },
  },
})
