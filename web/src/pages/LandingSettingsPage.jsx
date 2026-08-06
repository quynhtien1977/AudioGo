import { useState, useEffect } from "react";
import { Save, Loader2, ToggleLeft, ToggleRight, ArrowUpDown } from "lucide-react";
import toast from "react-hot-toast";
import { getCmsSections, updateSection } from "@/api/cmsLandingApi";
import AppReleasesManager from "./landing/admin/AppReleasesManager";
import ConsultationsManager from "./landing/admin/ConsultationsManager";

const SECTION_LABELS = {
  hero: "🏠 Hero",
  stats_bar: "📊 Stats Bar",
  features: "✨ Tính năng",
  how_it_works: "📋 Cách hoạt động",
  screenshots: "📱 Ảnh chụp màn hình",
  consult_cta: "📝 Form tư vấn",
  download_cta: "⬇️ Tải App",
  footer: "🔗 Footer",
};

const TABS = [
  { id: "content", label: "Nội dung Landing" },
  { id: "releases", label: "Phiên bản APK" },
  { id: "consultations", label: "Yêu cầu tư vấn" },
];

export default function LandingSettingsPage() {
  const [activeTab, setActiveTab] = useState("content");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState(null);
  const [editJson, setEditJson] = useState("");
  const [jsonError, setJsonError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTab !== "content") return;
    setLoading(true);
    getCmsSections()
      .then((data) => {
        setSections(data);
        if (data.length > 0 && !selectedKey) {
          const first = data[0];
          setSelectedKey(first.sectionKey);
          setEditJson(JSON.stringify(first.content, null, 2));
        }
      })
      .catch(() => toast.error("Không tải được danh sách section."))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const selectedSection = sections.find((s) => s.sectionKey === selectedKey);

  const handleSelectSection = (sec) => {
    setSelectedKey(sec.sectionKey);
    setEditJson(JSON.stringify(sec.content, null, 2));
    setJsonError(null);
  };

  const handleJsonChange = (val) => {
    setEditJson(val);
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch (e) {
      setJsonError(e.message);
    }
  };

  const handleSave = async () => {
    if (!selectedSection || jsonError) return;
    setSaving(true);
    try {
      await updateSection(selectedSection.sectionId, {
        contentJson: editJson,
        isActive: selectedSection.isActive,
        sortOrder: selectedSection.sortOrder,
      });
      toast.success("Đã lưu thành công!");
      // Cập nhật local state
      setSections((prev) =>
        prev.map((s) =>
          s.sectionId === selectedSection.sectionId
            ? { ...s, content: JSON.parse(editJson) }
            : s
        )
      );
    } catch {
      toast.error("Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (sec) => {
    try {
      await updateSection(sec.sectionId, {
        contentJson: JSON.stringify(sec.content),
        isActive: !sec.isActive,
        sortOrder: sec.sortOrder,
      });
      setSections((prev) =>
        prev.map((s) =>
          s.sectionId === sec.sectionId ? { ...s, isActive: !s.isActive } : s
        )
      );
      toast.success(sec.isActive ? "Đã ẩn section." : "Đã hiện section.");
    } catch {
      toast.error("Cập nhật thất bại.");
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt Landing Page</h1>
        <p className="text-gray-500 text-sm mt-1">
          Chỉnh sửa nội dung, tải APK và quản lý yêu cầu tư vấn từ chủ quán.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-pink-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Nội dung */}
      {activeTab === "content" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Section list */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Danh sách section
            </h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-pink-400" />
              </div>
            ) : (
              <div className="space-y-1.5">
                {sections
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((sec) => (
                    <div
                      key={sec.sectionKey}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        selectedKey === sec.sectionKey
                          ? "bg-pink-50 border border-pink-200"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelectSection(sec)}
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {SECTION_LABELS[sec.sectionKey] || sec.sectionKey}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleActive(sec); }}
                        className="ml-2 flex-shrink-0"
                        title={sec.isActive ? "Ẩn section" : "Hiện section"}
                      >
                        {sec.isActive ? (
                          <ToggleRight size={20} className="text-pink-500" />
                        ) : (
                          <ToggleLeft size={20} className="text-gray-300" />
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* JSON editor */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            {selectedSection ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {SECTION_LABELS[selectedSection.sectionKey] || selectedSection.sectionKey}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Chỉnh sửa JSON nội dung bên dưới
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-gray-400 hover:text-pink-500 transition-colors px-2 py-1 rounded-lg hover:bg-pink-50"
                    >
                      Xem trước ↗
                    </a>
                    <button
                      onClick={handleSave}
                      disabled={saving || !!jsonError}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 disabled:opacity-50 transition-colors"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Lưu
                    </button>
                  </div>
                </div>

                {jsonError && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                    JSON không hợp lệ: {jsonError}
                  </div>
                )}

                <textarea
                  value={editJson}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className={`w-full h-[480px] rounded-xl p-4 font-mono text-xs border resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 ${
                    jsonError ? "border-red-300 bg-red-50/30" : "border-gray-200 bg-gray-50"
                  }`}
                  spellCheck={false}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-300 text-sm">
                Chọn một section để chỉnh sửa
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: APK */}
      {activeTab === "releases" && <AppReleasesManager />}

      {/* Tab: Tư vấn */}
      {activeTab === "consultations" && <ConsultationsManager />}
    </div>
  );
}
