import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapPin, Headphones, Clock, ArrowLeft, AlertCircle, Activity, Navigation, Loader2 } from 'lucide-react'
import { getDeviceActivity } from '@/api/analyticsApi'
import { getAllPOIs } from '@/api/poiApi'
import PageHeader from "@/components/PageHeader"
import StatsCard from "@/components/StatsCard"

// ───────────────────────────── LEAFLET IMPORT ─────────────────────────────
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

const DAYS_OPTIONS = [1, 3, 7, 14, 30]

import { formatDateVN } from '../utils/formatDate'

const formatTime = (ts) => {
  if (!ts) return '—'
  return formatDateVN(ts, true)
}

const formatDuration = (sec) => {
  if (!sec) return '—'
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${sec % 60}s`
}

// ───────────────────────────── MAIN PAGE ───────────────────────────────────
export default function DeviceActivityPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const deviceIdParam = searchParams.get('deviceId') || ''
  const daysParam = parseInt(searchParams.get('days') || '7')

  const [deviceIdInput, setDeviceIdInput] = useState(deviceIdParam)
  const [days, setDays] = useState(daysParam)
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pois, setPois] = useState([])

  // Load POIs once
  useEffect(() => {
    getAllPOIs().then(data => setPois(data || [])).catch(console.error)
  }, [])

  const fetchActivity = async (id, d) => {
    if (!id.trim()) return
    setLoading(true)
    setError(null)
    setActivity(null)
    const data = await getDeviceActivity(id.trim(), d)
    if (!data) setError('Không tìm thấy dữ liệu cho thiết bị này.')
    else setActivity(data)
    setLoading(false)
  }

  // Auto-fetch nếu có deviceId trên URL
  useEffect(() => {
    if (deviceIdParam) fetchActivity(deviceIdParam, daysParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => {
    setSearchParams({ deviceId: deviceIdInput.trim(), days })
    fetchActivity(deviceIdInput.trim(), days)
  }

  // Điểm GPS cho bản đồ
  const gpsPoints = activity?.timeline
    ?.filter(e => e.eventType === 'location' && e.latitude && e.longitude)
    ?.map(e => [e.latitude, e.longitude]) || []

  const center = gpsPoints.length > 0
    ? gpsPoints[Math.floor(gpsPoints.length / 2)]
    : [10.7769, 106.7009]

  // Tính toán số lượng POI unique
  const uniquePoisCount = new Set(
    activity?.timeline?.filter(e => e.eventType === 'listen' && e.poiId).map(e => e.poiId)
  ).size

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* HEADER */}
      <PageHeader
        title="TIMELINE HOẠT ĐỘNG THIẾT BỊ"
        description="Xem lịch sử di chuyển GPS và lịch sử nghe POI của từng thiết bị theo dòng thời gian."
        icon={<Navigation size={24} />}
      />

      {/* SEARCH CONTROLS */}
      <div className="bg-white p-6 rounded-2xl border border-pink-100/30 flex gap-4 flex-wrap items-end shadow-sm">
        <div className="flex-1 min-w-[200px] text-left">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Device ID
          </label>
          <input
            value={deviceIdInput}
            onChange={e => setDeviceIdInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Nhập Device ID..."
            className="w-full px-4 py-2.5 bg-pink-50/50 border border-pink-100/30 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 text-sm font-semibold"
          />
        </div>
        <div className="text-left">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Khoảng thời gian
          </label>
          <select
            value={days}
            onChange={e => setDays(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-pink-200"
          >
            {DAYS_OPTIONS.map(d => (
              <option key={d} value={d}>{d} ngày gần nhất</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all transform active:scale-95 flex items-center gap-2 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-md shadow-pink-100"
          }`}
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Đang tải...</> : 'Xem hoạt động'}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200 flex items-center gap-2 text-sm font-semibold animate-fadeIn">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* RESULT */}
      {activity && (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard title="Thiết bị" value={activity.deviceId} sub="Đang theo dõi" />
            <StatsCard title="Tổng lượt nghe POI" value={activity.totalListens} color="text-purple-600" />
            <StatsCard title="Số POI đã ghé" value={uniquePoisCount} color="text-blue-600" />
            <StatsCard title="Hoạt động trong" value={`${days} ngày`} color="text-emerald-600" />
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-gray-500 font-medium">
            <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-gray-400 shrink-0" /> Lần đầu thấy: <strong className="text-gray-700">{formatTime(activity.firstSeen)}</strong></span>
            <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-gray-400 shrink-0" /> Lần cuối thấy: <strong className="text-gray-700">{formatTime(activity.lastSeen)}</strong></span>
          </div>

          {/* MAP + TIMELINE side by side */}
          <div className={`grid gap-6 ${gpsPoints.length > 0 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>

            {/* BẢN ĐỒ ROUTE */}
            {gpsPoints.length > 0 && (
              <div className="bg-white rounded-2xl border border-pink-100/30 overflow-hidden shadow-sm h-[450px]">
                <div className="bg-pink-50/20 px-4 py-3 border-b border-pink-100/20 font-bold text-xs text-pink-500 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={16} /> Bản đồ lộ trình
                </div>
                <MapContainer center={center} zoom={15} style={{ height: 'calc(100% - 40px)', width: '100%' }} scrollWheelZoom={true}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {/* Đường đi */}
                  <Polyline positions={gpsPoints} color="#ec4899" weight={3} opacity={0.8} />
                  {/* Điểm đầu */}
                  <CircleMarker center={gpsPoints[0]} radius={8} color="#16a34a" fillColor="#16a34a" fillOpacity={1}>
                    <Popup>Điểm bắt đầu</Popup>
                  </CircleMarker>
                  {/* Điểm cuối */}
                  <CircleMarker center={gpsPoints[gpsPoints.length - 1]} radius={8} color="#dc2626" fillColor="#dc2626" fillOpacity={1}>
                    <Popup>Điểm kết thúc</Popup>
                  </CircleMarker>
                  
                  {/* POI Markers */}
                  {pois.map(poi => (
                    <Marker 
                      key={poi.poiId} 
                      position={[poi.latitude, poi.longitude]} 
                    >
                      <Popup>
                        <div className="font-semibold">{poi.title}</div>
                        <div className="text-xs text-gray-500">
                          {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            {/* TIMELINE */}
            <div className="bg-white rounded-2xl border border-pink-100/30 overflow-hidden shadow-sm flex flex-col">
              <div className="bg-pink-50/20 px-4 py-3 border-b border-pink-100/20 font-bold text-xs text-pink-500 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} /> Timeline ({activity.timeline?.length || 0} sự kiện)
              </div>
              <div className="max-h-[408px] overflow-y-auto p-4 space-y-4">
                {(!activity.timeline || activity.timeline.length === 0) && (
                  <p className="text-gray-400 text-center py-8">Không có sự kiện nào trong khoảng thời gian này.</p>
                )}
                {activity.timeline?.map((event, i) => (
                  <div key={i} className="flex gap-4">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      event.eventType === 'location' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                    }`}>
                      {event.eventType === 'location' ? <MapPin size={16} /> : <Headphones size={16} />}
                    </div>
                    {/* Content */}
                    <div className="flex-1 border-b border-pink-50/50 pb-3">
                      <div className="text-xs text-gray-400">{formatTime(event.timestamp)}</div>
                      {event.eventType === 'location' ? (
                        <div className="text-sm text-gray-700 font-medium mt-1 flex items-center gap-1">
                          <MapPin size={13} className="text-pink-500 shrink-0" />
                          <span>{event.latitude?.toFixed(5)}, {event.longitude?.toFixed(5)}</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700 font-medium mt-1 flex items-center flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1">
                            <Headphones size={13} className="text-purple-500 shrink-0" />
                            <span>{event.poiTitle || event.poiId}</span>
                          </span>
                          {event.listenDuration && (
                            <span className="text-purple-500 text-xs bg-purple-50 px-2 py-0.5 rounded-md font-mono">
                              {formatDuration(event.listenDuration)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
