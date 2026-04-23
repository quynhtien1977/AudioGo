import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapPin, Headphones, Clock, ArrowLeft, AlertCircle, Activity, Navigation } from 'lucide-react'
import { getDeviceActivity } from '@/api/analyticsApi'
import { getAllPOIs } from '@/api/poiApi'

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

const formatTime = (ts) => {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto', padding: '2rem 0', width: '100%' }}>

      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Navigation size={30} className="text-pink-500" />
          Timeline Hoạt Động Thiết Bị
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Xem lịch sử di chuyển GPS và lịch sử nghe POI của từng thiết bị theo dòng thời gian.
        </p>
      </div>

      {/* SEARCH CONTROLS */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
            Device ID
          </label>
          <input
            value={deviceIdInput}
            onChange={e => setDeviceIdInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Nhập Device ID..."
            style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
            Khoảng thời gian
          </label>
          <select
            value={days}
            onChange={e => setDays(parseInt(e.target.value))}
            style={{ padding: '0.65rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '1rem', backgroundColor: 'white' }}
          >
            {DAYS_OPTIONS.map(d => (
              <option key={d} value={d}>{d} ngày gần nhất</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{ padding: '0.65rem 2rem', backgroundColor: loading ? '#9ca3af' : '#ec4899', color: 'white', fontWeight: '600', fontSize: '1rem', borderRadius: '0.5rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {loading ? <><Activity size={18} className="animate-spin" /> Đang tải...</> : 'Xem hoạt động'}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '1rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* RESULT */}
      {activity && (
        <>
          {/* SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <StatCard label="Thiết bị" value={activity.deviceId} small />
            <StatCard label="Tổng lượt nghe POI" value={activity.totalListens} color="#7c3aed" />
            <StatCard label="Số POI đã ghé" value={uniquePoisCount} color="#2563eb" />
            <StatCard label="Hoạt động trong" value={`${days} ngày`} color="#059669" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', color: '#6b7280' }}>
            <span>🕐 Lần đầu thấy: <strong>{formatTime(activity.firstSeen)}</strong></span>
            <span>🕐 Lần cuối thấy: <strong>{formatTime(activity.lastSeen)}</strong></span>
          </div>

          {/* MAP + TIMELINE side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: gpsPoints.length > 0 ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>

            {/* BẢN ĐỒ ROUTE */}
            {gpsPoints.length > 0 && (
              <div style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e5e7eb', height: '450px' }}>
                <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                        <div style={{ fontWeight: '600' }}>{poi.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            {/* TIMELINE */}
            <div style={{ backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} /> Timeline ({activity.timeline?.length || 0} sự kiện)
              </div>
              <div style={{ maxHeight: '408px', overflowY: 'auto', padding: '1rem' }}>
                {(!activity.timeline || activity.timeline.length === 0) && (
                  <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>Không có sự kiện nào trong khoảng thời gian này.</p>
                )}
                {activity.timeline?.map((event, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                    {/* Icon */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: event.eventType === 'location' ? '#dbeafe' : '#ede9fe',
                      color: event.eventType === 'location' ? '#2563eb' : '#7c3aed'
                    }}>
                      {event.eventType === 'location' ? <MapPin size={16} /> : <Headphones size={16} />}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{formatTime(event.timestamp)}</div>
                      {event.eventType === 'location' ? (
                        <div style={{ fontSize: '0.9rem', color: '#374151', fontWeight: '500' }}>
                          📍 {event.latitude?.toFixed(5)}, {event.longitude?.toFixed(5)}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.9rem', color: '#374151', fontWeight: '500' }}>
                          🎧 {event.poiTitle || event.poiId}
                          {event.listenDuration && (
                            <span style={{ color: '#7c3aed', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                              ({formatDuration(event.listenDuration)})
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

// ───────────────────────────── STAT CARD ───────────────────────────────────
function StatCard({ label, value, color = '#1f2937', small = false }) {
  return (
    <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: small ? '0.9rem' : '1.5rem', fontWeight: '700', color, wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
}
