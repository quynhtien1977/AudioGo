import { useEffect, useState } from "react";
import { Plus, Edit2, Check, X, Eye, EyeOff, Package, Activity, Archive } from "lucide-react";
import toast from "react-hot-toast";
import * as subscriptionApi from "../api/subscriptionApi";

const parseFeatures = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const normalizePlan = (plan) => ({
  ...plan,
  planId: plan.planId || plan.PlanId || plan.id || "",
  name: plan.name || plan.Name || "",
  price: Number(plan.price || plan.Price || 0),
  durationDay: Number(plan.durationDay || plan.DurationDay || 30),
  maxPoiCount: Number(plan.maxPoiCount ?? plan.MaxPoiCount ?? 0),
  autoPriority: Number(plan.autoPriority ?? plan.AutoPriority ?? 1),
  features: parseFeatures(plan.features || plan.Features),
  isActive: plan.isActive ?? plan.IsActive ?? true,
});

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN");

const titleCaseVi = (text = "") => {
  const normalized = String(text)
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi-VN");

  return normalized
    .split(" ")
    .map((word) =>
      word
        ? word.charAt(0).toLocaleUpperCase("vi-VN") + word.slice(1)
        : word,
    )
    .join(" ")
    .replace(/\bPoi\b/gi, "POI")
    .replace(/\bVnđ\b/gi, "VNĐ")
    .replace(/\bVip\b/gi, "VIP");
};

const prettyFeature = (feature) =>
  titleCaseVi(String(feature).replace(/[_-]/g, " "));

export const AdminSubscriptionDashboard = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await subscriptionApi.getSubscriptionPlansApi();
      setPlans((data || []).map(normalizePlan));
      setError(null);
    } catch (err) {
      console.error("Error fetching subscription plans:", err);
      setError(err?.response?.data || err.message);
      toast.error("Không thể tải danh sách gói đăng ký");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleEditClick = (plan) => {
    setEditingPlanId(plan.planId);
    setEditFormData({
      ...plan,
      featuresText: plan.features.join(", ")
    });
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async () => {
    try {
      // toast.loading("Đang lưu thay đổi...");
      // call API update here
      
      const updatedPlan = {
        ...editFormData,
        price: Number(editFormData.price),
        durationDay: Number(editFormData.durationDay),
        maxPoiCount: Number(editFormData.maxPoiCount),
        autoPriority: Number(editFormData.autoPriority),
        features: editFormData.featuresText.split(",").map(f => f.trim()).filter(Boolean)
      };

      setPlans(prevPlans => 
        prevPlans.map(p => p.planId === editingPlanId ? updatedPlan : p)
      );

      toast.success("Đã lưu thay đổi thành công!");
      setEditingPlanId(null);
    } catch (err) {
      toast.error("Có lỗi xảy ra khi lưu!");
      console.error(err);
    }
  };

 const handleTogglePlanStatus = async (plan) => {
  try {
    // GỌI API TOGGLE ĐÚNG
    const res =
      await subscriptionApi
        .toggleSubscriptionPlanStatusApi(
          plan.planId,
        );

    const updatedIsActive =
      res.isActive;

    // update local state
    setPlans((prevPlans) =>
      prevPlans.map((p) =>
        p.planId === plan.planId
          ? {
              ...p,
              isActive: updatedIsActive,
            }
          : p,
      ),
    );

    toast.success(
      updatedIsActive
        ? "Đã hiện gói!"
        : "Đã ẩn gói!",
    );
  } catch (err) {
    console.error(err);

    toast.error(
      "Không thể cập nhật trạng thái gói!",
    );
  }
};

  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => p.isActive).length;
  const inactivePlans = totalPlans - activePlans;

  return (
    <div className="p-8 bg-[#FDF8FA]/50 min-h-screen space-y-8 font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">QUẢN LÝ GÓI ĐĂNG KÝ</h1>
          <p className="text-gray-500 mt-1 font-medium">Quản lý các gói đăng ký VIP dành cho hạng mục nâng cao.</p>
        </div>

        <button
          onClick={() => {
            const newPlan = {
              planId: "NEW_PLAN_" + Date.now(),
              name: "Gói Mới",
              price: 0,
              durationDay: 30,
              maxPoiCount: 1,
              autoPriority: 1,
              features: [],
              isActive: true
            };
            setPlans([newPlan, ...plans]);
            handleEditClick(newPlan);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-[#D81B60] to-[#EC4899] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-pink-100 hover:scale-105 transition-all active:scale-95"
        >
          <Plus size={20} /> Tạo Gói Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[#8E707E] font-bold text-sm">TỔNG SỐ GÓI</p>
            <p className="text-3xl font-black text-gray-800 mt-1">{totalPlans}</p>
          </div>
          <div className="bg-[#FFF0F5] p-4 rounded-full text-[#EE4B8E]">
            <Package size={24} />
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-emerald-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[#8E707E] font-bold text-sm">ĐANG HOẠT ĐỘNG</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{activePlans}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-full text-emerald-500">
            <Activity size={24} />
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[#8E707E] font-bold text-sm">KHÔNG HOẠT ĐỘNG</p>
            <p className="text-3xl font-black text-gray-400 mt-1">{inactivePlans}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-full text-gray-400">
            <Archive size={24} />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#EE4B8E]" />
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.planId}
              className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden group hover:shadow-xl transition-all border-gray-100"
            >
              <div className="p-8 pt-6 space-y-4">
                {editingPlanId === plan.planId ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#8E707E] mb-1">MÃ GÓI</label>
                        <input 
                          type="text" 
                          name="planId"
                          value={editFormData.planId || ""} 
                          onChange={handleInputChange}
                          disabled
                          className="w-full px-3 py-2 bg-gray-100 rounded-xl text-gray-500 font-semibold"
                        />
                      </div>

                        <div>
                          <label className="block text-xs font-bold text-[#8E707E] mb-1">TÊN GÓI</label>
                          <input 
                            type="text" 
                            name="name"
                            value={editFormData.name || ""} 
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-[#FFF0F5] border-none rounded-xl outline-none text-[#8E707E] focus:ring-2 focus:ring-pink-200 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#8E707E] mb-1">GIÁ (VNĐ)</label>
                          <input 
                            type="number" 
                            name="price"
                            value={editFormData.price || 0} 
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-[#FFF0F5] border-none rounded-xl outline-none text-[#8E707E] focus:ring-2 focus:ring-pink-200 font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#8E707E] mb-1">THỜI HẠN (NGÀY)</label>
                          <input 
                            type="number" 
                            name="durationDay"
                            value={editFormData.durationDay || 0} 
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-[#FFF0F5] border-none rounded-xl outline-none text-[#8E707E] focus:ring-2 focus:ring-pink-200 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#8E707E] mb-1">POI TỐI ĐA (-1 LÀ KHÔNG GIỚI HẠN)</label>
                          <input 
                            type="number" 
                            name="maxPoiCount"
                            value={editFormData.maxPoiCount || 0} 
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-[#FFF0F5] border-none rounded-xl outline-none text-[#8E707E] focus:ring-2 focus:ring-pink-200 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#8E707E] mb-1">ƯU TIÊN</label>
                          <input 
                            type="number" 
                            name="autoPriority"
                            value={editFormData.autoPriority || 0} 
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-[#FFF0F5] border-none rounded-xl outline-none text-[#8E707E] focus:ring-2 focus:ring-pink-200 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#8E707E] mb-1">TÍNH NĂNG (GHI CÁCH NHAU BẰNG DẤU PHẨY)</label>
                        <textarea 
                          name="featuresText"
                          value={editFormData.featuresText || ""} 
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-3 py-2 bg-[#FFF0F5] border-none rounded-xl outline-none text-[#8E707E] focus:ring-2 focus:ring-pink-200"
                        />
                      </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <button 
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-[#8E707E] bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition flex items-center gap-2"
                      >
                        <X size={16} />Hủy
                      </button>
                      <button 
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-[#EE4B8E] hover:bg-[#D63A79] text-white rounded-xl font-semibold transition flex items-center gap-2"
                      >
                        <Check size={16} />Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-left">
                      {plan.isActive ? (
                        <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Đang hoạt động
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-500 border border-gray-200">
                          Chưa hoạt động
                        </div>  
                      )}
                      <span className="rounded-full bg-[#FFF0F5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#EE4B8E]">
                        {plan.planId}
                      </span>
                    </div>

                    <div className="text-left">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#D81B60] transition-colors line-clamp-1">{plan.name}</h3>
                      <div className="mt-2 flex items-end gap-1">
                        <span className="text-3xl font-black text-gray-900">{formatCurrency(plan.price)}</span>
                        <span className="text-sm font-semibold text-gray-500 pb-1">VNĐ</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between gap-4">
                      <div className="rounded-xl flex-1 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Thời hạn</p>
                        <p className="text-sm font-bold text-gray-700">{plan.durationDay} ngày</p>
                      </div>
                      <div className="rounded-xl flex-1 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">POI tối đa</p>
                        <p className="text-sm font-bold text-gray-700">
                          {plan.maxPoiCount === -1 ? "Không giới hạn" : plan.maxPoiCount}
                        </p>
                      </div>
                      <div className="rounded-xl flex-1 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Ưu tiên</p>
                        <p className="text-sm font-bold text-gray-700">{plan.autoPriority}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50">
                      <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Tính năng</p>
                      <div className="flex flex-wrap gap-2">
                        {plan.features.length > 0 ? (
                          plan.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-pink-50 px-3 py-1 text-[11px] font-bold text-[#EE4B8E]"
                            >
                              {prettyFeature(feature)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Chưa có tính năng nào</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                      <button
                        onClick={() => handleTogglePlanStatus(plan)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          plan.isActive
                            ? "bg-red-50 border-red-100 text-red-600 hover:bg-red-100"
                            : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {plan.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                        {plan.isActive ? "Ẩn Gói" : "Hiện Gói"}
                      </button>
                      <button
                        onClick={() => handleEditClick(plan)}
                        className="flex items-center justify-center gap-2 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold transition-all text-gray-600 hover:bg-[#FFF0F5] hover:text-[#EE4B8E] hover:border-pink-200 cursor-pointer"
                      >
                        <Edit2 size={16} />
                        Sửa Gói
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-pink-200 px-6 py-16 text-center text-[#8E707E]">
          Hiện không có gói đăng ký nào.
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionDashboard;
