import { defineConfig } from 'vite'   // defineConfig: hàm được cung cấp bởi Vite để định nghĩa cấu hình cho dự án của bạn. Nó giúp bạn cấu hình các tùy chọn khác nhau như plugins, resolve, server, build, v.v.
import react from '@vitejs/plugin-react'    // @vitejs/plugin-react: plugin chính thức của Vite để hỗ trợ React
import path from 'path'     // path: module tích hợp của Node.js để làm việc với đường dẫn tệp và thư mục. Nó cung cấp các phương thức để xử lý và thao tác với đường dẫn một cách dễ dàng.

export default defineConfig({
  plugins: [react()],   // dùng để chạy project, cho phép Vite biên dịch các file .jsx thành mã JS thuần túy
  resolve: {    // resolve: một phần của cấu hình Vite cho phép bạn định nghĩa các alias (bí danh) để dễ dàng nhập các module trong dự án của bạn
    alias: {
      "@": path.resolve(__dirname, "./src"),    //path.resolve: tìm đường dẫn tuyệt đối đến folder src, vite sẽ tự động thay thế @ bằng đường dẫn thực tế đến thư mục src
    },
  },
})

