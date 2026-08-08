import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Phone, Store, User, MessageSquare, MapPin } from "lucide-react";
import * as LucideIcons from "lucide-react";
import toast from "react-hot-toast";
import { submitConsultation } from "@/api/landingApi";

function DynIcon({ name, ...props }) {
  const Icon = LucideIcons[name] || LucideIcons.CheckCircle;
  return <Icon {...props} />;
}

export default function ConsultSection({ data }) {
  const {
    title = "Đăng ký làm đối tác",
    subtitle = "Chủ quán ẩm thực tại Phố Vĩnh Khánh Q4? Hãy để AudioGo kể câu chuyện của bạn bằng âm thanh.",
    formNote = "Chúng tôi sẽ liên hệ trong vòng 24 giờ làm việc.",
    benefits = [],
  } = data || {};

  const [form, setForm] = useState({
    fullName: "",
    restaurantName: "",
    phoneNumber: "",
    area: "Vĩnh Khánh Q4",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.restaurantName || !form.phoneNumber || !form.email) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc (bao gồm email).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Email không hợp lệ.");
      return;
    }
    setLoading(true);
    try {
      await submitConsultation(form);
      setSubmitted(true);
      toast.success("Gửi thành công! Chúng tôi sẽ liên hệ sớm.");
    } catch (err) {
      const msg = err?.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="consult"
      className="py-24"
      style={{ background: "var(--lp-section-light)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: info */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span
              style={{
                background: "var(--lp-badge-bg)",
                color: "var(--lp-badge-text)",
                border: "1px solid var(--lp-badge-border)",
              }}
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
            >
              Dành cho chủ quán
            </span>
            <h2 style={{ color: "var(--lp-text)" }} className="text-3xl sm:text-4xl font-bold mb-4">
              {title}
            </h2>
            <p style={{ color: "var(--lp-text-muted)" }} className="text-base leading-relaxed mb-8">
              {subtitle}
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex items-start gap-4 mb-5"
                >
                  <div className="w-9 h-9 rounded-lg bg-pink-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-pink-600/20">
                    <DynIcon name={b.icon} size={18} className="text-white" />
                  </div>
                  <p style={{ color: "var(--lp-text)" }} className="font-medium pt-1.5 text-sm">
                    {b.text}
                  </p>
                </motion.div>
              ))}
            </div>

            <p style={{ color: "var(--lp-text-faint)" }} className="mt-8 text-xs">
              {formNote}
            </p>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{
              background: "var(--lp-bg-card)",
              borderColor: "var(--lp-border)",
            }}
            className="rounded-2xl shadow-sm border p-6 sm:p-8"
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check size={32} className="text-green-500" />
                </div>
                <h3 style={{ color: "var(--lp-text)" }} className="font-semibold text-xl">
                  Đã nhận yêu cầu!
                </h3>
                <p style={{ color: "var(--lp-text-muted)" }} className="text-sm max-w-xs">
                  Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ làm việc để tư vấn chi tiết.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 style={{ color: "var(--lp-text)" }} className="font-semibold text-lg mb-6">
                  Điền thông tin để được tư vấn miễn phí
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField icon={<User size={15} />} label="Họ tên *" value={form.fullName} onChange={set("fullName")} placeholder="Nguyễn Văn A" />
                  <FormField icon={<Phone size={15} />} label="Số điện thoại *" value={form.phoneNumber} onChange={set("phoneNumber")} placeholder="0912 345 678" type="tel" />
                </div>

                <FormField icon={<Store size={15} />} label="Tên quán *" value={form.restaurantName} onChange={set("restaurantName")} placeholder="Quán Bún Mắm Má Hai" />
                <FormField icon={<MapPin size={15} />} label="Khu vực" value={form.area} onChange={set("area")} placeholder="Vĩnh Khánh Q4" />
                <FormField icon={<MessageSquare size={15} />} label="Email *" value={form.email} onChange={set("email")} placeholder="example@gmail.com" type="email" />

                <div>
                  <label style={{ color: "var(--lp-text-muted)" }} className="block text-sm font-medium mb-1.5">
                    Tin nhắn (không bắt buộc)
                  </label>
                  <textarea
                    value={form.message}
                    onChange={set("message")}
                    rows={3}
                    placeholder="Thêm thông tin bạn muốn chia sẻ..."
                    style={{
                      background: "var(--lp-input-bg)",
                      borderColor: "var(--lp-input-border)",
                      color: "var(--lp-input-text)",
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-white bg-pink-600 hover:bg-pink-700 hover:shadow-lg hover:shadow-pink-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {loading ? "Đang gửi..." : "Gửi yêu cầu tư vấn"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FormField({ icon, label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label style={{ color: "var(--lp-text-muted)" }} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400/60">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            background: "var(--lp-input-bg)",
            borderColor: "var(--lp-input-border)",
            color: "var(--lp-input-text)",
          }}
          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
        />
      </div>
    </div>
  );
}
