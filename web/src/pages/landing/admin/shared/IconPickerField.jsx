import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import * as Icons from "lucide-react";

/** Bộ icon Lucide phổ biến dùng trong landing CMS */
const ICON_OPTIONS = [
  { name: "MapPin",        Icon: Icons.MapPin },
  { name: "Globe",         Icon: Icons.Globe },
  { name: "Heart",         Icon: Icons.Heart },
  { name: "Star",          Icon: Icons.Star },
  { name: "Users",         Icon: Icons.Users },
  { name: "Music",         Icon: Icons.Music },
  { name: "Headphones",    Icon: Icons.Headphones },
  { name: "Smartphone",    Icon: Icons.Smartphone },
  { name: "Mic",           Icon: Icons.Mic },
  { name: "Volume2",       Icon: Icons.Volume2 },
  { name: "PlayCircle",    Icon: Icons.PlayCircle },
  { name: "Utensils",      Icon: Icons.Utensils },
  { name: "Coffee",        Icon: Icons.Coffee },
  { name: "ChefHat",       Icon: Icons.ChefHat },
  { name: "Leaf",          Icon: Icons.Leaf },
  { name: "Flame",         Icon: Icons.Flame },
  { name: "Award",         Icon: Icons.Award },
  { name: "BadgeCheck",    Icon: Icons.BadgeCheck },
  { name: "ShieldCheck",   Icon: Icons.ShieldCheck },
  { name: "Zap",           Icon: Icons.Zap },
  { name: "Sparkles",      Icon: Icons.Sparkles },
  { name: "Layers",        Icon: Icons.Layers },
  { name: "Route",         Icon: Icons.Route },
  { name: "Navigation",    Icon: Icons.Navigation },
  { name: "Clock",         Icon: Icons.Clock },
  { name: "CheckCircle",   Icon: Icons.CheckCircle },
  { name: "ThumbsUp",      Icon: Icons.ThumbsUp },
  { name: "MessageCircle", Icon: Icons.MessageCircle },
  { name: "Download",      Icon: Icons.Download },
  { name: "QrCode",        Icon: Icons.QrCode },
];

/**
 * IconPickerField — dropdown dùng Portal để thoát khỏi overflow:hidden của parent.
 * value: tên icon (string), onChange: (name: string) => void
 */
export function IconPickerField({ label, value, onChange, hint }) {
  const [open, setOpen]   = useState(false);
  const [pos, setPos]     = useState({ top: 0, left: 0, width: 0 });
  const triggerRef        = useRef(null);

  const selected     = ICON_OPTIONS.find((o) => o.name === value);
  const SelectedIcon = selected?.Icon || Icons.Star;

  // Tính vị trí của dropdown so với viewport khi mở
  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropH = 260; // max-height ước tính

      setPos({
        top:   spaceBelow >= dropH ? rect.bottom + 4 : rect.top - dropH - 4,
        left:  rect.left,
        width: rect.width,
      });
    }
    setOpen((v) => !v);
  };

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label || "Icon"}
      </label>

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:border-pink-300 transition-colors w-full text-left"
      >
        <SelectedIcon size={16} className="text-pink-500 flex-shrink-0" />
        <span className="flex-1 truncate">{value || "Chọn icon..."}</span>
        <Icons.ChevronDown
          size={14}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown — rendered via Portal để thoát overflow:hidden */}
      {open && createPortal(
        <div
          style={{
            position: "fixed",
            top:      pos.top,
            left:     pos.left,
            width:    Math.max(pos.width, 280),
            zIndex:   9999,
          }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl p-3 animate-in fade-in slide-in-from-top-2 duration-150"
          onMouseDown={(e) => e.stopPropagation()} // prevent outside-click handler
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Chọn icon
          </p>
          <div className="grid grid-cols-6 gap-1.5 max-h-52 overflow-y-auto">
            {ICON_OPTIONS.map(({ name, Icon }) => (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => { onChange(name); setOpen(false); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  value === name
                    ? "bg-pink-50 border border-pink-300 text-pink-600"
                    : "hover:bg-gray-50 text-gray-600 border border-transparent"
                }`}
              >
                <Icon size={18} />
                <span className="text-[9px] leading-none text-center">{name.substring(0, 7)}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
