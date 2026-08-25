// AppTileLayer.jsx — Component TileLayer dùng chung, nguồn tile từ mapConfig
import { TileLayer } from "react-leaflet";
import { MAP_TILE_URL, MAP_ATTRIBUTION } from "@/config/mapConfig";

/**
 * Dùng thay thế cho <TileLayer url="..." attribution="..."> hardcode.
 * Props truyền vào sẽ override nếu cần (VD: className cho debug).
 */
export default function AppTileLayer(props) {
  return (
    <TileLayer
      url={MAP_TILE_URL}
      attribution={MAP_ATTRIBUTION}
      {...props}
    />
  );
}
