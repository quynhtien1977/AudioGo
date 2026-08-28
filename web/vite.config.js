import { defineConfig } from 'vite'   // defineConfig: hàm được cung cấp bởi Vite để định nghĩa cấu hình cho dự án của bạn. Nó giúp bạn cấu hình các tùy chọn khác nhau như plugins, resolve, server, build, v.v.
import react from '@vitejs/plugin-react'    // @vitejs/plugin-react: plugin chính thức của Vite để hỗ trợ React
import path from 'path'     // path: module tích hợp của Node.js để làm việc với đường dẫn tệp và thư mục. Nó cung cấp các phương thức để xử lý và thao tác với đường dẫn một cách dễ dàng.

export default defineConfig({
  plugins: [react()],
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


