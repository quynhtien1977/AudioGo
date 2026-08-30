import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, ToggleLeft, ToggleRight, Globe, Eye, Settings2, Languages, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "@/hooks/useAuth";

import {
  getCmsSections,
  updateTranslation,
  updateShared,
  updateSectionMeta,
} from "@/api/cmsLandingApi";
import AppReleasesManager from "./landing/admin/AppReleasesManager";
import ConsultationsManager from "./landing/admin/ConsultationsManager";
import LangTabBar from "./landing/admin/shared/LangTabBar";
import { LANG_META } from "@/api/landingApi";

// Editors
import HeroEditor from "./landing/admin/editors/HeroEditor";
import StatsBarEditor from "./landing/admin/editors/StatsBarEditor";
import FeaturesEditor from "./landing/admin/editors/FeaturesEditor";
import HowItWorksEditor from "./landing/admin/editors/HowItWorksEditor";
import ScreenshotsEditor from "./landing/admin/editors/ScreenshotsEditor";
import FooterEditor from "./landing/admin/editors/FooterEditor";
import DownloadEditor from "./landing/admin/editors/DownloadEditor";
import ConsultEditor from "./landing/admin/editors/ConsultEditor";
import NavbarStaticEditor from "./landing/admin/editors/NavbarStaticEditor";
import SimpleEditor from "./landing/admin/editors/SimpleEditor";
import ConfirmModal from "@/components/ConfirmModal";

const SECTIONS = [
  { key: "hero",         label: "Hero Banner" },
  { key: "stats_bar",    label: "Stats Bar" },
  { key: "banner_strip", label: "Dải Banner Sự Kiện" },
  { key: "features",     label: "Tính năng" },
  { key: "how_it_works", label: "Cách hoạt động" },
  { key: "screenshots",  label: "Ảnh màn hình" },
  { key: "consult_cta",  label: "Form tư vấn" },
  { key: "download_cta", label: "Tải App" },
  { key: "footer",       label: "Footer" },
  { key: "navbar_static",label: "Giao diện tĩnh (Navbar...)" },
];

// ── Các field là "shared" (không dịch) theo từng section ──────────────────
// Dùng để tách state khi render editor
const SHARED_FIELD_HINTS = {
  hero:         { keys: ["backgroundImages", "stats", "cta1Link", "cta2Link", "backgroundImageUrl"], arrays: true },
  stats_bar:    { keys: ["items"], arrays: true },
  banner_strip: { keys: [], arrays: false },
  features:     { keys: ["items"], arrays: true },
  how_it_works: { keys: ["steps"], arrays: true },
  screenshots:  { keys: ["images"], arrays: true },
  consult_cta:  { keys: ["benefits"], arrays: true },
  download_cta: { keys: ["appLogoUrl"], arrays: false },
  footer:       { keys: ["email", "phone", "zaloLink", "facebookLink", "logoUrl", "address", "socialLinks"], arrays: false },
  navbar_static:{ keys: [], arrays: false },
};

function renderSharedEditor(sectionKey, shared, onSharedChange, arrayActions) {
  switch (sectionKey) {
    case "hero":
      return <HeroEditor data={shared} onChange={onSharedChange} arrayActions={arrayActions} sharedOnly />;
    case "stats_bar":
      return <StatsBarEditor data={shared} onChange={onSharedChange} arrayActions={arrayActions} sharedOnly />;
    case "features":
      return <FeaturesEditor data={shared} onChange={onSharedChange} arrayActions={arrayActions} sharedOnly />;
    case "how_it_works":
      return <HowItWorksEditor data={shared} onChange={onSharedChange} arrayActions={arrayActions} sharedOnly />;
    case "screenshots":
      return <ScreenshotsEditor data={shared} onChange={onSharedChange} arrayActions={arrayActions} sharedOnly />;
    case "footer":
      return <FooterEditor data={shared} onChange={onSharedChange} arrayActions={arrayActions} sharedOnly />;
    case "download_cta":
      return <DownloadEditor data={shared} onChange={onSharedChange} arrayActions={arrayActions} sharedOnly />;
    case "consult_cta":
      return <ConsultEditor data={shared} onChange={onSharedChange} arrayActions={arrayActions} sharedOnly />;
    case "navbar_static":
      return <NavbarStaticEditor data={shared} onChange={onSharedChange} arrayActions={arrayActions} sharedOnly />;
    default:
      return null;
  }
}

function renderTranslationEditor(sectionKey, trans, viTrans, onTransChange, arrayActions) {
  // Merge vi vào trans để có placeholder từ bản gốc
  const dataWithPlaceholder = trans ?? {};
  switch (sectionKey) {
    case "hero":
      return <HeroEditor data={dataWithPlaceholder} onChange={onTransChange} arrayActions={arrayActions} viPlaceholder={viTrans} translationOnly />;
    case "stats_bar":
      return <StatsBarEditor data={dataWithPlaceholder} onChange={onTransChange} arrayActions={arrayActions} viPlaceholder={viTrans} translationOnly />;
    case "features":
      return <FeaturesEditor data={dataWithPlaceholder} onChange={onTransChange} arrayActions={arrayActions} viPlaceholder={viTrans} translationOnly />;
    case "how_it_works":
      return <HowItWorksEditor data={dataWithPlaceholder} onChange={onTransChange} arrayActions={arrayActions} viPlaceholder={viTrans} translationOnly />;
    case "screenshots":
      return <ScreenshotsEditor data={dataWithPlaceholder} onChange={onTransChange} arrayActions={arrayActions} viPlaceholder={viTrans} translationOnly />;
    case "footer":
      return <FooterEditor data={dataWithPlaceholder} onChange={onTransChange} arrayActions={arrayActions} viPlaceholder={viTrans} translationOnly />;
    case "download_cta":
      return <DownloadEditor data={dataWithPlaceholder} onChange={onTransChange} arrayActions={arrayActions} viPlaceholder={viTrans} translationOnly />;
    case "consult_cta":
      return <ConsultEditor data={dataWithPlaceholder} onChange={onTransChange} arrayActions={arrayActions} viPlaceholder={viTrans} translationOnly />;
    case "navbar_static":
      return <NavbarStaticEditor data={dataWithPlaceholder} onChange={onTransChange} arrayActions={arrayActions} viPlaceholder={viTrans} translationOnly />;
    default:
      return <SimpleEditor sectionKey={sectionKey} data={dataWithPlaceholder} onChange={onTransChange} />;
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

  const [activeTab, setActiveTab]           = useState("content");
  const [sections, setSections]             = useState([]);
  // contentMap: { sectionKey: { shared: {...}, translations: { vi: {...}, en: null, ... } } }
  const [contentMap, setContentMap]         = useState({});
  const [loading, setLoading]               = useState(true);
  const [activeSectionKey, setActiveSectionKey] = useState("hero");
  const [activeLang, setActiveLang]         = useState("vi");
  const [editorMode, setEditorMode]         = useState("translations"); // "translations" | "shared"
  const [savingShared, setSavingShared]     = useState(false);
  const [savingTrans, setSavingTrans]       = useState(false);
  const [dirtyShared, setDirtyShared]       = useState(false);
  const [dirtyTrans, setDirtyTrans]         = useState(false);
  const [pendingAction, setPendingAction]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getCmsSections()
      .then((data) => {
        setSections(data);
        const map = {};
        data.forEach((s) => {
          const content = s.content || {};
          // Support cả format mới { shared, translations } và format cũ (fallback)
          if (content.translations) {
            map[s.sectionKey] = {
              shared:       content.shared || {},
              translations: content.translations || {},
            };
          } else {
            // Format cũ — wrap vào vi cho an toàn (migration chưa chạy)
            map[s.sectionKey] = {
              shared:       {},
              translations: { vi: content, en: null, es: null, fr: null, ko: null, ja: null },
            };
          }
        });
        setContentMap(map);
        setDirtyShared(false);
        setDirtyTrans(false);
      })
      .catch(() => toast.error("Không tải được dữ liệu."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (activeTab === "content") load(); }, [activeTab]);

  const currentSection = sections.find((s) => s.sectionKey === activeSectionKey);
  const currentContent = contentMap[activeSectionKey] || { shared: {}, translations: {} };
  const currentShared  = currentContent.shared || {};
  const currentTrans   = currentContent.translations || {};
  const currentLangData = currentTrans[activeLang] ?? null;
  const viData          = currentTrans["vi"] ?? {};

  const handleSharedChange = (newShared) => {
    setContentMap((prev) => ({
      ...prev,
      [activeSectionKey]: { ...prev[activeSectionKey], shared: newShared },
    }));
    setDirtyShared(true);
  };

  const handleTransChange = (newTrans) => {
    setContentMap((prev) => {
      const prevContent = prev[activeSectionKey] || { shared: {}, translations: {} };
      return {
        ...prev,
        [activeSectionKey]: {
          ...prevContent,
          translations: { ...prevContent.translations, [activeLang]: newTrans },
        },
      };
    });
    setDirtyTrans(true);
  };

  const arrayMoveHelper = (arr, oldIdx, newIdx) => {
    if (!arr) return [];
    const newArr = [...arr];
    const [movedItem] = newArr.splice(oldIdx, 1);
    newArr.splice(newIdx, 0, movedItem);
    return newArr;
  };

  const arrayActions = {
    onMove: (fieldKey, oldIndex, newIndex) => {
      setContentMap((prev) => {
        const prevContent = prev[activeSectionKey] || { shared: {}, translations: {} };
        const newShared = { ...prevContent.shared };
        if (newShared[fieldKey]) {
          newShared[fieldKey] = arrayMoveHelper(newShared[fieldKey], oldIndex, newIndex);
        }
        
        const newTrans = { ...prevContent.translations };
        for (const lang of Object.keys(newTrans)) {
          if (newTrans[lang] && newTrans[lang][fieldKey]) {
            newTrans[lang] = {
              ...newTrans[lang],
              [fieldKey]: arrayMoveHelper(newTrans[lang][fieldKey], oldIndex, newIndex)
            };
          }
        }
        
        return {
          ...prev,
          [activeSectionKey]: { ...prevContent, shared: newShared, translations: newTrans }
        };
      });
      setDirtyShared(true);
      setDirtyTrans(true);
    },
    
    onAdd: (fieldKey, newItemShared, newItemTransTemplate) => {
      setContentMap((prev) => {
        const prevContent = prev[activeSectionKey] || { shared: {}, translations: {} };
        const newShared = { ...prevContent.shared };
        newShared[fieldKey] = [...(newShared[fieldKey] || []), newItemShared];
        
        const newTrans = { ...prevContent.translations };
        for (const lang of Object.keys(newTrans)) {
          if (newTrans[lang]) {
            newTrans[lang] = {
              ...newTrans[lang],
              [fieldKey]: [...(newTrans[lang][fieldKey] || []), newItemTransTemplate]
            };
          }
        }
        
        return {
          ...prev,
          [activeSectionKey]: { ...prevContent, shared: newShared, translations: newTrans }
        };
      });
      setDirtyShared(true);
      setDirtyTrans(true);
    },

    onRemove: (fieldKey, index) => {
      setContentMap((prev) => {
        const prevContent = prev[activeSectionKey] || { shared: {}, translations: {} };
        const newShared = { ...prevContent.shared };
        if (newShared[fieldKey]) {
          newShared[fieldKey] = newShared[fieldKey].filter((_, i) => i !== index);
        }
        
        const newTrans = { ...prevContent.translations };
        for (const lang of Object.keys(newTrans)) {
          if (newTrans[lang] && newTrans[lang][fieldKey]) {
            newTrans[lang] = {
              ...newTrans[lang],
              [fieldKey]: newTrans[lang][fieldKey].filter((_, i) => i !== index)
            };
          }
        }
        
        return {
          ...prev,
          [activeSectionKey]: { ...prevContent, shared: newShared, translations: newTrans }
        };
      });
      setDirtyShared(true);
      setDirtyTrans(true);
    }
  };

  const handleSaveShared = async () => {
    if (!currentSection) return;
    setSavingShared(true);
    try {
      await updateShared(currentSection.sectionId, currentShared);
      
      if (dirtyTrans) {
        const promises = [];
        for (const lang of Object.keys(currentTrans)) {
          if (currentTrans[lang]) {
            promises.push(updateTranslation(currentSection.sectionId, lang, currentTrans[lang]));
          }
        }
        await Promise.all(promises);
        setDirtyTrans(false);
      }

      toast.success("Đã lưu Cấu hình & Đồng bộ!");
      setDirtyShared(false);
    } catch {
      toast.error("Lưu thất bại.");
    } finally {
      setSavingShared(false);
    }
  };

  const handleSaveTranslation = async () => {
    if (!currentSection) return;
    if (activeLang === "vi" && (!currentLangData || Object.keys(currentLangData).length === 0)) {
      toast.error("Bản dịch VI (master) không được để trống.");
      return;
    }
    setSavingTrans(true);
    try {
      await updateTranslation(currentSection.sectionId, activeLang, currentLangData || {});
      
      if (dirtyShared) {
        await updateShared(currentSection.sectionId, currentShared);
        const promises = [];
        for (const lang of Object.keys(currentTrans)) {
          if (lang !== activeLang && currentTrans[lang]) {
            promises.push(updateTranslation(currentSection.sectionId, lang, currentTrans[lang]));
          }
        }
        await Promise.all(promises);
        setDirtyShared(false);
      }
      
      toast.success(`Đã lưu bản dịch ${activeLang.toUpperCase()}!`);
      setDirtyTrans(false);
    } catch {
      toast.error("Lưu thất bại.");
    } finally {
      setSavingTrans(false);
    }
  };

  const toggleActive = async (sec) => {
    try {
      await updateSectionMeta(sec.sectionId, {
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

  const checkUnsavedAndExecute = (action) => {
    if (dirtyShared || dirtyTrans) {
      setPendingAction(() => action);
    } else {
      action();
    }
  };

  const handleSectionChange = (key) => {
    checkUnsavedAndExecute(() => {
      setActiveSectionKey(key);
      setDirtyShared(false);
      setDirtyTrans(false);
    });
  };

  const handleLangChange = (lang) => {
    checkUnsavedAndExecute(() => {
      setActiveLang(lang);
      setDirtyTrans(false);
    });
  };

  const handleEditorModeChange = (mode) => {
    setEditorMode(mode);
  };

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  // Số ngôn ngữ đã dịch cho section hiện tại
  const translatedCount = LANG_META.filter(
    (l) => currentContent.translations?.[l.code] != null
  ).length;

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
            onClick={() => checkUnsavedAndExecute(() => setActiveTab(tab.id))}
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
        <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100vh-220px)] lg:h-[calc(100vh-220px)]">
          {/* Sidebar sections */}
          <aside className="w-full lg:w-52 flex-shrink-0 bg-white rounded-2xl border border-gray-100 p-3 max-h-48 lg:max-h-full overflow-y-auto">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Sections</div>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-9 w-28 lg:w-full rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                  ))
                : SECTIONS.map((sec) => {
                    const dbSec = sections.find((s) => s.sectionKey === sec.key);
                    const secContent = contentMap[sec.key] || {};
                    const langCount = LANG_META.filter(
                      (l) => secContent.translations?.[l.code] != null
                    ).length;
                    return (
                      <div
                        key={sec.key}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors flex-shrink-0 lg:flex-shrink ${
                          activeSectionKey === sec.key
                            ? "bg-pink-50 text-pink-600 border border-pink-200"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => handleSectionChange(sec.key)}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-sm font-medium truncate">{sec.label}</span>
                          <span className="text-[10px] text-gray-400">{langCount}/6 lang</span>
                        </div>
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
            {/* Toolbar & Sub-tabs */}
            <div className="flex flex-col border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {SECTIONS.find((s) => s.key === activeSectionKey)?.label}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{translatedCount}/6 ngôn ngữ đã dịch</p>
                </div>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition-colors bg-white border border-gray-200"
                >
                  <Eye size={13} />
                  Xem trang
                </a>
              </div>
              <div className="flex px-4 sm:px-6 gap-4 sm:gap-6 mt-1 flex-wrap">
                <button
                  onClick={() => handleEditorModeChange("translations")}
                  className={`py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    editorMode === "translations"
                      ? "border-pink-500 text-pink-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Languages size={14} /> Dịch thuật & Nội dung
                </button>
                <button
                  onClick={() => handleEditorModeChange("shared")}
                  className={`py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    editorMode === "shared"
                      ? "border-pink-500 text-pink-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Settings2 size={14} /> Cấu hình chung
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col h-full">

                  {/* ── MODE: SHARED FIELDS ─────────────────────────────── */}
                  {editorMode === "shared" && (
                    <div className="flex-1 flex flex-col">
                      <div className="px-6 py-3 bg-white flex items-center justify-between border-b border-gray-100 shadow-sm sticky top-0 z-10">
                        <div className="text-[11px] text-gray-400 font-medium">
                          Các field này dùng chung cho tất cả ngôn ngữ (ví dụ: ảnh, icon, links). <br/>
                          <strong className="text-orange-500">Lưu ý: Để sửa nội dung chữ hoặc dịch thuật, hãy chuyển sang tab "Dịch thuật & Nội dung".</strong>
                        </div>
                        <button
                          onClick={handleSaveShared}
                          disabled={savingShared || !dirtyShared}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 text-white text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 transition-all shadow-sm"
                        >
                          {savingShared ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Lưu Cấu hình
                          {dirtyShared && <span className="w-2 h-2 rounded-full bg-orange-400 ml-1" />}
                        </button>
                      </div>
                      <div className="px-6 py-6">
                        {renderSharedEditor(activeSectionKey, currentShared, handleSharedChange, arrayActions)}
                      </div>
                    </div>
                  )}

                  {/* ── MODE: TRANSLATIONS ──────────────────────────────── */}
                  {editorMode === "translations" && (
                    <div className="flex-1 flex flex-col">
                      <div className="px-6 py-3 bg-white flex items-center justify-between border-b border-gray-100 shadow-sm sticky top-0 z-10 flex-wrap gap-3">
                        <LangTabBar
                          activeLang={activeLang}
                          translations={currentTrans}
                          onLangChange={handleLangChange}
                        />
                        <button
                          onClick={handleSaveTranslation}
                          disabled={savingTrans || !dirtyTrans}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-pink-600 text-white text-xs font-semibold hover:bg-pink-700 disabled:opacity-50 transition-all shadow-sm"
                        >
                          {savingTrans ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Lưu {activeLang.toUpperCase()}
                          {dirtyTrans && <span className="w-2 h-2 rounded-full bg-orange-300 ml-1" />}
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto px-6 py-6">
                        {activeLang !== "vi" && currentTrans[activeLang] == null && (
                          <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2 font-medium">
                            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                            <span>Ngôn ngữ này chưa có bản dịch. Hãy điền nội dung bên dưới (tham khảo từ bản VI).</span>
                          </div>
                        )}
                        {renderTranslationEditor(
                          activeSectionKey,
                          currentLangData,
                          viData,
                          handleTransChange,
                          arrayActions
                        )}
                      </div>
                    </div>
                  )}

                </div>
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

      <ConfirmModal
        open={!!pendingAction}
        title="Chưa lưu thay đổi"
        message="Bạn có thay đổi chưa lưu. Bạn có chắc muốn chuyển đi không? Các thay đổi sẽ bị mất."
        confirmText="Chuyển đi"
        cancelText="Hủy"
        onConfirm={() => {
          if (pendingAction) pendingAction();
          setPendingAction(null);
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
