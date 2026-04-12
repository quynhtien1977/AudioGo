import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

// 🔥 COMPONENT ĐIỀU KHIỂN MAP
function MapController({ pois }) {
  const map = useMap();

  useEffect(() => {
    if (!pois || pois.length === 0) return;

    const validPois = pois.filter(p => p.lat && p.lng);

    if (!validPois.length) return;

    const bounds = validPois.map(p => [
      parseFloat(p.lat),
      parseFloat(p.lng)
    ]);

    // 🔥 FIX CHÍNH: update lại map khi pois thay đổi
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 17
    });

  }, [pois, map]);

  return null;
}

export default function POIMap({ pois = [] }) {

  return (
    <MapContainer 
      center={[10.762622, 106.660172]} // fallback thôi
      zoom={15} 
      style={containerStyle}
    >
      
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {/* 🔥 QUAN TRỌNG: thêm dòng này */}
      <MapController pois={pois} />

      {pois.map((poi) => (
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