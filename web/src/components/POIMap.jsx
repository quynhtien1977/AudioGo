import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // QUAN TRỌNG: Phải import CSS để bản đồ hiện đúng
import L from 'leaflet';

// Sửa lỗi Marker không hiện icon (lỗi phổ biến của Leaflet trong React)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const containerStyle = {
  width: "100%",
  height: "300px",
};

const center = [10.762622, 106.660172]; // Leaflet dùng mảng [lat, lng]

export default function POIMap({ pois }) {
  return (
    <MapContainer center={center} zoom={15} style={containerStyle}>
      {/* TileLayer là "da" của bản đồ, lấy từ OpenStreetMap */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {pois && pois.map((poi) => (
        <Marker 
          key={poi.rank || poi.id} 
          position={[parseFloat(poi.lat), parseFloat(poi.lng)]}
        >
          <Popup>
            <strong>{poi.name}</strong> <br />
            Bấm để nghe audio guide.
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}