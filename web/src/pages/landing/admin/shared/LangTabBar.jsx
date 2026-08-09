/**
 * LangTabBar — tab chọn ngôn ngữ cho CMS editor.
 * Hiển thị indicator trạng thái: xanh nếu đã dịch, xám nếu null.
 */

import { LANG_META } from "@/api/landingApi";

/**
 * @param {string}   activeLang       - code đang chọn
 * @param {object}   translations     - { vi: {...}|null, en: null, ... }
 * @param {function} onLangChange     - (langCode) => void
 */
export default function LangTabBar({ activeLang, translations = {}, onLangChange }) {
  const translatedCount = LANG_META.filter(
    (l) => translations[l.code] != null
  ).length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Badge đếm số ngôn ngữ */}
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">
        {translatedCount}/{LANG_META.length} ngôn ngữ
      </span>

      {LANG_META.map((lang) => {
        const isActive    = activeLang === lang.code;
        const hasContent  = translations[lang.code] != null;

        return (
          <button
            key={lang.code}
            onClick={() => onLangChange(lang.code)}
            title={lang.full}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive
                ? "bg-pink-500 text-white shadow-sm shadow-pink-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } ${lang.isMaster ? "ring-1 ring-offset-1 ring-pink-300" : ""}`}
          >
            <img src={lang.flagUrl} alt={lang.code} className="w-4 h-3 object-cover rounded-[2px] shadow-sm" />
            <span>{lang.label}</span>
            {/* Dot indicator */}
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                hasContent
                  ? isActive ? "bg-green-200" : "bg-green-400"
                  : isActive ? "bg-white/40" : "bg-gray-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

