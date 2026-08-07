import { FieldInput, FieldTextarea } from "../shared/Fields";

/**
 * SimpleEditor — dùng cho consult_cta, download_cta, stats_bar
 * Render tất cả string fields từ schema của section theo cấu hình.
 */
const SECTION_SCHEMAS = {
  consult_cta: [
    { key: "title",     label: "Tiêu đề",     type: "input",    placeholder: "Đăng ký làm đối tác" },
    { key: "subtitle",  label: "Phụ đề",      type: "textarea", placeholder: "Chúng tôi đồng hành cùng chủ quán..." },
    { key: "formNote",  label: "Ghi chú form", type: "textarea", placeholder: "Thông tin chỉ dùng để liên hệ..." },
  ],
  download_cta: [
    { key: "title",           label: "Tiêu đề",              type: "input",    placeholder: "Sẵn sàng khám phá?" },
    { key: "subtitle",        label: "Phụ đề",               type: "textarea", placeholder: "Tải app ngay — miễn phí..." },
    { key: "installGuide",    label: "Hướng dẫn cài đặt",    type: "textarea", placeholder: "Cần bật 'Cài đặt từ nguồn không xác định'..." },
    { key: "googlePlayText",  label: "Text Google Play",      type: "input",    placeholder: "Sắp ra mắt trên Google Play" },
  ],
  stats_bar: [], // handled separately with ArrayEditor if needed
};

export default function SimpleEditor({ sectionKey, data, onChange }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });
  const schema = SECTION_SCHEMAS[sectionKey] || [];

  if (schema.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-6 text-center">
        Section này không có field nào để chỉnh sửa trực tiếp.<br />
        <span className="text-xs">Sử dụng các section khác để cấu hình.</span>
      </div>
    );
  }

  return (
    <div>
      {schema.map((field) =>
        field.type === "textarea" ? (
          <FieldTextarea
            key={field.key}
            label={field.label}
            value={data[field.key]}
            onChange={(v) => upd(field.key, v)}
            placeholder={field.placeholder}
            rows={3}
          />
        ) : (
          <FieldInput
            key={field.key}
            label={field.label}
            value={data[field.key]}
            onChange={(v) => upd(field.key, v)}
            placeholder={field.placeholder}
          />
        )
      )}
    </div>
  );
}
