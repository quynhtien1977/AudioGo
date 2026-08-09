import { ChevronDown, ChevronUp, Trash2, Plus } from "lucide-react";
import { useState } from "react";

/**
 * ArrayEditor — quản lý mảng item (slides, steps, features, screenshots...).
 * Props:
 *   label       — tiêu đề block
 *   items       — mảng hiện tại
 *   onAdd       — () => void  (thêm item mới với template mặc định)
 *   onRemove    — (idx) => void
 *   addLabel    — text nút thêm, mặc định "Thêm mới"
 *   hideControls— (boolean) ẩn nút Thêm/Xóa khi chỉ cho phép dịch
 *   children    — (item, idx) => JSX  (render form từng item)
 */
export default function ArrayEditor({ label, items = [], onAdd, onRemove, addLabel = "Thêm mới", hideControls = false, children }) {
  const [openItems, setOpenItems] = useState(new Set());

  const toggle = (idx) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleAdd = () => {
    onAdd();
    setOpenItems((prev) => new Set([...prev, items.length]));
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-xs text-gray-400">{items.length} mục</span>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => {
          const isOpen = openItems.has(idx);
          return (
            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center justify-between px-3.5 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggle(idx)}
              >
                <span className="text-sm font-medium text-gray-700">
                  #{idx + 1} {item?.title || item?.label || item?.text || item?.alt || ""}
                </span>
                <div className="flex items-center gap-2">
                  {!hideControls && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {isOpen
                    ? <ChevronUp size={15} className="text-gray-400" />
                    : <ChevronDown size={15} className="text-gray-400" />
                  }
                </div>
              </div>

              {/* Body */}
              {isOpen && (
                <div className="p-4 bg-white border-t border-gray-100">
                  {children(item, idx)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!hideControls && (
        <button
          type="button"
          onClick={handleAdd}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-pink-200 text-pink-500 text-sm font-medium hover:bg-pink-50 hover:border-pink-300 transition-colors"
        >
          <Plus size={15} />
          {addLabel}
        </button>
      )}
    </div>
  );
}
