import { FieldInput } from "../shared/Fields";
import ArrayEditor from "../shared/ArrayEditor";
import { IconPickerField } from "../shared/IconPickerField";

const ITEM_TEMPLATE = { icon: "Utensils", text: "100+ địa điểm" };

export default function StatsBarEditor({ data, onChange }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  const updItem = (idx, key, val) => {
    const items = [...(data.items || [])];
    items[idx] = { ...items[idx], [key]: val };
    upd("items", items);
  };

  return (
    <div>
      <ArrayEditor
        label="Mục thống kê trong thanh"
        items={data.items || []}
        addLabel="Thêm mục"
        onAdd={() => upd("items", [...(data.items || []), { ...ITEM_TEMPLATE }])}
        onRemove={(idx) => upd("items", (data.items || []).filter((_, i) => i !== idx))}
      >
        {(item, idx) => (
          <div className="grid grid-cols-2 gap-3">
            <IconPickerField
              label="Icon"
              value={item.icon}
              onChange={(v) => updItem(idx, "icon", v)}
            />
            <FieldInput
              label="Nội dung"
              value={item.text}
              onChange={(v) => updItem(idx, "text", v)}
              placeholder="100+ địa điểm"
            />
          </div>
        )}
      </ArrayEditor>
    </div>
  );
}
