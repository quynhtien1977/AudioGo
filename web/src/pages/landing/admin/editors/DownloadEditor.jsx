import { FieldInput, FieldTextarea } from "../shared/Fields";
import ImageField from "../shared/ImageField";

/**
 * DownloadEditor — editor riêng cho section Tải App
 * Hỗ trợ: tiêu đề, phụ đề, logo app, hướng dẫn cài đặt, text Google Play
 */
export default function DownloadEditor({ data, onChange, sharedOnly, translationOnly }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      {!sharedOnly && (
        <>
          <FieldInput
            label="Tiêu đề"
            value={data.title}
            onChange={(v) => upd("title", v)}
            placeholder="Sẵn sàng khám phá?"
          />
          <FieldTextarea
            label="Phụ đề"
            value={data.subtitle}
            onChange={(v) => upd("subtitle", v)}
            rows={3}
            placeholder="Tải app ngay — miễn phí, trải nghiệm thuyết minh ẩm thực độc đáo..."
          />
          <FieldInput
            label="Tên ứng dụng"
            value={data.appName}
            onChange={(v) => upd("appName", v)}
            placeholder="AudioGo Android"
            hint="Hiển thị trong card tải app"
          />
        </>
      )}

      {!translationOnly && (
        <ImageField
          label="Logo App (hiển thị trong section tải app)"
          value={data.appLogoUrl}
          onChange={(v) => upd("appLogoUrl", v)}
          sectionKey="logo-app"
          previewSize="lg"
          hint="PNG nền trong, kích thước đề nghị: 256×256px hoặc 512×512px"
        />
      )}

      {!sharedOnly && (
        <>
          <FieldTextarea
            label="Hướng dẫn cài đặt"
            value={data.installGuide}
            onChange={(v) => upd("installGuide", v)}
            rows={3}
            placeholder="Cần bật 'Cài ứng dụng từ nguồn không xác định' trong Cài đặt > Bảo mật."
          />
          <FieldInput
            label="Text Google Play (chưa ra mắt)"
            value={data.googlePlayText}
            onChange={(v) => upd("googlePlayText", v)}
            placeholder="Sắp ra mắt trên Google Play"
          />
        </>
      )}
    </div>
  );
}
