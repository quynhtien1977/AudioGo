import { FieldInput, FieldTextarea } from "../shared/Fields";
import ArrayEditor from "../shared/ArrayEditor";
import { IconPickerField } from "../shared/IconPickerField";

const ITEM_TEMPLATE = { icon: "Sparkles", title: "Tính năng", description: "Mô tả tính năng..." };

export default function FeaturesEditor({ data, onChange }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  const updItem = (idx, key, val) => {
    const items = [...(data.items || [])];
    items[idx] = { ...items[idx], [key]: val };
    upd("items", items);
  };

  return (
    <div>
      <FieldInput label="Tiêu đề section" value={data.title} onChange={(v) => upd("title", v)}
        placeholder="Vì sao chọn AudioGo?" />
      <FieldTextarea label="Phụ đề" value={data.subtitle} onChange={(v) => upd("subtitle", v)} rows={2} />

      <ArrayEditor
        label="Danh sách tính năng"
        items={data.items || []}
        addLabel="Thêm tính năng"
        onAdd={() => upd("items", [...(data.items || []), { ...ITEM_TEMPLATE }])}
        onRemove={(idx) => upd("items", (data.items || []).filter((_, i) => i !== idx))}
      >
        {(item, idx) => (
          <>
            <IconPickerField label="Icon" value={item.icon} onChange={(v) => updItem(idx, "icon", v)} />
            <FieldInput label="Tiêu đề" value={item.title} onChange={(v) => updItem(idx, "title", v)} />
            <FieldTextarea label="Mô tả" value={item.description} onChange={(v) => updItem(idx, "description", v)} rows={2} />
          </>
        )}
      </ArrayEditor>
    </div>
  );
}
