import React, { useState, useEffect } from "react";
import { MapContainer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AppTileLayer from "@/components/AppTileLayer";
import { getPoiDetail } from "@/api/poiApi";
import { Loader2, MapPin } from "lucide-react";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom numbered marker icon
const createNumberedIcon = (number) => {
  return L.divIcon({
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #D81B60 0%, #EC4899 100%);
        color: white;
        font-weight: bold;
        font-size: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(216, 27, 96, 0.3);
      ">
        ${number}
      </div>
    `,
    className: "numbered-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const TourRouteMap = ({ pois = [] }) => {
  const [enrichedPois, setEnrichedPois] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch POI details to get latitude/longitude
  useEffect(() => {
    const fetchPOIDetails = async () => {
      try {
        setIsLoading(true);
        const poiDetails = await Promise.all(
          pois.map(async (poi) => {
            try {
              const detail = await getPoiDetail(poi.poiId);
              return {
                ...poi,
                latitude: detail.latitude,
                longitude: detail.longitude,
                address: detail.contents?.[0]?.address || "N/A",
              };
            } catch (error) {
              console.error(`Failed to fetch POI ${poi.poiId}:`, error);
              return null;
            }
          })
        );
        
        // Filter out failed fetches and sort by stepOrder
        const validPois = poiDetails
          .filter(p => p && p.latitude && p.longitude)
          .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
        
        setEnrichedPois(validPois);
      } catch (error) {
        console.error("Error fetching POI details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (pois && pois.length > 0) {
      fetchPOIDetails();
    } else {
      setIsLoading(false);
    }
  }, [pois]);

  // Default center (Hanoi)
  const defaultCenter = [21.0285, 105.8542];
  
  // Get map center based on POIs
  const getMapCenter = () => {
    if (enrichedPois.length === 0) return defaultCenter;
    const avgLat =
      enrichedPois.reduce((sum, poi) => sum + poi.latitude, 0) / enrichedPois.length;
    const avgLng =
      enrichedPois.reduce((sum, poi) => sum + poi.longitude, 0) / enrichedPois.length;
    return [avgLat, avgLng];
  };

  // Create polyline coordinates for the tour route
  const routeCoordinates = enrichedPois.map((poi) => [
    poi.latitude,
    poi.longitude,
  ]);

  const mapCenter = getMapCenter();

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center" style={{ height: "400px" }}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-pink-500" size={32} />
          <p className="text-sm text-gray-500 font-medium">Đang tải bản đồ...</p>
        </div>
      </div>
    );
  }

  if (enrichedPois.length === 0) {
    return (
      <div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center" style={{ height: "400px" }}>
        <p className="text-sm text-gray-400 font-medium">Chưa có POI nào trong tour</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ width: "100%", height: "400px" }}
        className="rounded-2xl"
      >
        {/* Map Tiles */}
        <AppTileLayer />

        {/* Tour Route Line */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color="#D81B60"
            weight={3}
            opacity={0.8}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* POI Markers */}
        {enrichedPois.map((poi, index) => (
          <Marker
            key={poi.poiId}
            position={[poi.latitude, poi.longitude]}
            icon={createNumberedIcon(poi.stepOrder || index + 1)}
          >
            <Popup className="custom-popup">
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800">{poi.title}</h4>
                <p className="text-sm text-gray-600">{poi.address}</p>
                <div className="flex items-center gap-1.5 text-xs text-pink-600 font-bold">
                  <MapPin size={13} className="shrink-0" />
                  <span>Bước {poi.stepOrder || index + 1}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default TourRouteMap;
