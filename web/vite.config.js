import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
      open: false,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2022",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react/") || id.includes("react-dom/") || id.includes("react-router-dom/")) {
              return "vendor-react";
            }
            if (id.includes("leaflet") || id.includes("@react-google-maps")) {
              return "vendor-maps";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            if (id.includes("@dnd-kit")) {
              return "vendor-dnd";
            }
            if (id.includes("@microsoft/signalr")) {
              return "vendor-signalr";
            }
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
            if (id.includes("lucide-react")) {
              return "vendor-lucide";
            }
            if (id.includes("@tanstack/react-query") || id.includes("axios")) {
              return "vendor-query";
            }
          }
        },
      },
    },
  },
})


