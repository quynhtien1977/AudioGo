import { useState } from "react";
import { ImagePlus, X, Loader2, ExternalLink, Maximize2 } from "lucide-react";
import { uploadLandingImage } from "@/api/cmsLandingApi";

/**
 * ImageField — input URL ảnh kèm nút upload trực tiếp lên Azure Blob.
 * Props:
 *   label       — tiêu đề
 *   value       — URL hiện tại
 *   onChange    — (url: string) => void
 *   sectionKey  — "hero" | "features" | "screenshots" | ...
 *   hint        — mô tả phụ
 *   previewSize — "sm" (h-36, mặc định) | "lg" (h-56) | "xl" (h-72)
 */
export default function ImageField({
  label, value, onChange,
  sectionKey = "general", hint,
  previewSize = "sm",
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);
  const [lightbox, setLightbox]   = useState(false);

  const previewH = previewSize === "xl" ? "h-72" : previewSize === "lg" ? "h-56" : "h-36";

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadLandingImage(file, sectionKey);
      onChange(url);
    } catch (err) {
      setError(err?.response?.data?.message || "Upload thất bại.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>

      {/* Preview */}
      {value && (
        <div className={`relative mb-2 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 ${previewH}`}>
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={() => setLightbox(true)}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            {/* Phóng to */}
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="p-1.5 rounded-lg bg-white/90 backdrop-blur text-gray-600 hover:text-pink-500 shadow-sm"
              title="Phóng to"
            >
              <Maximize2 size={13} />
            </button>
            {/* Mở tab mới */}
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-white/90 backdrop-blur text-gray-600 hover:text-pink-500 shadow-sm"
              title="Mở ảnh gốc"
            >
              <ExternalLink size={13} />
            </a>
            {/* Xóa */}
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1.5 rounded-lg bg-white/90 backdrop-blur text-gray-600 hover:text-red-500 shadow-sm"
              title="Xóa ảnh"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && value && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={value}
              alt="preview full"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
            >
              <X size={18} />
            </button>
            <p className="text-center text-white/50 text-xs mt-2">
              Click bên ngoài để đóng
            </p>
          </div>
        </div>
      )}

      {/* URL input + Upload button */}
      <div className="flex gap-2">
        <input
          type="url"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... hoặc upload từ máy"
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
        />
        <label className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${
          uploading
            ? "border-gray-200 text-gray-400 bg-gray-50"
            : "border-pink-200 text-pink-600 bg-pink-50 hover:bg-pink-100"
        }`}>
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {uploading ? "Đang tải..." : "Upload"}
          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint  && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {value && (
        <p className="text-xs text-gray-400 mt-1 font-mono break-all">
          Blob: landing/{sectionKey.replace(/_/g, "-")}/…
        </p>
      )}
    </div>
  );
}
