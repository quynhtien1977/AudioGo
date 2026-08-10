import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import 'leaflet.heat'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Map as MapIcon, BarChart3, Headphones, Clock, Calendar, MapPin, Activity, Download } from 'lucide-react'
import { getHeatmap, getListenStats, getHeatmapByTime, getTopPOIs } from '@/api/analyticsApi'
import { getAllPOIs } from '@/api/poiApi'
import PageLoader from "@/components/PageLoader"
import PageHeader from "@/components/PageHeader"
import StatsCard from "@/components/StatsCard"

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

// Màu cho Pie chart theo category
const CATEGORY_COLORS = [
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#8b5cf6', '#64748b',
]

// Component để inject heatmap layer vào leaflet map
function HeatmapLayer({ points }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !points || points.length === 0) return

    const heatPoints = points.map(p => [p.latitude, p.longitude, p.count])
    const maxCount = Math.max(...points.map(p => p.count), 1)

    const heatLayer = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 25,
      maxZoom: 16,
      max: maxCount * 1.5,
      minOpacity: 0.3,
      gradient: { 0.4: '#fca5a5', 0.6: '#ef4444', 0.8: '#dc2626', 1.0: '#991b1b' },
    }).addTo(map)

    try {
      const bounds = L.latLngBounds(heatPoints.map(p => [p[0], p[1]]))
      map.fitBounds(bounds, { padding: [50, 50] })
    } catch (e) {
      console.warn("Could not fit bounds:", e)
    }

    return () => { map.removeLayer(heatLayer) }
  }, [map, points])

  return null
}

// Custom tooltip cho bar chart
function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const sec = payload[0].payload.totalSeconds
    const timeText = sec < 60
      ? `${sec} giây`
      : `${Math.floor(sec / 60)} phút${sec % 60 > 0 ? ` ${sec % 60} giây` : ''}`
    return (
      <div className="bg-white p-4 rounded-xl border border-pink-100/50 shadow-lg">
        <p className="font-semibold text-gray-700 text-sm mb-1">{label}</p>
        <p className="text-pink-500 font-bold text-xs">Tổng thời gian: {timeText}</p>
      </div>
    )
  }
  return null
}

// Custom tooltip cho pie chart
function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl border border-pink-100/50 shadow-lg">
        <p className="font-semibold text-gray-700 text-xs">{payload[0].name}</p>
        <p className="text-pink-500 font-bold text-xs">{payload[0].value} lượt nghe</p>
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const [heatmapData, setHeatmapData] = useState([])
  const [heatmapByTimeData, setHeatmapByTimeData] = useState([])
  const [statsData, setStatsData] = useState(null)
  const [poisData, setPoisData] = useState([])
  const [topPoisData, setTopPoisData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingByTime, setLoadingByTime] = useState(false)

  // State cho Heatmap theo thời gian
  const [viewMode, setViewMode] = useState('overview')
  const [selectedDate, setSelectedDate] = useState('2026-05-02')
  const [selectedHour, setSelectedHour] = useState(null)

  // Export CSV helper
  const exportCSV = () => {
    const rows = [
      ['STT', 'Tên POI', 'Lượt nghe', 'Category', 'Latitude', 'Longitude'],
      ...topPoisData.map((poi, i) => [
        i + 1,
        `"${(poi.title || poi.name || '').replace(/"/g, '""')}"`,
        poi.listenCount ?? 0,
        `"${(poi.category || '').replace(/"/g, '""')}"`,
        poi.latitude ?? '',
        poi.longitude ?? '',
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics_top_pois_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [heat, stats, pois, topPois] = await Promise.all([
          getHeatmap(),
          getListenStats(30),
          getAllPOIs(),
          getTopPOIs(20),
        ])
        setHeatmapData(heat || [])
        setStatsData(stats)
        setPoisData(pois || [])
        setTopPoisData(Array.isArray(topPois) ? topPois : [])
      } catch (error) {
        console.error("Lỗi tải dữ liệu Analytics", error)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (viewMode === 'by-time') loadHeatmapByTime()
  }, [selectedDate, selectedHour, viewMode])

  const loadHeatmapByTime = async () => {
    try {
      setLoadingByTime(true)
      const data = await getHeatmapByTime(selectedDate, selectedHour)
      setHeatmapByTimeData(data || [])
    } catch (error) {
      console.error("Lỗi tải heatmap theo thời gian", error)
      setHeatmapByTimeData([])
    } finally {
      setLoadingByTime(false)
    }
  }

  // Chuẩn bị data chart theo ngày
  const chartData = statsData?.dailyListens?.map(d => ({
    date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    totalSeconds: d.totalDuration || 0,
    durationMinutes: parseFloat(((d.totalDuration || 0) / 60).toFixed(1)),
  })) || []

  // Chuẩn bị data pie chart — nhóm top POIs theo category
  const categoryData = (() => {
    const map = {}
    topPoisData.forEach(poi => {
      const cat = poi.category || 'Khác'
      map[cat] = (map[cat] || 0) + (poi.listenCount || 0)
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))
  })()

  const totalListens = statsData?.totalListens || 0
  const activePois = poisData.filter(p => p.isActive !== false).length
  const currentHeatmapCount = viewMode === 'overview' ? heatmapData.length : heatmapByTimeData.length

  if (loading) {
    return <PageLoader text="Đang tải dữ liệu phân tích..." />
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="ANALYTICS & HEATMAP"
        description="Phân tích xu hướng người dùng và mật độ di chuyển trên bản đồ."
        icon={<BarChart3 size={24} />}
        actions={
          <button
            onClick={exportCSV}
            disabled={topPoisData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl text-xs font-bold transition-all border border-pink-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            Xuất CSV
          </button>
        }
      />

      {/* STATS — 3 cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatsCard
          title="TỔNG LƯỢT NGHE"
          value={totalListens.toLocaleString()}
          sub="Toàn hệ thống 🟢"
          icon={<Headphones size={20} />}
        />
        <StatsCard
          title="POI ĐANG HOẠT ĐỘNG"
          value={activePois}
          sub="Trong tổng số POIs"
          color="text-emerald-600"
          icon={<MapPin size={20} />}
        />
        <StatsCard
          title="ĐIỂM HEATMAP"
          value={currentHeatmapCount.toLocaleString()}
          sub={viewMode === 'overview' ? 'Tổng quan toàn bộ' : `Ngày ${selectedDate}`}
          color="text-red-600"
          icon={<Activity size={20} />}
        />
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* BAR CHART — 30 ngày */}
        <div className="bg-white p-6 rounded-2xl border border-pink-100/30 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-6 text-gray-700 font-bold text-xs uppercase tracking-wider">
            <BarChart3 size={18} className="text-pink-500" />
            Biểu Đồ Tổng Thời Gian Nghe (Phút) — 30 Ngày Qua
          </div>
          <div className="h-[260px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#fff5f7' }} />
                  <Bar dataKey="durationMinutes" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-400 text-sm">
                Chưa có dữ liệu lượt nghe
              </div>
            )}
          </div>
        </div>

        {/* PIE CHART — Top POI theo danh mục */}
        <div className="bg-white p-6 rounded-2xl border border-pink-100/30 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-gray-700 font-bold text-xs uppercase tracking-wider">
            <BarChart3 size={18} className="text-pink-500" />
            Phân Bổ Theo Danh Mục
          </div>
          {categoryData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    dataKey="value"
                    label={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-[10px] font-medium text-gray-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex justify-center items-center h-[260px] text-gray-400 text-sm">
              Chưa có dữ liệu danh mục
            </div>
          )}
        </div>

      </div>

      {/* HEATMAP SECTION */}
      <div className="bg-white rounded-2xl border border-pink-100/30 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-pink-50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 text-gray-700 font-bold text-xs uppercase tracking-wider">
              <MapIcon size={18} className="text-pink-500" />
              Bản Đồ Nhiệt Mật Độ Di Chuyển (Heatmap)
            </div>
          </div>

          {/* PILL TABS — Style giống ArticlesPage */}
          <div className="flex bg-[#FFF0F5] p-1 rounded-2xl gap-1 self-start mb-4 w-fit">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'overview'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-[#8E707E] hover:text-pink-600'
              }`}
            >
              📊 Tổng Quan ({heatmapData.length} điểm)
            </button>
            <button
              onClick={() => setViewMode('by-time')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'by-time'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-[#8E707E] hover:text-pink-600'
              }`}
            >
              ⏰ Theo Thời Gian ({heatmapByTimeData.length} điểm)
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
                      {i.toString().padStart(2, '0')}:00 — {(i + 1).toString().padStart(2, '0')}:00
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
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {viewMode === 'overview' && heatmapData.length > 0 && <HeatmapLayer points={heatmapData} />}
            {viewMode === 'by-time' && heatmapByTimeData.length > 0 && <HeatmapLayer points={heatmapByTimeData} />}

            {poisData.map(poi => (
              <Marker key={poi.poiId} position={[poi.latitude, poi.longitude]}>
                <Popup>
                  <div className="font-semibold text-gray-800 text-xs">{poi.title}</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {poi.latitude?.toFixed(5)}, {poi.longitude?.toFixed(5)}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {viewMode === 'by-time' && loadingByTime && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-[1000] rounded-xl">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-gray-100 border-t-pink-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">Đang tải dữ liệu...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
