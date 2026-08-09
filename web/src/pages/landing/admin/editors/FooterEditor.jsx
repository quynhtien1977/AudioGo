import { FieldInput, FieldTextarea } from "../shared/Fields";
import ImageField from "../shared/ImageField";
import ArrayEditor from "../shared/ArrayEditor";

const SOCIAL_TEMPLATE = { platform: "facebook", url: "" };

export default function FooterEditor({ data, onChange, sharedOnly, translationOnly }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  const updSocial = (idx, key, val) => {
    const links = [...(data.socialLinks || [])];
    links[idx] = { ...links[idx], [key]: val };
    upd("socialLinks", links);
  };

  return (
    <div>
      {!sharedOnly && (
        <>
          <FieldTextarea label="Mô tả thương hiệu" value={data.description} onChange={(v) => upd("description", v)} rows={2}
            placeholder="AudioGo — Ứng dụng thuyết minh ẩm thực bằng âm thanh." />
          <FieldTextarea label="Địa chỉ" value={data.address} onChange={(v) => upd("address", v)} rows={2}
            placeholder="Phố Ẩm Thực Vĩnh Khánh, Quận 4..." />
        </>
      )}

      {!translationOnly && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4 mt-4">
            <FieldInput label="Email liên hệ" value={data.email} onChange={(v) => upd("email", v)}
              placeholder="hello@audiogo.vn" type="email" />
            <FieldInput label="Số điện thoại" value={data.phone} onChange={(v) => upd("phone", v)}
              placeholder="0900 123 456" />
          </div>

          <FieldInput label="Link Zalo OA" value={data.zaloLink} onChange={(v) => upd("zaloLink", v)}
            placeholder="https://zalo.me/..." />

          <FieldInput label="Link Facebook / Messenger" value={data.facebookLink} onChange={(v) => upd("facebookLink", v)}
            placeholder="https://m.me/audiogo.vn" hint="Hiện trong nút liên hệ nổi góc phải trang" />

          <ImageField
            label="Logo Footer (tuỳ chọn)"
            value={data.logoUrl}
            onChange={(v) => upd("logoUrl", v)}
            sectionKey="footer"
            hint="PNG nền trong, kích thước 200×60px"
          />

          <ArrayEditor
            label="Mạng xã hội"
            items={data.socialLinks || []}
            onReorder={(v) => upd("socialLinks", v)}
            addLabel="Thêm mạng xã hội"
            onAdd={() => upd("socialLinks", [...(data.socialLinks || []), { ...SOCIAL_TEMPLATE }])}
            onRemove={(idx) => upd("socialLinks", (data.socialLinks || []).filter((_, i) => i !== idx))}
          >
            {(s, idx) => (
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="Platform" value={s.platform} onChange={(v) => updSocial(idx, "platform", v)}
                  placeholder="facebook / tiktok / youtube" />
                <FieldInput label="URL" value={s.url} onChange={(v) => updSocial(idx, "url", v)}
                  placeholder="https://facebook.com/..." />
              </div>
            )}
          </ArrayEditor>
        </>
      )}
    </div>
  );
}
