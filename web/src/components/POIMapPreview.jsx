import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix lỗi icon marker
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Tọa độ Vĩnh Khánh, Quận 4, TP.HCM làm trung tâm mặc định
const VINH_KHANH_CENTER = [10.7574, 106.7020];

// Component hỗ trợ điều khiển bản đồ
function MapController({ lat, lng, isEditing }) {

  const parsedLat = parseFloat(lat)
  const parsedLng = parseFloat(lng)
  const map = useMap();

  useEffect(() => {
    if (parsedLat && parsedLng) {
      // Khi tọa độ thay đổi (do click), bản đồ sẽ trượt nhẹ tới điểm đó
      map.flyTo([parsedLat, parsedLng], map.getZoom(), { animate: true });
    }
  }, [parsedLat, parsedLng, map]);

  return null;
}

// Component xử lý sự kiện click
function MapClickHandler({ isEditing, onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      if (isEditing) {
        const { lat, lng } = e.latlng;
        // Trả về 6 chữ số thập phân cho chính xác
        // onLocationSelect(lat.toFixed(6), lng.toFixed(6));
        onLocationSelect(
          Number(lat.toFixed(6)),
          Number(lng.toFixed(6))
        )
      }
    },
  });
  return null;
}

export default function POIMap({ lat, lng, isEditing, onLocationSelect }) {
  // Ưu tiên tọa độ của POI, nếu không có thì lấy Vĩnh Khánh Q4
  const initialCenter = lat && lng ? [parseFloat(lat), parseFloat(lng)] : VINH_KHANH_CENTER;

  return (
    <div className="rounded-2xl overflow-hidden border border-pink-100 shadow-sm">
      <MapContainer
        center={initialCenter}
        zoom={16} // Zoom đủ sâu để thấy rõ các quán ăn ở Vĩnh Khánh
        style={{ width: "100%", height: "300px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Điều khiển hiệu ứng trượt bản đồ */}
        <MapController lat={lat} lng={lng} />

        {/* Click để chọn vị trí khi sửa */}
        <MapClickHandler isEditing={isEditing} onLocationSelect={onLocationSelect} />

        {/* Marker hiển thị vị trí */}
        {lat && lng && (
          <Marker position={[parseFloat(lat), parseFloat(lng)]} />
        )}
      </MapContainer>
      
      {isEditing && (
        <div className="bg-pink-50 p-2 text-center">
          <p className="text-[10px] font-bold text-pink-500 uppercase tracking-tight">
            📍 Nhấp vào bản đồ để thay đổi vị trí quán
          </p>
        </div>
      )}
    </div>
  );
}