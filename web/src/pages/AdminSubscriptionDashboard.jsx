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
} from "lucide-react";
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

  return (
    <div className="p-8 bg-[#FDF8FA]/50 min-h-screen space-y-8 font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            QUẢN LÝ GÓI ĐĂNG KÝ
          </h1>

          <p className="text-gray-500 mt-1 font-medium">
            Quản lý các gói đăng ký VIP.
          </p>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 bg-gradient-to-r from-[#D81B60] to-[#EC4899] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-pink-100 hover:scale-105 transition-all active:scale-95"
        >
          <Plus size={20} />
          Tạo Gói Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[#8E707E] font-bold text-sm">
              TỔNG SỐ GÓI
            </p>

            <p className="text-3xl font-black text-gray-800 mt-1">
              {totalPlans}
            </p>
          </div>

          <div className="bg-[#FFF0F5] p-4 rounded-full text-[#EE4B8E]">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-emerald-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[#8E707E] font-bold text-sm">
              ĐANG HOẠT ĐỘNG
            </p>

            <p className="text-3xl font-black text-emerald-600 mt-1">
              {activePlans}
            </p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-full text-emerald-500">
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[#8E707E] font-bold text-sm">
              KHÔNG HOẠT ĐỘNG
            </p>

            <p className="text-3xl font-black text-gray-400 mt-1">
              {inactivePlans}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-full text-gray-400">
            <Archive size={24} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#EE4B8E]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(editingPlanId === "NEW_PLAN"
            ? [
                {
                  planId: "NEW_PLAN",
                },
                ...plans,
              ]
            : plans
          ).map((plan) => (
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