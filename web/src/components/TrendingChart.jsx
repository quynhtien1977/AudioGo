import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { getTrendingData } from "../api/chartApi";

const TrendingChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getTrendingData();
        // Ensure data is an array and map it to the required format
        const formattedData = Array.isArray(res)
          ? res.map((item) => ({
              name: item.date, // Assuming API returns a `date` field
              listens: item.count // Assuming API returns a `count` field
            }))
          : [];
        setData(formattedData);
      } catch (error) {
        console.error("Error fetching trending data:", error);
      }
    };

    fetchData();
  }, []);

  // loading state
  if (!data.length) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p>Loading chart...</p>
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
            data={data}
            margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />

            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              padding={{ left: 10, right: 10 }}
            />

            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              domain={[0, 'dataMax + 500']}
              tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
            />

            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
              labelStyle={{ fontWeight: 'bold' }}
              cursor={{ stroke: '#EE4B8E', strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="listens"
              stroke="#EE4B8E"
              strokeWidth={3}
              fill="url(#colorListens)"
              dot={{ stroke: '#EE4B8E', strokeWidth: 3, fill: 'white', r: 5 }}
              activeDot={{ stroke: '#EE4B8E', strokeWidth: 3, fill: '#EE4B8E', r: 7 }}
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