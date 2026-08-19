import { useState, useEffect } from "react";
import { Upload, Trash2, Loader2, CheckCircle2, Star, PackageOpen } from "lucide-react";
import toast from "react-hot-toast";
import { getAppReleases, uploadApk, deleteRelease } from "@/api/cmsLandingApi";

export default function AppReleasesManager() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    version: "",
    releaseNotes: "",
    minAndroidVersion: "8.0",
  });
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const refresh = () => {
    setLoading(true);
    getAppReleases()
      .then(setReleases)
      .catch(() => toast.error("Không tải được danh sách phiên bản."))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Chưa chọn file APK.");
    if (!form.version.trim()) return toast.error("Cần nhập phiên bản.");
    setUploading(true);
    try {
      await uploadApk({ file, ...form });
      toast.success("Upload APK thành công!");
      setFile(null);
      setForm({ version: "", releaseNotes: "", minAndroidVersion: "8.0" });
      refresh();
    } catch (err) {
      const msg = err?.response?.data?.message || "Upload thất bại.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (rel) => {
    if (!confirm(`Xóa phiên bản ${rel.version}?`)) return;
    try {
      await deleteRelease(rel.releaseId);
      toast.success("Đã xóa.");
      refresh();
    } catch (err) {
      const msg = err?.response?.data?.message || "Xóa thất bại.";
      toast.error(msg);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <Upload size={16} className="text-pink-500" />
          Tải lên phiên bản APK mới
        </h3>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              File APK *
            </label>
            <label className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-pink-300 cursor-pointer transition-colors">
              <PackageOpen size={20} className="text-gray-400" />
              <span className="text-sm text-gray-500">
                {file ? file.name : "Chọn file .apk"}
              </span>
              <input
                type="file"
                accept=".apk"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phiên bản *
              </label>
              <input
                type="text"
                placeholder="1.2.3"
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Android tối thiểu
              </label>
              <input
                type="text"
                placeholder="8.0"
                value={form.minAndroidVersion}
                onChange={(e) => setForm((f) => ({ ...f, minAndroidVersion: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ghi chú phiên bản
            </label>
            <textarea
              rows={3}
              placeholder="Sửa lỗi... / Thêm tính năng..."
              value={form.releaseNotes}
              onChange={(e) => setForm((f) => ({ ...f, releaseNotes: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-pink-600 hover:bg-pink-700 hover:shadow-md disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "Đang upload..." : "Upload APK"}
          </button>
        </form>
      </div>

      {/* Releases list */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-5">Lịch sử phiên bản</h3>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-pink-400" />
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Chưa có phiên bản APK nào.
          </div>
        ) : (
          <div className="space-y-3">
            {releases.map((rel) => (
              <div
                key={rel.releaseId}
                className={`flex items-start justify-between gap-3 p-4 rounded-xl border transition-colors ${
                  rel.isLatest
                    ? "border-pink-200 bg-pink-50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">
                      v{rel.version}
                    </span>
                    {rel.isLatest && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-600">
                        <Star size={9} />
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {rel.fileSizeMb} MB · Android {rel.minAndroidVersion}+ ·{" "}
                    {new Date(rel.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                  {rel.releaseNotes && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{rel.releaseNotes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={rel.apkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors"
                    title="Xem APK"
                  >
                    <CheckCircle2 size={16} />
                  </a>
                  {!rel.isLatest && (
                    <button
                      onClick={() => handleDelete(rel)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
