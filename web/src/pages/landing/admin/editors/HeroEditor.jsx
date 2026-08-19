import { FieldInput, FieldTextarea } from "../shared/Fields";
import ImageField from "../shared/ImageField";
import ArrayEditor from "../shared/ArrayEditor";
import { IconPickerField } from "../shared/IconPickerField";

const STAT_TEMPLATE   = { icon: "MapPin", value: "100+", label: "Địa điểm" };
const BG_IMG_TEMPLATE = { url: "", alt: "" };

export default function HeroEditor({ data, onChange, sharedOnly, translationOnly, arrayActions }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  const updStat = (idx, key, val) => {
    const stats = [...(data.stats || [])];
    stats[idx] = { ...stats[idx], [key]: val };
    upd("stats", stats);
  };

  const updBg = (idx, key, val) => {
    const imgs = [...(data.backgroundImages || [])];
    imgs[idx] = { ...imgs[idx], [key]: val };
    upd("backgroundImages", imgs);
  };

  return (
    <div>
      {/* Text content */}
      {!sharedOnly && (
        <>
          <FieldInput
            label="Badge / nhãn nhỏ"
            value={data.badge}
            onChange={(v) => upd("badge", v)}
            placeholder="Thuyết minh du lịch bằng âm thanh"
          />
          <FieldInput
            label="Heading dòng 1"
            value={data.heading1}
            onChange={(v) => upd("heading1", v)}
            placeholder="Khám phá phố ẩm thực"
          />
          <FieldInput
            label="Heading dòng 2 (màu gradient)"
            value={data.heading2}
            onChange={(v) => upd("heading2", v)}
            placeholder="qua âm thanh"
          />
          <FieldTextarea
            label="Mô tả phụ"
            value={data.description}
            onChange={(v) => upd("description", v)}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <FieldInput label="CTA 1 — Text" value={data.cta1Text} onChange={(v) => upd("cta1Text", v)} placeholder="Tải app ngay" />
            <FieldInput label="CTA 2 — Text" value={data.cta2Text} onChange={(v) => upd("cta2Text", v)} placeholder="Đăng ký đối tác" />
          </div>
        </>
      )}

      {/* Links */}
      {!translationOnly && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <FieldInput label="CTA 1 — Link" value={data.cta1Link} onChange={(v) => upd("cta1Link", v)} placeholder="#download" />
          <FieldInput label="CTA 2 — Link" value={data.cta2Link} onChange={(v) => upd("cta2Link", v)} placeholder="#consult" />
        </div>
      )}

      {/* Background images array */}
      {!translationOnly && (
      <ArrayEditor
        label="Ảnh nền (slideshow tự động)"
        items={data.backgroundImages || []}
        onMove={arrayActions ? (o, n) => arrayActions.onMove("backgroundImages", o, n) : undefined}
        onAddGlobal={arrayActions ? () => arrayActions.onAdd("backgroundImages", { ...BG_IMG_TEMPLATE }, {}) : undefined}
        onRemoveGlobal={arrayActions ? (idx) => arrayActions.onRemove("backgroundImages", idx) : undefined}
        onReorder={(v) => upd("backgroundImages", v)}
        addLabel="Thêm ảnh nền"
        onAdd={() => upd("backgroundImages", [...(data.backgroundImages || []), { ...BG_IMG_TEMPLATE }])}
        onRemove={(idx) => upd("backgroundImages", (data.backgroundImages || []).filter((_, i) => i !== idx))}
      >
        {(img, idx) => (
          <ImageField
            label={`Ảnh nền #${idx + 1}`}
            value={img.url}
            onChange={(v) => updBg(idx, "url", v)}
            sectionKey="hero"
            previewSize="lg"
            hint="1920×1080px, WebP/JPG"
          />
        )}
      </ArrayEditor>
      )}

      {/* Stats */}
      <ArrayEditor
        label="Số liệu thống kê (Stats)"
        items={data.stats || []}
        onMove={arrayActions ? (o, n) => arrayActions.onMove("stats", o, n) : undefined}
        onAddGlobal={arrayActions ? () => arrayActions.onAdd("stats", { icon: "MapPin" }, { value: "100+", label: "Địa điểm" }) : undefined}
        onRemoveGlobal={arrayActions ? (idx) => arrayActions.onRemove("stats", idx) : undefined}
        onReorder={(v) => upd("stats", v)}
        addLabel="Thêm số liệu"
        hideControls={translationOnly}
        onAdd={() => upd("stats", [...(data.stats || []), { ...STAT_TEMPLATE }])}
        onRemove={(idx) => upd("stats", (data.stats || []).filter((_, i) => i !== idx))}
      >
        {(stat, idx) => (
          <div className="grid grid-cols-3 gap-3">
            {!translationOnly && (
              <IconPickerField
                label="Icon"
                value={stat.icon}
                onChange={(v) => updStat(idx, "icon", v)}
              />
            )}
            {!sharedOnly && (
              <>
                <FieldInput label="Giá trị" value={stat.value} onChange={(v) => updStat(idx, "value", v)} placeholder="100+" />
                <FieldInput label="Nhãn" value={stat.label} onChange={(v) => updStat(idx, "label", v)} placeholder="Địa điểm" />
              </>
            )}
          </div>
        )}
      </ArrayEditor>
    </div>
  );
}
