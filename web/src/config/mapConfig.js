// mapConfig.js — Nguồn tile dùng chung cho toàn app
// Để đổi provider: chỉ cần sửa VITE_MAP_TILE_URL trong .env, không cần sửa code

export const MAP_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ||
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MAP_ATTRIBUTION =
  import.meta.env.VITE_MAP_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const DEFAULT_CENTER = [10.7574, 106.702]; // Q4, TP.HCM
export const DEFAULT_ZOOM   = 16;
