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

const TrendingChart = ({ data }) => {

  const formattedData = (data || []).map(item => {
  const [year, month, day] = item.date.split("T")[0].split("-")

  return {
    name: `${day}-${month}`, // 🔥 chuẩn 26-03
    listens: item.count
  }
})

  if (!formattedData.length) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900">Xu hướng phát audio</h2>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#EE4B8E] rounded-full inline-block"></span>
          <span className="text-sm text-gray-600">Lượt phát mỗi ngày</span>
        </div>
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />

            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />

            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="listens"
              stroke="#EE4B8E"
              strokeWidth={3}
              fill="url(#colorListens)"
            />

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