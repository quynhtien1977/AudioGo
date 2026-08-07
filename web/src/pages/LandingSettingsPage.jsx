import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, ToggleLeft, ToggleRight, Globe, Eye } from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "@/hooks/useAuth";

import { getCmsSections, updateSection } from "@/api/cmsLandingApi";
import AppReleasesManager from "./landing/admin/AppReleasesManager";
import ConsultationsManager from "./landing/admin/ConsultationsManager";

// Editors
import HeroEditor from "./landing/admin/editors/HeroEditor";
import StatsBarEditor from "./landing/admin/editors/StatsBarEditor";
import FeaturesEditor from "./landing/admin/editors/FeaturesEditor";
import HowItWorksEditor from "./landing/admin/editors/HowItWorksEditor";
import ScreenshotsEditor from "./landing/admin/editors/ScreenshotsEditor";
import FooterEditor from "./landing/admin/editors/FooterEditor";
import SimpleEditor from "./landing/admin/editors/SimpleEditor";
import DownloadEditor from "./landing/admin/editors/DownloadEditor";
import ConsultEditor from "./landing/admin/editors/ConsultEditor";

const SECTIONS = [
  { key: "hero",         label: "Hero Banner",     editor: "hero" },
  { key: "stats_bar",    label: "Stats Bar",        editor: "stats_bar" },
  { key: "features",     label: "Tính năng",        editor: "features" },
  { key: "how_it_works", label: "Cách hoạt động",  editor: "how_it_works" },
  { key: "screenshots",  label: "Ảnh màn hình",    editor: "screenshots" },
  { key: "consult_cta",  label: "Form tư vấn",     editor: "simple" },
  { key: "download_cta", label: "Tải App",         editor: "simple" },
  { key: "footer",       label: "Footer",           editor: "footer" },
];

function renderEditor(sectionKey, data, onChange) {
  switch (sectionKey) {
    case "hero":         return <HeroEditor data={data} onChange={onChange} />;
    case "stats_bar":    return <StatsBarEditor data={data} onChange={onChange} />;
    case "features":     return <FeaturesEditor data={data} onChange={onChange} />;
    case "how_it_works": return <HowItWorksEditor data={data} onChange={onChange} />;
    case "screenshots":  return <ScreenshotsEditor data={data} onChange={onChange} />;
    case "footer":       return <FooterEditor data={data} onChange={onChange} />;
    case "consult_cta":    return <ConsultEditor data={data} onChange={onChange} />;
    case "download_cta":   return <DownloadEditor data={data} onChange={onChange} />;
    default:             return <SimpleEditor sectionKey={sectionKey} data={data} onChange={onChange} />;
  }
}

const TABS = [
  { id: "content",       label: "Nội dung Landing" },
  { id: "releases",      label: "Phiên bản APK",    adminOnly: true },
  { id: "consultations", label: "Yêu cầu tư vấn" },
];

export default function LandingSettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [activeTab, setActiveTab]       = useState("content");
  const [sections, setSections]         = useState([]);   // [{sectionId, sectionKey, isActive, sortOrder, content}]
  const [contentMap, setContentMap]     = useState({});   // { sectionKey: {...data} }
  const [loading, setLoading]           = useState(true);
  const [activeSectionKey, setActiveSectionKey] = useState("hero");
  const [saving, setSaving]             = useState(false);
  const [dirty, setDirty]               = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getCmsSections()
      .then((data) => {
        setSections(data);
        const map = {};
        data.forEach((s) => { map[s.sectionKey] = s.content || {}; });
        setContentMap(map);
        setDirty(false);
      })
      .catch(() => toast.error("Không tải được dữ liệu."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (activeTab === "content") load(); }, [activeTab]);

  const currentSection = sections.find((s) => s.sectionKey === activeSectionKey);
  const currentData    = contentMap[activeSectionKey] || {};

  const handleChange = (newData) => {
    setContentMap((prev) => ({ ...prev, [activeSectionKey]: newData }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!currentSection) return;
    setSaving(true);
    try {
      await updateSection(currentSection.sectionId, {
        contentJson: JSON.stringify(contentMap[activeSectionKey] || {}),
        isActive: currentSection.isActive,
        sortOrder: currentSection.sortOrder,
      });
      toast.success("Đã lưu thành công!");
      setDirty(false);
    } catch {
      toast.error("Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (sec) => {
    try {
      await updateSection(sec.sectionId, {
        contentJson: JSON.stringify(contentMap[sec.sectionKey] || {}),
        isActive: !sec.isActive,
        sortOrder: sec.sortOrder,
      });
      setSections((prev) =>
        prev.map((s) => s.sectionId === sec.sectionId ? { ...s, isActive: !s.isActive } : s)
      );
      toast.success(sec.isActive ? "Đã ẩn section." : "Đã hiện section.");
    } catch {
      toast.error("Cập nhật thất bại.");
    }
  };

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={20} className="text-pink-500" />
          <h1 className="text-2xl font-bold text-gray-900">Landing Page</h1>
        </div>
        <p className="text-gray-500 text-sm">Chỉnh sửa nội dung công khai — thay đổi được lưu ngay, không cần deploy lại.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {visibleTabs.map((tab) => (
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
        <div className="flex gap-4 h-[calc(100vh-220px)]">
          {/* Sidebar sections */}
          <aside className="w-52 flex-shrink-0 bg-white rounded-2xl border border-gray-100 p-3 overflow-y-auto">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Sections</div>
            <nav className="space-y-1">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-9 rounded-xl bg-gray-100 animate-pulse" />
                  ))
                : SECTIONS.map((sec) => {
                    const dbSec = sections.find((s) => s.sectionKey === sec.key);
                    return (
                      <div
                        key={sec.key}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                          activeSectionKey === sec.key
                            ? "bg-pink-50 text-pink-600 border border-pink-200"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => { setActiveSectionKey(sec.key); setDirty(false); }}
                      >
                        <span className="text-sm font-medium">{sec.label}</span>
                        {dbSec && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleActive(dbSec); }}
                            className="flex-shrink-0 ml-1"
                            title={dbSec.isActive ? "Ẩn" : "Hiện"}
                          >
                            {dbSec.isActive
                              ? <ToggleRight size={18} className="text-pink-500" />
                              : <ToggleLeft  size={18} className="text-gray-300" />
                            }
                          </button>
                        )}
                      </div>
                    );
                  })
              }
            </nav>
          </aside>

          {/* Editor area */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {SECTIONS.find((s) => s.key === activeSectionKey)?.label}
                </h3>
                {dirty && (
                  <p className="text-xs text-orange-500 mt-0.5">● Có thay đổi chưa lưu</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition-colors"
                >
                  <Eye size={13} />
                  Xem trang
                </a>
                <button
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 disabled:opacity-40 transition-colors"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Lưu
                </button>
              </div>
            </div>

            {/* Editor body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                renderEditor(activeSectionKey, currentData, handleChange)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: APK (Admin only) */}
      {activeTab === "releases" && isAdmin && <AppReleasesManager />}

      {/* Tab: Tư vấn */}
      {activeTab === "consultations" && (
        <ConsultationsManager isAdmin={isAdmin} />
      )}
    </div>
  );
}
