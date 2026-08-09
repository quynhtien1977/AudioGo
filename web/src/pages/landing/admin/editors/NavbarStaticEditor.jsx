import { FieldInput } from "../shared/Fields";

export default function NavbarStaticEditor({ data, onChange, sharedOnly }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  if (sharedOnly) {
    return (
      <div className="p-4 text-sm text-gray-500 italic">
        Section này chỉ chứa nội dung chữ (cần dịch), không có cấu hình dùng chung. Vui lòng chuyển sang tab "Dịch thuật & Nội dung".
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-gray-700 mb-3 uppercase text-xs tracking-wider">Navbar (Menu)</h4>
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Menu: Giới thiệu" value={data.navIntro} onChange={v => upd("navIntro", v)} placeholder="Giới thiệu" />
          <FieldInput label="Menu: Cách hoạt động" value={data.navHow} onChange={v => upd("navHow", v)} placeholder="Cách hoạt động" />
          <FieldInput label="Menu: Ảnh app" value={data.navScreenshots} onChange={v => upd("navScreenshots", v)} placeholder="Ảnh app" />
          <FieldInput label="Menu: Tải App" value={data.navDownload} onChange={v => upd("navDownload", v)} placeholder="Tải App" />
          <FieldInput label="Menu: Liên hệ" value={data.navContact} onChange={v => upd("navContact", v)} placeholder="Liên hệ" />
          <FieldInput label="Nút: Đăng nhập (PC)" value={data.navLogin} onChange={v => upd("navLogin", v)} placeholder="Đăng nhập" />
          <FieldInput label="Nút: Đăng ký đối tác" value={data.navPartner} onChange={v => upd("navPartner", v)} placeholder="Đăng ký làm đối tác" />
          <FieldInput label="Nút: Đăng nhập (Mobile)" value={data.navLoginMobile} onChange={v => upd("navLoginMobile", v)} placeholder="Đăng nhập quản lý" />
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 mb-3 uppercase text-xs tracking-wider">Nút liên hệ nổi (Floating)</h4>
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Tiêu đề popup" value={data.floatTitle} onChange={v => upd("floatTitle", v)} placeholder="Liên hệ AudioGo" />
          <FieldInput label="Phụ đề popup" value={data.floatSubtitle} onChange={v => upd("floatSubtitle", v)} placeholder="Chúng tôi sẵn sàng hỗ trợ bạn" />
          <FieldInput label="Nhãn Zalo" value={data.floatZalo} onChange={v => upd("floatZalo", v)} placeholder="Zalo Chat" />
          <FieldInput label="Mô tả Zalo" value={data.floatZaloSub} onChange={v => upd("floatZaloSub", v)} placeholder="Chat ngay" />
          <FieldInput label="Nhãn Facebook" value={data.floatFb} onChange={v => upd("floatFb", v)} placeholder="Facebook" />
          <FieldInput label="Mô tả Facebook" value={data.floatFbSub} onChange={v => upd("floatFbSub", v)} placeholder="Nhắn tin Fanpage" />
          <FieldInput label="Nút mở liên hệ" value={data.floatOpen} onChange={v => upd("floatOpen", v)} placeholder="Liên hệ" />
          <FieldInput label="Nút đóng liên hệ" value={data.floatClose} onChange={v => upd("floatClose", v)} placeholder="Đóng" />
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 mb-3 uppercase text-xs tracking-wider">Footer (Text tĩnh)</h4>
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Cột 2: Liên hệ" value={data.footContactTitle} onChange={v => upd("footContactTitle", v)} placeholder="Liên hệ" />
          <FieldInput label="Nút chat Zalo" value={data.footZaloBtn} onChange={v => upd("footZaloBtn", v)} placeholder="Chat Zalo →" />
          <FieldInput label="Cột 3: Liên kết nhanh" value={data.footQuickTitle} onChange={v => upd("footQuickTitle", v)} placeholder="Nhanh" />
          <FieldInput label="Bản quyền" value={data.footCopyright} onChange={v => upd("footCopyright", v)} placeholder="© 2026 AudioGo. All rights reserved." />
          <FieldInput label="Made with..." value={data.footMadeWith} onChange={v => upd("footMadeWith", v)} placeholder="Made with ❤️ in Hồ Chí Minh" />
        </div>
      </div>
    </div>
  );
}
