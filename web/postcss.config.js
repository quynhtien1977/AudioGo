export default {
  plugins: {    
    tailwindcss: {},    // tích hợp Tailwind CSS - khi viết class như bg-pink-200 => PostCSS sẽ gọi plugin Tailwind CSS để chuyển đổi thành CSS thuần
    autoprefixer: {},   // tự động thêm tiền tố trình duyệt vào CSS để đảm bảo tính tương thích với các trình duyệt khác nhau
  },
}
