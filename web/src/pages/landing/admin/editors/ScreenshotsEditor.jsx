import { FieldInput, FieldTextarea } from "../shared/Fields";
import ImageField from "../shared/ImageField";
import ArrayEditor from "../shared/ArrayEditor";

const IMG_TEMPLATE = { url: "", alt: "Màn hình app AudioGo" };

export default function ScreenshotsEditor({ data, onChange, sharedOnly, translationOnly, arrayActions }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  const updImg = (idx, key, val) => {
    const images = [...(data.images || [])];
    images[idx] = { ...images[idx], [key]: val };
    upd("images", images);
  };

  return (
    <div>
      {!sharedOnly && (
        <>
          <FieldInput label="Badge" value={data.badge} onChange={(v) => upd("badge", v)}
            placeholder="Ứng dụng" />
          <FieldInput label="Tiêu đề section" value={data.title} onChange={(v) => upd("title", v)}
            placeholder="Giao diện ứng dụng" />
          <FieldTextarea label="Phụ đề" value={data.subtitle} onChange={(v) => upd("subtitle", v)}
            rows={2} placeholder="Vuốt để khám phá các màn hình" />
        </>
      )}

      <ArrayEditor
        label="Ảnh chụp màn hình"
        items={data.images || []}
        onMove={arrayActions ? (o, n) => arrayActions.onMove("images", o, n) : undefined}
        onAddGlobal={arrayActions ? () => arrayActions.onAdd("images", { url: "" }, { alt: "Màn hình app AudioGo" }) : undefined}
        onRemoveGlobal={arrayActions ? (idx) => arrayActions.onRemove("images", idx) : undefined}
        onReorder={(v) => upd("images", v)}
        addLabel="Thêm ảnh"
        hideControls={translationOnly}
        onAdd={() => upd("images", [...(data.images || []), { ...IMG_TEMPLATE }])}
        onRemove={(idx) => upd("images", (data.images || []).filter((_, i) => i !== idx))}
      >
        {(img, idx) => (
          <>
            {!translationOnly && (
              <ImageField
                label="Ảnh"
                value={img.url}
                onChange={(v) => updImg(idx, "url", v)}
                sectionKey="screenshots"
                hint="Kích thước đề nghị: 390×844px (tỷ lệ điện thoại)"
              />
            )}
            {!sharedOnly && (
              <FieldInput
                label="Alt text (mô tả ảnh)"
                value={img.alt}
                onChange={(v) => updImg(idx, "alt", v)}
                placeholder="Màn hình chính AudioGo"
                hint="Dùng cho SEO và accessibility"
              />
            )}
          </>
        )}
      </ArrayEditor>
    </div>
  );
}
