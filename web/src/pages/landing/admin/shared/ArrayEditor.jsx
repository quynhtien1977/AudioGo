import { ChevronDown, ChevronUp, Trash2, Plus, GripVertical } from "lucide-react";
import { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ id, idx, item, isOpen, toggle, onRemove, hideControls, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 rounded-xl overflow-hidden mb-2 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-2 flex-1">
          {!hideControls && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:text-pink-500 text-gray-400 p-1 -ml-2 rounded">
              <GripVertical size={16} />
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 cursor-pointer flex-1 select-none" onClick={() => toggle(idx)}>
            #{idx + 1} {item?.title || item?.label || item?.text || item?.alt || ""}
          </span>
        </div>
        
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
          <button onClick={() => toggle(idx)} className="p-1">
            {isOpen ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
          </button>
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
}

export default function ArrayEditor({ label, items = [], onAdd, onRemove, onReorder, onMove, onAddGlobal, onRemoveGlobal, addLabel = "Thêm mới", hideControls = false, children }) {
  const [openItems, setOpenItems] = useState(new Set());
  const idsRef = useRef([]);

  // Giữ danh sách ID ổn định tuyệt đối theo index, không đổi UUID khi user gõ phím vào input
  while (idsRef.current.length < items.length) {
    idsRef.current.push(`item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  }
  if (idsRef.current.length > items.length) {
    idsRef.current = idsRef.current.slice(0, items.length);
  }

  const toggle = (idx) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleAdd = () => {
    idsRef.current.push(`item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
    if (onAddGlobal) onAddGlobal();
    else onAdd();
    setOpenItems((prev) => new Set([...prev, items.length]));
  };
  
  const handleRemove = (idx) => {
    idsRef.current.splice(idx, 1);
    if (onRemoveGlobal) onRemoveGlobal(idx);
    else onRemove(idx);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = idsRef.current.indexOf(active.id);
      const newIndex = idsRef.current.indexOf(over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        idsRef.current = arrayMove(idsRef.current, oldIndex, newIndex);
        if (onMove) {
          onMove(oldIndex, newIndex);
        } else if (onReorder) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          onReorder(newItems);
        }
      }
      
      setOpenItems(new Set()); 
    }
  };

  const itemIds = idsRef.current;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-xs text-gray-400">{items.length} mục</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={itemIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0">
            {items.map((item, idx) => {
              const id = itemIds[idx];
              const isOpen = openItems.has(idx);
              return (
                <SortableItem
                  key={id}
                  id={id}
                  idx={idx}
                  item={item}
                  isOpen={isOpen}
                  toggle={toggle}
                  onRemove={handleRemove}
                  hideControls={hideControls}
                  children={children}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

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
