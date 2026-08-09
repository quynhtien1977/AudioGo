import { FieldInput } from "../shared/Fields";
import ImageField from "../shared/ImageField";
import ArrayEditor from "../shared/ArrayEditor";

const IMG_TEMPLATE = { url: "", alt: "Màn hình app AudioGo" };

export default function ScreenshotsEditor({ data, onChange, sharedOnly, translationOnly }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  const updImg = (idx, key, val) => {
    const images = [...(data.images || [])];
    images[idx] = { ...images[idx], [key]: val };
    upd("images", images);
  };

  return (
    <div>
      {!sharedOnly && (
        <FieldInput label="Tiêu đề section" value={data.title} onChange={(v) => upd("title", v)}
          placeholder="Giao diện ứng dụng" />
      )}

      <ArrayEditor
        label="Ảnh chụp màn hình"
        items={data.images || []}
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
