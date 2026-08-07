import { FieldInput, FieldTextarea } from "../shared/Fields";
import ArrayEditor from "../shared/ArrayEditor";
import { IconPickerField } from "../shared/IconPickerField";

const BENEFIT_TEMPLATE = { icon: "Zap", text: "Lợi ích nổi bật..." };

/**
 * ConsultEditor — editor đầy đủ cho section Tư vấn / Đối tác
 * Tuỳ chỉnh: tiêu đề, phụ đề, ghi chú form, và danh sách benefits (icon + text)
 */
export default function ConsultEditor({ data, onChange }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  const updBenefit = (idx, key, val) => {
    const benefits = [...(data.benefits || [])];
    benefits[idx] = { ...benefits[idx], [key]: val };
    upd("benefits", benefits);
  };

  return (
    <div>
      <FieldInput
        label="Tiêu đề"
        value={data.title}
        onChange={(v) => upd("title", v)}
        placeholder="Đăng ký làm đối tác"
      />
      <FieldTextarea
        label="Phụ đề"
        value={data.subtitle}
        onChange={(v) => upd("subtitle", v)}
        rows={3}
        placeholder="Chủ quán ẩm thực tại Phố Vĩnh Khánh Q4? Hãy để AudioGo kể câu chuyện của bạn bằng âm thanh."
      />
      <FieldTextarea
        label="Ghi chú form (hiển thị bên dưới danh sách lợi ích)"
        value={data.formNote}
        onChange={(v) => upd("formNote", v)}
        rows={2}
        placeholder="Chúng tôi sẽ liên hệ trong vòng 24 giờ làm việc."
      />

      <ArrayEditor
        label="Danh sách lợi ích (bullet points)"
        items={data.benefits || []}
        addLabel="Thêm lợi ích"
        onAdd={() => upd("benefits", [...(data.benefits || []), { ...BENEFIT_TEMPLATE }])}
        onRemove={(idx) => upd("benefits", (data.benefits || []).filter((_, i) => i !== idx))}
      >
        {(b, idx) => (
          <>
            <IconPickerField
              label="Icon"
              value={b.icon}
              onChange={(v) => updBenefit(idx, "icon", v)}
            />
            <FieldInput
              label="Nội dung"
              value={b.text}
              onChange={(v) => updBenefit(idx, "text", v)}
              placeholder="Kích hoạt trong vòng 24 giờ"
            />
          </>
        )}
      </ArrayEditor>
    </div>
  );
}
