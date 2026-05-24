import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import 'leaflet.heat'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Map as MapIcon, BarChart3, TrendingUp, Headphones, Clock, Calendar } from 'lucide-react'
import { getHeatmap, getListenStats, getHeatmapByTime } from '@/api/analyticsApi'
import { getAllPOIs } from '@/api/poiApi'
import PageHeader from "@/components/PageHeader"
import StatsCard from "@/components/StatsCard"

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component để inject heatmap layer vào leaflet map
function HeatmapLayer({ points }) {
  const map = useMap()
  
  useEffect(() => {
    if (!map || !points || points.length === 0) return
    
    const heatPoints = points.map(p => [p.latitude, p.longitude, p.count])
    const maxCount = Math.max(...points.map(p => p.count), 1)
    
    // Cấu hình Heatmap (Màu đỏ mờ biểu thị di chuyển)
    const heatLayer = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 25,
      maxZoom: 16,
      max: maxCount * 1.5,
      minOpacity: 0.3,
      gradient: { 0.4: '#fca5a5', 0.6: '#ef4444', 0.8: '#dc2626', 1.0: '#991b1b' }
    }).addTo(map)
    
    // Tự động zoom đến khu vực có dữ liệu
    try {
      const bounds = L.latLngBounds(heatPoints.map(p => [p[0], p[1]]))
      map.fitBounds(bounds, { padding: [50, 50] })
    } catch (e) {
      console.warn("Could not fit bounds:", e)
    }
    
    return () => {
      map.removeLayer(heatLayer)
    }
  }, [map, points])
  
  return null
}

export default function AnalyticsPage() {
  const [heatmapData, setHeatmapData] = useState([])
  const [heatmapByTimeData, setHeatmapByTimeData] = useState([])
  const [statsData, setStatsData] = useState(null)
  const [poisData, setPoisData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingByTime, setLoadingByTime] = useState(false)
  
  // State cho Heatmap theo thời gian
  const [viewMode, setViewMode] = useState('overview') // 'overview' hoặc 'by-time'
  const [selectedDate, setSelectedDate] = useState('2026-05-02') // ✅ Default là ngày có data
  const [selectedHour, setSelectedHour] = useState(null) // null = tất cả giờ, 0-23 = giờ cụ thể

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [heat, stats, pois] = await Promise.all([
          getHeatmap(),
          getListenStats(30), // Mặc định xem 30 ngày
          getAllPOIs()
        ])
        setHeatmapData(heat || [])
        setStatsData(stats)
        setPoisData(pois || [])
      } catch (error) {
        console.error("Lỗi tải dữ liệu Analytics", error)
      }
      setLoading(false)
    }
    
    loadData()
  }, [])

  // Load heatmap theo thời gian khi có thay đổi
  useEffect(() => {
    if (viewMode === 'by-time') {
      loadHeatmapByTime()
    }
  }, [selectedDate, selectedHour, viewMode])

  const loadHeatmapByTime = async () => {
    try {
      setLoadingByTime(true)
      console.log(`🔥 Loading heatmap for date: ${selectedDate}, hour: ${selectedHour}`)
      const data = await getHeatmapByTime(selectedDate, selectedHour)
      console.log(`✅ Heatmap data received:`, data)
      setHeatmapByTimeData(data || [])
    } catch (error) {
      console.error("Lỗi tải heatmap theo thời gian", error)
      setHeatmapByTimeData([])
    } finally {
      setLoadingByTime(false)
    }
  }

  // Chuẩn bị data cho biểu đồ cột
  const chartData = statsData?.dailyListens?.map(d => ({
    date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    totalSeconds: d.totalDuration || 0,
    durationMinutes: parseFloat(((d.totalDuration || 0) / 60).toFixed(1))
  })) || []

  // Custom tooltip cho chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const sec = data.totalSeconds;
      const timeText = sec < 60 ? `${sec} giây` : `${Math.floor(sec / 60)} phút ${sec % 60 > 0 ? (sec % 60) + ' giây' : ''}`;
      return (
        <div className="bg-white p-4 rounded-xl border border-pink-100/50 shadow-lg">
          <p className="font-semibold text-gray-700 text-sm mb-1">{label}</p>
          <p className="text-pink-500 font-bold text-xs">Tổng thời gian: {timeText}</p>
        </div>
      );
    }
    return null;
  };

  const totalListens = statsData?.totalListens || 0

  if (loading) {
    return (
      <div className="flex flex-col gap-3 justify-center items-center h-[50vh] text-gray-500">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-pink-500 rounded-full animate-spin" />
        <span className="text-sm font-medium">Đang tải dữ liệu phân tích...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="ANALYTICS & HEATMAP"
        description="Phân tích xu hướng người dùng và mật độ di chuyển trên bản đồ."
        icon={<BarChart3 size={24} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* STATS OVERVIEW */}
        <StatsCard
          title="TỔNG LƯỢT NGHE (TOÀN HỆ THỐNG)"
          value={totalListens.toLocaleString()}
          sub="Tăng trưởng ổn định 🟢"
          icon={<Headphones size={20} />}
        />

        {/* CHART CONTAINER */}
        <div className="bg-white p-6 rounded-2xl border border-pink-100/30 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-6 text-gray-700 font-bold text-xs uppercase tracking-wider">
            <BarChart3 size={18} className="text-pink-500" />
            Biểu Đồ Tổng Thời Gian Nghe (Phút) - 30 Ngày Qua
          </div>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fff5f7' }} />
                  <Bar dataKey="durationMinutes" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={40} name="Phút" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-400 text-sm">
                Chưa có dữ liệu lượt nghe
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HEATMAP SECTION */}
      <div className="bg-white rounded-2xl border border-pink-100/30 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-pink-50">
          {/* Tiêu đề + Thông tin */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3 text-gray-700 font-bold text-xs uppercase tracking-wider">
              <MapIcon size={18} className="text-pink-500" />
              Bản Đồ Nhiệt Mật Độ Di Chuyển (Heatmap)
            </div>
            <div className="text-xs text-pink-500 bg-pink-50 font-bold px-3 py-1 rounded-full">
              {viewMode === 'overview' ? heatmapData.length : heatmapByTimeData.length} điểm tọa độ
            </div>
          </div>

          {/* Tab chọn view mode */}
          <div className="flex gap-2 mb-6 border-b border-pink-50/50 pb-4">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                viewMode === 'overview'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-100'
                  : 'bg-gray-50 text-gray-500 hover:bg-pink-50/50 hover:text-pink-500'
              }`}
            >
              📊 Tổng Quan
            </button>
            <button
              onClick={() => setViewMode('by-time')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                viewMode === 'by-time'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-100'
                  : 'bg-gray-50 text-gray-500 hover:bg-pink-50/50 hover:text-pink-500'
              }`}
            >
              ⏰ Theo Thời Gian
            </button>
          </div>

          {/* Controls cho chế độ theo thời gian */}
          {viewMode === 'by-time' && (
            <div className="flex gap-4 flex-wrap items-center bg-pink-50/10 p-4 rounded-xl border border-pink-100/20">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-pink-500" />
                <label className="text-xs font-bold text-gray-500 uppercase">Ngày:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-pink-100/50 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <Clock size={16} className="text-pink-500" />
                <label className="text-xs font-bold text-gray-500 uppercase">Giờ:</label>
                <select
                  value={selectedHour === null ? '' : selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value === '' ? null : parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-pink-100/50 rounded-lg text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-300 font-medium"
                >
                  <option value="">Tất cả giờ</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00 - {(i + 1).toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs font-semibold text-pink-500 ml-auto bg-pink-50/50 px-3 py-1.5 rounded-lg border border-pink-100/30">
                {selectedHour !== null 
                  ? `${new Date(selectedDate).toLocaleDateString('vi-VN')} • Giờ ${selectedHour.toString().padStart(2, '0')}:00` 
                  : `${new Date(selectedDate).toLocaleDateString('vi-VN')} • Toàn bộ ngày`
                }
              </div>
            </div>
          )}
        </div>
        
        <div className="h-[600px] w-full relative z-0">
          <MapContainer 
            center={[10.7769, 106.7009]} 
            zoom={14} 
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            {/* Sử dụng map sáng/nhạt để làm nổi bật Heatmap */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            {/* Heatmap Layer - Overview */}
            {viewMode === 'overview' && heatmapData.length > 0 && <HeatmapLayer points={heatmapData} />}
            
            {/* Heatmap Layer - By Time */}
            {viewMode === 'by-time' && heatmapByTimeData.length > 0 && <HeatmapLayer points={heatmapByTimeData} />}

            {/* POI Markers */}
            {poisData.map(poi => (
              <Marker 
                key={poi.poiId} 
                position={[poi.latitude, poi.longitude]} 
              >
                <Popup>
                  <div className="font-semibold text-gray-800 text-xs">{poi.title}</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Loading Overlay - By Time */}
          {viewMode === 'by-time' && loadingByTime && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-[1000] rounded-xl transition-all duration-200">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-gray-100 border-t-pink-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">Đang tải dữ liệu...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
