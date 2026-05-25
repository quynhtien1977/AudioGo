import { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  Package,
  Activity,
  Archive,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import * as subscriptionApi from "@/api/subscriptionApi";
import PageHeader from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";

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

export const AdminSubscriptionDashboard = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isCreating, setIsCreating] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);

      const data =
        await subscriptionApi.getSubscriptionPlansApi();

      setPlans((data || []).map(normalizePlan));

      setError(null);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data || err.message,
      );

      toast.error(
        "Không thể tải danh sách gói đăng ký",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const getPriorityLabel = (priority) => {
    switch (Number(priority)) {
      case 1:
        return "Thấp";
      case 2:
        return "Trung Bình Thấp";
      case 3:
        return "Cao";
      case 4:
        return "Cao Nhất";
      default:
        return "Không xác định";
    }
  };

  const handleEditClick = (plan) => {
    setIsCreating(false);

    setEditingPlanId(plan.planId);

    setEditFormData({
      ...plan,
    });
  };

  const handleCreateClick = () => {
    const tempPlan = {
      planId: "",
      name: "",
      price: 0,
      durationDay: 30,
      maxPoiCount: 1,
      autoPriority: 1,
      features: [],
      isActive: true,
    };

    setIsCreating(true);

    setEditingPlanId("NEW_PLAN");

    setEditFormData(tempPlan);
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setEditFormData({});
    setIsCreating(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (
      [
        "price",
        "durationDay",
        "maxPoiCount",
        "autoPriority",
      ].includes(name)
    ) {
      if (value.includes("-")) return;

      setEditFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      return;
    }

    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async () => {
  try {
    // =========================
    // AUTO GENERATE PLAN ID
    // =========================
    const generatedPlanId = isCreating
      ? `plan_${Date.now()}`
      : editFormData.planId;

    const payload = {
      planId: generatedPlanId,

      name: editFormData.name?.trim(),

      price: Math.max(
        0,
        Number(editFormData.price || 0),
      ),

      durationDay: Math.max(
        1,
        Number(editFormData.durationDay || 1),
      ),

      maxPoiCount: Math.max(
        0,
        Number(editFormData.maxPoiCount || 0),
      ),

      autoPriority: Math.min(
        4,
        Math.max(
          1,
          Number(editFormData.autoPriority || 1),
        ),
      ),

      features: [
        `Sở hữu tối đa ${Number(editFormData.maxPoiCount || 0)} POI`,
        `Mức ưu tiên: ${getPriorityLabel(editFormData.autoPriority)}`,
      ],

      isActive:
        editFormData.isActive ?? true,
    };

    // =========================
    // VALIDATION
    // =========================
    if (!payload.name) {
      toast.error(
        "Tên gói không được để trống!",
      );
      return;
    }

    const toastId =
      toast.loading("Đang lưu dữ liệu...");

    let response;

    // =========================
    // CREATE NEW PLAN
    // =========================
    if (isCreating) {
      response =
        await subscriptionApi.createSubscriptionPlanApi(
          payload,
        );

      const normalizedPlan =
        normalizePlan(response);

      setPlans((prev) => [
        normalizedPlan,
        ...prev,
      ]);

      toast.success(
        "Tạo gói thành công!",
        {
          id: toastId,
        },
      );
    }

    // =========================
    // UPDATE EXISTING PLAN
    // =========================
    else {
      response =
        await subscriptionApi.updateSubscriptionPlanApi(
          payload.planId,
          payload,
        );

      const normalizedPlan =
        normalizePlan(response);

      setPlans((prevPlans) =>
        prevPlans.map((p) =>
          p.planId ===
          normalizedPlan.planId
            ? normalizedPlan
            : p,
        ),
      );

      toast.success(
        "Cập nhật gói thành công!",
        {
          id: toastId,
        },
      );
    }

    setEditingPlanId(null);
    setEditFormData({});
    setIsCreating(false);
  } catch (err) {
    console.error(err);

    toast.error(
      err?.response?.data?.message ||
        err?.response?.data ||
        "Có lỗi xảy ra!",
    );
  }
};

  const handleTogglePlanStatus = async (
    plan,
  ) => {
    try {
      const res =
        await subscriptionApi.toggleSubscriptionPlanStatusApi(
          plan.planId,
        );

      const updatedIsActive =
        res.isActive;

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

  const activePlans = plans.filter(
    (p) => p.isActive,
  ).length;

  const inactivePlans =
    totalPlans - activePlans;

  const displayPlans = editingPlanId === "NEW_PLAN"
    ? [{ planId: "NEW_PLAN" }, ...plans]
    : plans;

  return (
    <div className="space-y-6">
      <PageHeader
        title="QUẢN LÝ GÓI ĐĂNG KÝ"
        description="Quản lý các gói đăng ký VIP cho đối tác và người dùng."
        icon={<Package size={24} />}
        actionButton={
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-pink-100 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-sm cursor-pointer"
          >
            <Plus size={18} />
            <span>Tạo Gói Mới</span>
          </button>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm font-semibold rounded-2xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="TỔNG SỐ GÓI"
          value={totalPlans}
          sub="Tất cả các gói VIP"
          icon={<Package size={20} />}
        />
        <StatsCard
          title="ĐANG HOẠT ĐỘNG"
          value={activePlans}
          sub="Các gói đang hoạt động"
          color="text-emerald-600"
          icon={<Activity size={20} />}
        />
        <StatsCard
          title="KHÔNG HOẠT ĐỘNG"
          value={inactivePlans}
          sub="Các gói đã bị ẩn"
          color="text-gray-400"
          icon={<Archive size={20} />}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-pink-500 bg-white rounded-2xl border border-pink-100/30 shadow-sm animate-fadeIn">
          <Loader2 className="animate-spin mb-3" size={32} />
          <p className="text-sm font-semibold text-gray-700">Đang tải danh sách gói đăng ký...</p>
        </div>
      ) : displayPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-pink-100/30 shadow-sm animate-fadeIn">
          <Package size={48} className="text-pink-200 mb-3 animate-pulse" />
          <h3 className="text-base font-bold text-gray-700">Không tìm thấy gói đăng ký nào</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Hiện chưa có gói đăng ký nào được cấu hình trong hệ thống. Hãy bấm nút "Tạo Gói Mới" ở góc phải để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayPlans.map((plan) => (
            <div
              key={plan.planId}
              className={`bg-white rounded-[2.5rem] border shadow-sm overflow-hidden group transition-all ${
                plan.isActive
                  ? "border-gray-100 hover:shadow-xl"
                  : "border-gray-200 opacity-60 grayscale"
              }`}
            >
              <div className="p-8 pt-6 space-y-4">
                {editingPlanId ===
                plan.planId ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#8E707E] mb-1">
                          TÊN GÓI
                        </label>

                        <input
                          type="text"
                          name="name"
                          value={
                            editFormData.name || ""
                          }
                          onChange={
                            handleInputChange
                          }
                          className="w-full px-3 py-2 bg-[#FFF0F5] rounded-xl outline-none text-[#8E707E] focus:ring-2 focus:ring-pink-200 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#8E707E] mb-1">
                          GIÁ (VNĐ)
                        </label>

                        <input
                          type="number"
                          name="price"
                          min={0}
                          value={
                            editFormData.price ??
                            ""
                          }
                          onChange={
                            handleInputChange
                          }
                          className="w-full px-3 py-2 bg-[#FFF0F5] rounded-xl outline-none text-[#8E707E] focus:ring-2 focus:ring-pink-200 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#8E707E] mb-1">
                          THỜI HẠN
                        </label>

                        <input
                          type="number"
                          min={1}
                          name="durationDay"
                          value={
                            editFormData.durationDay ??
                            ""
                          }
                          onChange={
                            handleInputChange
                          }
                          className="w-full px-3 py-2 bg-[#FFF0F5] rounded-xl outline-none text-[#8E707E] focus:ring-2 focus:ring-pink-200 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#8E707E] mb-1">
                          POI
                        </label>

                        <input
                          type="number"
                          min={1}
                          name="maxPoiCount"
                          value={
                            editFormData.maxPoiCount ??
                            ""
                          }
                          onChange={
                            handleInputChange
                          }
                          className="w-full px-3 py-2 bg-[#FFF0F5] rounded-xl outline-none text-[#8E707E] focus:ring-2 focus:ring-pink-200 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#8E707E] mb-1">
                          ƯU TIÊN
                        </label>

                        <select
                          name="autoPriority"
                          value={
                            editFormData.autoPriority ??
                            1
                          }
                          onChange={
                            handleInputChange
                          }
                          className="w-full px-3 py-2 bg-[#FFF0F5] rounded-xl outline-none text-[#8E707E] focus:ring-2 focus:ring-pink-200 font-bold"
                        >
                          <option value={1}>
                            Thấp
                          </option>

                          <option value={2}>
                            Trung Bình Thấp
                          </option>

                          <option value={3}>
                            Cao
                          </option>

                          <option value={4}>
                            Cao Nhất
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={
                          handleCancelEdit
                        }
                        className="px-4 py-2 text-[#8E707E] bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition flex items-center gap-2"
                      >
                        <X size={16} />
                        Hủy
                      </button>

                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-[#EE4B8E] hover:bg-[#D63A79] text-white rounded-xl font-semibold transition flex items-center gap-2"
                      >
                        <Check size={16} />
                        Lưu
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
                    </div>

                    <div className="text-left">
                      <h3 className="text-xl font-bold text-gray-800">
                        {plan.name}
                      </h3>

                      <div className="mt-2 flex items-end gap-1">
                        <span className="text-3xl font-black text-gray-900">
                          {formatCurrency(
                            plan.price,
                          )}
                        </span>

                        <span className="text-sm font-semibold text-gray-500 pb-1">
                          VNĐ
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                          Thời hạn
                        </p>

                        <p className="text-sm font-bold text-gray-700">
                          {plan.durationDay} ngày
                        </p>
                      </div>

                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                          POI tối đa
                        </p>

                        <p className="text-sm font-bold text-gray-700">
                          {plan.maxPoiCount}
                        </p>
                      </div>

                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                          Ưu tiên
                        </p>

                        <p className="text-sm font-bold text-gray-700">
                          {getPriorityLabel(
                            plan.autoPriority,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                      <button
                        onClick={() =>
                          handleTogglePlanStatus(
                            plan,
                          )
                        }
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          plan.isActive
                            ? "bg-red-50 border-red-100 text-red-600 hover:bg-red-100"
                            : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {plan.isActive ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}

                        {plan.isActive
                          ? "Ẩn Gói"
                          : "Hiện Gói"}
                      </button>

                      <button
                        onClick={() =>
                          handleEditClick(plan)
                        }
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
      )}
    </div>
  );
};

export default AdminSubscriptionDashboard;