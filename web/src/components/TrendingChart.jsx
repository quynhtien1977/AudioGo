import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// --- PHẦN 1: FAKE DATA ---
// Số liệu được tạo ngẫu nhiên nhưng vẫn đảm bảo xu hướng tăng/giảm giống trong hình.
const data = [
  { name: 'Mon', listens: 550 },
  { name: 'Tue', listens: 750 },
  { name: 'Wed', listens: 1400 },
  { name: 'Thu', listens: 1100 },
  { name: 'Fri', listens: 1650 },
  { name: 'Sat', listens: 2200 },
  { name: 'Sun', listens: 2500 },
  { name: 'Today', listens: 1900 },
];

const TrendingChart = () => {
  return (
    // Thêm border và padding để có giao diện card giống như trong ảnh của bạn.
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900">Trending Audio Listens</h2>
        <div className="flex items-center gap-2">
          {/* Chấm tròn màu hồng cho Legend */}
          <span className="w-3 h-3 bg-[#EE4B8E] rounded-full inline-block"></span>
          <span className="text-sm text-gray-600">Daily Listens</span>
        </div>
      </div>

      {/* --- PHẦN 2: CHÍNH CỦA BIỂU ĐỒ --- */}
      <div className="h-[350px]">
        {/* ResponsiveContainer đảm bảo biểu đồ tự co giãn theo chiều rộng của thẻ cha. */}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            // Margin giúp các trục và text không bị cắt.
            margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
          >
            {/* Lưới nền nét đứt màu xám nhạt */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            
            {/* Trục X: Hiển thị tên các ngày */}
            <XAxis 
              dataKey="name" 
              axisLine={false} // Ẩn đường trục
              tickLine={false} // Ẩn các vạch chia
              tick={{ fill: '#6B7280', fontSize: 12 }} // Style text cho các nhãn
              padding={{ left: 10, right: 10 }} // Padding 2 bên trục X
            />
            
            {/* Trục Y: Hiển thị số lượt nghe (500, 1000, 1500, 2000, 2500) */}
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              domain={[0, 2500]} // Định giới hạn từ 0 đến 2500
              ticks={[0, 500, 1000, 1500, 2000, 2500]} // Xác định các mốc hiển thị cụ thể
              // Định dạng để thêm 'k' cho các nghìn (vd: 1.5k)
              tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
            />
            
            {/* Tooltip: Hiển thị giá trị khi hover chuột vào các điểm dữ liệu */}
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
              labelStyle={{ fontWeight: 'bold' }}
              cursor={{ stroke: '#EE4B8E', strokeWidth: 1 }} // Style cho đường kẻ khi hover
            />
            
            {/* --- PHẦN 3: ĐƯỜNG VÀ VÙNG LẤP ĐẦY --- */}
            <Area
              type="monotone" // Làm cho đường kẻ mềm mại (cong) thay vì gãy khúc.
              dataKey="listens"
              stroke="#EE4B8E" // Màu hồng đậm cho đường kẻ chính
              strokeWidth={3} // Độ dày đường kẻ
              fill="url(#colorListens)" // Sử dụng Gradient để lấp đầy (sẽ định nghĩa dưới đây)
              // Style cho các điểm chấm trên đường
              dot={{ stroke: '#EE4B8E', strokeWidth: 3, fill: 'white', r: 5 }} 
              // Style cho các điểm chấm khi hover
              activeDot={{ stroke: '#EE4B8E', strokeWidth: 3, fill: '#EE4B8E', r: 7 }}
            />
            
            {/* Định nghĩa Gradient cho phần lấp đầy (từ hồng nhạt sang trong suốt) */}
            <defs>
              <linearGradient id="colorListens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EE4B8E" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#EE4B8E" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendingChart;