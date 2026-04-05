import js from '@eslint/js'  //chứa cá quy tắc chuẩn của JS 
import globals from 'globals'   //định nghĩa các biến môi trường có sẵn => giúp ESlint hiểu rằng "window" hay "document" là các biến mặc định của trình duyệt, không phải lỗi "biến lạ"
import reactHooks from 'eslint-plugin-react-hooks'  //kiểm tra xem có dùng react hooks đúng quy tắc không
import reactRefresh from 'eslint-plugin-react-refresh'  //hỗ trợ tính năng "Hot Reload" của vite => giúp giao diện cập nhật ngay lập tức khi sửa code mà kkhông làm mất trạng thái (state) hiện tại
import { defineConfig, globalIgnores } from 'eslint/config' //định nghĩa cấu hình eslint, giúp tổ chức và quản lý các quy tắc một cách rõ ràng hơn, đồng thời cho phép dễ dàng mở rộng hoặc tùy chỉnh trong tương lai

export default defineConfig([
  globalIgnores(['dist']),  //bỏ qua thư mục "dist" (chứa code sau khi đã build xong) => tránh việc eslint phải kiểm tra các file đã được build
  {
    files: ['**/*.{js,jsx}'], //áp dụng các quy tắc này cho tất cả các file có đuôi .js và .jsx trong dự án
    extends: [      //kế thừa các bộ quy tắc có sẵn
      js.configs.recommended,       //quy tắc chuẩn của JavaScript
      reactHooks.configs.flat.recommended,      //quy tắc chuẩn cho React Hooks
      reactRefresh.configs.vite,    //quy tắc hỗ trợ tính năng "Hot Reload" của vite, giúp phát hiện các lỗi liên quan đến việc sử dụng tính năng này
    ],
    languageOptions: {    //thiết lập để ESLint hiểu đang dùng JS hiện đại (ES 2020) và có sử dụng cú pháp JXS (được dùng trong React)
      ecmaVersion: 2020,    //cho phép sử dụng các tính năng mới của JavaScript được giới thiệu trong ES2020, như optional chaining, nullish coalescing, dynamic import, v.v.
      globals: globals.browser, //định nghĩa các biến toàn cục của môi trường trình duyệt (như "window", "document", "navigator",...) để ESLint không báo lỗi khi sử dụng chúng
      parserOptions: {    
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },    
        sourceType: 'module',     //cho phép sử dụng cú pháp module (import/export) trong các file .js và .jsx, giúp tổ chức code tốt hơn và tận dụng được các tính năng của ES6+
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],    // cảnh báo lỗi khi có biến được khai báo nhưng không sử dụng, nhưng bỏ qua các biến có tên bắt đầu bằng chữ hoa hoặc dấu gạch dưới (dùng cho khai báo các component hoặc biến tạm mà chưa viết logic xử lý)
    },
  },
])
