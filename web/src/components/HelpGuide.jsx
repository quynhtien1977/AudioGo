import React, { useState, useEffect } from "react";
import { HelpCircle, X, Lightbulb, CheckCircle2, Info } from "lucide-react";

/**
 * Reusable Help Guide Modal & Trigger Component
 *
 * @param {string} title - Title of the guide
 * @param {Array<string|{title: string, desc: string}>} steps - Step-by-step guidance list
 * @param {Array<string>} tips - Optional helpful tips/notes
 * @param {string} buttonText - Optional button text (if empty, only shows icon)
 * @param {string} className - Optional className for the trigger button
 */
export default function HelpGuide({
  title = "Hướng dẫn sử dụng",
  steps = [],
  tips = [],
  buttonText = "",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all cursor-pointer ${className}`}
        title={title}
      >
        <HelpCircle size={18} className="shrink-0" />
        {buttonText && <span className="text-xs font-bold">{buttonText}</span>}
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div
            className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden z-10 animate-scaleUp flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-pink-50/50 to-rose-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-100/80 text-pink-600 flex items-center justify-center shrink-0 shadow-sm border border-pink-200">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800 tracking-tight">
                    {title}
                  </h3>
                  <p className="text-[11px] font-medium text-gray-400">
                    Hướng dẫn & quy trình thao tác nhanh
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-white transition-all shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content List */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Step list */}
              {steps && steps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-pink-500">
                    Các bước thực hiện
                  </h4>
                  <div className="space-y-2.5">
                    {steps.map((item, index) => {
                      const isObject = typeof item === "object" && item !== null;
                      const stepTitle = isObject ? item.title : null;
                      const stepDesc = isObject ? item.desc : item;

                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-pink-200 hover:bg-pink-50/20 transition-all text-left"
                        >
                          <div className="w-6 h-6 rounded-full bg-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 text-xs text-gray-700 leading-relaxed font-medium">
                            {stepTitle && (
                              <strong className="block text-gray-800 font-bold mb-0.5">
                                {stepTitle}
                              </strong>
                            )}
                            <div dangerouslySetInnerHTML={{ __html: stepDesc }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tips & Note Section */}
              {tips && tips.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                    <Info size={15} className="text-amber-600 shrink-0" />
                    <span>Lưu ý & Mẹo hay</span>
                  </div>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-amber-900 leading-relaxed font-medium">
                    {tips.map((tip, idx) => (
                      <li key={idx} dangerouslySetInnerHTML={{ __html: tip }} />
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-100 hover:shadow-lg transition-all"
              >
                <CheckCircle2 size={15} />
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
