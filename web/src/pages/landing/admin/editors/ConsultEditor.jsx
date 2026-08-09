import { FieldInput, FieldTextarea } from "../shared/Fields";
import ArrayEditor from "../shared/ArrayEditor";
import { IconPickerField } from "../shared/IconPickerField";

const BENEFIT_TEMPLATE = { icon: "Zap", text: "Lợi ích nổi bật..." };

/**
 * ConsultEditor — editor đầy đủ cho section Tư vấn / Đối tác
 * Tuỳ chỉnh: tiêu đề, phụ đề, ghi chú form, và danh sách benefits (icon + text)
 */
export default function ConsultEditor({ data, onChange, sharedOnly, translationOnly }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  const updBenefit = (idx, key, val) => {
    const benefits = [...(data.benefits || [])];
    benefits[idx] = { ...benefits[idx], [key]: val };
    upd("benefits", benefits);
  };

  return (
    <div>
      {!sharedOnly && (
        <>
          <FieldInput
            label="Nhãn (Badge)"
            value={data.badge}
            onChange={(v) => upd("badge", v)}
            placeholder="Dành cho chủ quán"
          />
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
            rows={2}
            placeholder="Chúng tôi sẽ liên hệ trong vòng 24 giờ làm việc."
          />
          <hr className="my-4 border-gray-100" />
          <h4 className="font-semibold text-gray-700 mb-3 uppercase text-xs tracking-wider">Form Đăng ký</h4>
          <FieldInput label="Tiêu đề form" value={data.formTitle} onChange={(v) => upd("formTitle", v)} placeholder="Điền thông tin để được tư vấn miễn phí" />
          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="Nhãn: Họ tên" value={data.formNameLabel} onChange={(v) => upd("formNameLabel", v)} placeholder="Họ tên *" />
            <FieldInput label="Placeholder: Họ tên" value={data.formNamePlaceholder} onChange={(v) => upd("formNamePlaceholder", v)} placeholder="Nguyễn Văn A" />
            <FieldInput label="Nhãn: Số ĐT" value={data.formPhoneLabel} onChange={(v) => upd("formPhoneLabel", v)} placeholder="Số điện thoại *" />
            <FieldInput label="Placeholder: Số ĐT" value={data.formPhonePlaceholder} onChange={(v) => upd("formPhonePlaceholder", v)} placeholder="0912 345 678" />
            <FieldInput label="Nhãn: Tên quán" value={data.formStoreLabel} onChange={(v) => upd("formStoreLabel", v)} placeholder="Tên quán *" />
            <FieldInput label="Placeholder: Tên quán" value={data.formStorePlaceholder} onChange={(v) => upd("formStorePlaceholder", v)} placeholder="Quán Bún Mắm Má Hai" />
            <FieldInput label="Nhãn: Khu vực" value={data.formAreaLabel} onChange={(v) => upd("formAreaLabel", v)} placeholder="Khu vực" />
            <FieldInput label="Placeholder: Khu vực" value={data.formAreaPlaceholder} onChange={(v) => upd("formAreaPlaceholder", v)} placeholder="Vĩnh Khánh Q4" />
            <FieldInput label="Nhãn: Email" value={data.formEmailLabel} onChange={(v) => upd("formEmailLabel", v)} placeholder="Email *" />
            <FieldInput label="Placeholder: Email" value={data.formEmailPlaceholder} onChange={(v) => upd("formEmailPlaceholder", v)} placeholder="example@gmail.com" />
            <FieldInput label="Nhãn: Tin nhắn" value={data.formMessageLabel} onChange={(v) => upd("formMessageLabel", v)} placeholder="Tin nhắn (không bắt buộc)" />
            <FieldInput label="Placeholder: Tin nhắn" value={data.formMessagePlaceholder} onChange={(v) => upd("formMessagePlaceholder", v)} placeholder="Thêm thông tin bạn muốn chia sẻ..." />
            <FieldInput label="Nút Gửi" value={data.formSubmitBtn} onChange={(v) => upd("formSubmitBtn", v)} placeholder="Gửi yêu cầu tư vấn" />
            <FieldInput label="Nút Đang gửi" value={data.formSubmittingBtn} onChange={(v) => upd("formSubmittingBtn", v)} placeholder="Đang gửi..." />
            <FieldInput label="Tiêu đề thành công" value={data.formSuccessTitle} onChange={(v) => upd("formSuccessTitle", v)} placeholder="Đã nhận yêu cầu!" />
            <FieldInput label="Mô tả thành công" value={data.formSuccessDesc} onChange={(v) => upd("formSuccessDesc", v)} placeholder="Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ làm việc để tư vấn chi tiết." />
          </div>
        </>
      )}

      <ArrayEditor
        label="Danh sách lợi ích (bullet points)"
        items={data.benefits || []}
        addLabel="Thêm lợi ích"
        hideControls={translationOnly}
        onAdd={() => upd("benefits", [...(data.benefits || []), { ...BENEFIT_TEMPLATE }])}
        onRemove={(idx) => upd("benefits", (data.benefits || []).filter((_, i) => i !== idx))}
      >
        {(b, idx) => (
          <>
            {!translationOnly && (
              <IconPickerField
                label="Icon"
                value={b.icon}
                onChange={(v) => updBenefit(idx, "icon", v)}
              />
            )}
            {!sharedOnly && (
              <FieldInput
                label="Nội dung"
                value={b.text}
                onChange={(v) => updBenefit(idx, "text", v)}
                placeholder="Kích hoạt trong vòng 24 giờ"
              />
            )}
          </>
        )}
      </ArrayEditor>
    </div>
  );
}
