import { useState } from "react";
import {
  Send,
  Megaphone,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Bell,
  Layers,
  Clock,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { notificationApi } from "../api/notificationApi";

const ROLE_OPTIONS = [
  {
    id: "Owner",
    label: "Chủ địa điểm (Owner)",
    desc: "Tất cả tài khoản đối tác sở hữu POI",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "Editor",
    label: "Biên tập viên (Editor)",
    desc: "Đội ngũ biên tập nội dung, POI và Tour",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "Admin",
    label: "Quản trị viên (Admin)",
    desc: "Tất cả tài khoản Admin trong hệ thống",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "Public",
    label: "Ứng dụng Di động (Mobile Public)",
    desc: "Thông báo chung phát cho người dùng app du lịch",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
];

const TEMPLATES = [
  {
    name: "Bảo trì hệ thống",
    title: "Bảo trì và nâng cấp hệ thống định kỳ",
    body: "Hệ thống AudioGo sẽ tiến hành bảo trì nâng cấp máy chủ từ 01:00 đến 03:00 sáng mai. Một số dịch vụ có thể tạm gián đoạn.",
    roles: ["Owner", "Editor", "Admin"],
  },
  {
    name: "Chính sách mới",
    title: "Cập nhật chính sách kiểm duyệt POI mới",
    body: "AudioGo đã cập nhật tiêu chuẩn duyệt bài và hình ảnh địa điểm mới nhằm nâng cao chất lượng trải nghiệm cho du khách. Vui lòng xem chi tiết tại mục Hướng dẫn.",
    roles: ["Owner", "Editor"],
  },
  {
    name: "Ưu đãi gói hội viên",
    title: "Chương trình ưu đãi nâng cấp gói dịch vụ POI",
    body: "Nâng cấp lên gói VIP Pro trong tháng này để nhận thêm 20 lượt đăng địa điểm và đẩy ưu tiên hiển thị trên bản đồ du lịch.",
    roles: ["Owner"],
  },
  {
    name: "Tính năng mới",
    title: "Ra mắt tính năng tạo audio tự động bằng AI",
    body: "Tính năng tổng hợp giọng đọc AI đa ngôn ngữ chất lượng cao hiện đã khả dụng cho toàn bộ các địa điểm trong hệ thống!",
    roles: ["Owner", "Editor", "Admin"],
  },
];

export default function AdminBroadcastPage() {
  const [selectedRoles, setSelectedRoles] = useState(["Owner", "Editor"]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const toggleRole = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
  };

  const selectAllRoles = () => {
    setSelectedRoles(ROLE_OPTIONS.map((r) => r.id));
  };

  const clearRoles = () => {
    setSelectedRoles([]);
  };

  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    setSelectedRoles(tpl.roles);
    toast.success(`Đã áp dụng mẫu: "${tpl.name}"`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedRoles.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 nhóm đối tượng nhận thông báo");
      return;
    }

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề thông báo");
      return;
    }

    if (!body.trim()) {
      toast.error("Vui lòng nhập nội dung thông báo");
      return;
    }

    setIsSending(true);
    try {
      await notificationApi.createBroadcast({
        targetRoles: selectedRoles,
        title: title.trim(),
        body: body.trim(),
      });

      toast.success("Thông báo đã được phát đi thành công!");
      setTitle("");
      setBody("");
    } catch (err) {
      console.error("Gửi broadcast thất bại:", err);
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Không thể gửi thông báo. Vui lòng thử lại!"
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shadow-xs">
              <Megaphone size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gửi thông báo hệ thống (Broadcast)
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Phát thông báo tức thì tới nhóm người dùng CMS. Chọn "Cảnh báo hệ thống" để hiện banner trên app mobile khi khởi động.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Templates */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-500">
              <Sparkles size={14} />
              <span>Mẫu thông báo nhanh</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-pink-50 hover:text-pink-600 rounded-xl border border-gray-200 transition-all text-left truncate cursor-pointer"
                  title={tpl.title}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
            {/* Target Roles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Users size={16} className="text-pink-500" />
                  Đối tượng nhận thông báo <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllRoles}
                    className="text-xs text-pink-600 hover:text-pink-800 font-medium cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={clearRoles}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROLE_OPTIONS.map((opt) => {
                  const isChecked = selectedRoles.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => toggleRole(opt.id)}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? "border-pink-500 bg-pink-50/20 shadow-xs"
                          : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${isChecked ? "text-gray-900" : "text-gray-700"}`}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-800">
                  Tiêu đề thông báo <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400">{title.length}/100</span>
              </div>
              <input
                type="text"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Bảo trì hệ thống định kỳ..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-800">
                  Nội dung chi tiết <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400">{body.length}/500</span>
              </div>
              <textarea
                rows={5}
                maxLength={500}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Nhập nội dung thông điệp cần truyền tải tới người dùng..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition resize-none leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSending}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm shadow-md shadow-pink-500/20 transition-all cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Đang gửi thông báo...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Phát thông báo ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Live Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5 sticky top-24">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Bell size={14} />
              <span>Xem trước hiển thị (Live Preview)</span>
            </div>

            {/* Simulated Notification Dropdown Item */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">
                Hiển thị trong chuông thông báo CMS:
              </p>
              <div className="p-4 rounded-xl border border-gray-200 bg-pink-50/20 shadow-xs">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                    <Megaphone size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
                        {title.trim() || "Tiêu đề thông báo của bạn"}
                      </p>
                      <span className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-1.5" />
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-3 leading-relaxed">
                      {body.trim() ||
                        "Nội dung thông báo sẽ xuất hiện ở đây khi bạn nhập vào biểu mẫu bên cạnh..."}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-gray-400 font-medium">
                        Vừa xong
                      </span>
                      <span className="text-[10px] text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded font-medium">
                        Broadcast
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient summary badge */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <p className="text-xs font-medium text-gray-500">Nhóm sẽ nhận thông báo:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedRoles.length === 0 ? (
                  <span className="text-xs text-red-500 italic">Chưa chọn đối tượng nào</span>
                ) : (
                  selectedRoles.map((r) => {
                    const opt = ROLE_OPTIONS.find((o) => o.id === r);
                    return (
                      <span
                        key={r}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${opt?.color || "bg-gray-100 text-gray-700"}`}
                      >
                        {opt?.label.split(" (")[0]}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick tips */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs text-gray-500 space-y-2">
              <p className="font-semibold text-gray-700 flex items-center gap-1.5">
                <Info size={14} className="text-pink-500" />
                <span>Lưu ý quan trọng:</span>
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Thông báo CMS sẽ được gửi tức thì đến hộp thư của tất cả tài khoản thuộc nhóm đã chọn.</li>
                <li>Biểu tượng chuông của các tài khoản đang hoạt động sẽ tự động cập nhật sau mỗi 30 giây.</li>
                <li>Cảnh báo hệ thống (App Alert) hiện 1 lần trên app mobile khi khởi động — sau khi đóng sẽ không hiện lại cho đến khi có cảnh báo mới.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
