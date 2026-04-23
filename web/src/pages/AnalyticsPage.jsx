import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import 'leaflet.heat'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Map as MapIcon, BarChart3, TrendingUp, Headphones } from 'lucide-react'
import { getHeatmap, getListenStats } from '@/api/analyticsApi'
import { getAllPOIs } from '@/api/poiApi'

// Component để inject heatmap layer vào leaflet map
function HeatmapLayer({ points }) {
  const map = useMap()
  
  useEffect(() => {
    if (!map || !points || points.length === 0) return
    
    const heatPoints = points.map(p => [p.latitude, p.longitude, p.count])
    const maxCount = Math.max(...points.map(p => p.count), 1)
    
    // Cấu hình Heatmap
    const heatLayer = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 16,
      max: maxCount,
      gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
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
  const [statsData, setStatsData] = useState(null)
  const [poisData, setPoisData] = useState([])
  const [loading, setLoading] = useState(true)

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

  // Chuẩn bị data cho biểu đồ cột
  const chartData = statsData?.dailyListens?.map(d => ({
    date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    count: d.count
  })) || []

  const totalListens = statsData?.totalListens || 0

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6b7280' }}>
        Đang tải dữ liệu phân tích...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto', padding: '2rem 0', width: '100%' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BarChart3 size={32} className="text-pink-500" />
          Analytics & Heatmap
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Phân tích xu hướng người dùng và mật độ di chuyển trên bản đồ.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* STATS OVERVIEW */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#4b5563', fontWeight: '600' }}>
            <Headphones size={20} className="text-purple-500" /> Tổng Lượt Nghe (Toàn Hệ Thống)
          </div>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: '#1f2937' }}>
            {totalListens.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
            <TrendingUp size={16} /> Tăng trưởng ổn định
          </div>
        </div>

        {/* CHART CONTAINER */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#4b5563', fontWeight: '600' }}>
            <BarChart3 size={20} className="text-blue-500" /> Biểu Đồ Lượt Nghe 30 Ngày Qua
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9ca3af' }}>
                Chưa có dữ liệu lượt nghe
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HEATMAP SECTION */}
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#4b5563', fontWeight: '600' }}>
            <MapIcon size={20} className="text-red-500" /> Bản Đồ Nhiệt Mật Độ Di Chuyển (Heatmap)
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
            {heatmapData.length} điểm tọa độ
          </div>
        </div>
        
        <div style={{ height: '600px', width: '100%', position: 'relative', zIndex: 0 }}>
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
            
            {/* Heatmap Layer */}
            {heatmapData.length > 0 && <HeatmapLayer points={heatmapData} />}

            {/* POI Markers */}
            {poisData.map(poi => (
              <CircleMarker 
                key={poi.poiId} 
                center={[poi.latitude, poi.longitude]} 
                radius={6} 
                color="#0ea5e9" 
                fillColor="#0ea5e9" 
                fillOpacity={0.8}
                weight={2}
              >
                <Popup>
                  <div style={{ fontWeight: '600' }}>{poi.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

    </div>
  )
}
