import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Upload,
  X,
  Loader2,
  Search,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

import { uploadImage } from "@/api/mediaApi";
import { getAllPOIs } from "@/api/poiApi";

const CreateTourModal = ({ open, onClose, onSubmit, isLoading }) => {
  const fileInputRef = useRef(null);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [allPOIs, setAllPOIs] = useState([]);
  const [poiSearchTerm, setPoiSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    thumbnailUrl: "",
    selectedPOIs: [],
  });

  // Fetch all POIs when modal opens
  useEffect(() => {
    if (open) {
      fetchPOIs();
    }
  }, [open]);

  const fetchPOIs = async () => {
    try {
      setIsLoadingPOIs(true);
      const pois = await getAllPOIs();
      setAllPOIs(pois || []);
    } catch (err) {
      console.error("Error fetching POIs:", err);
      toast.error("Lỗi khi tải danh sách địa điểm");
    } finally {
      setIsLoadingPOIs(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    try {
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);

      const imageUrl = await uploadImage(file, "tours");
      setFormData({ ...formData, thumbnailUrl: imageUrl });
      toast.success("Tải ảnh lên thành công!");
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Lỗi khi tải ảnh lên");
      setThumbnailPreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setThumbnailPreview(null);
    setFormData({ ...formData, thumbnailUrl: "" });
    setIsUploadingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTogglePOI = (poiId) => {
    setFormData((prev) => {
      const isSelected = prev.selectedPOIs.includes(poiId);
      return {
        ...prev,
        selectedPOIs: isSelected
          ? prev.selectedPOIs.filter((id) => id !== poiId)
          : [...prev.selectedPOIs, poiId],
      };
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên Tour");
      return;
    }

    onSubmit({
      name: formData.name,
      description: formData.description,
      thumbnailUrl: formData.thumbnailUrl,
      selectedPOIs: formData.selectedPOIs,
    });

    // Reset form
    setFormData({
      name: "",
      description: "",
      thumbnailUrl: "",
      selectedPOIs: [],
    });
    setThumbnailPreview(null);
    setPoiSearchTerm("");
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      thumbnailUrl: "",
      selectedPOIs: [],
    });
    setThumbnailPreview(null);
    setPoiSearchTerm("");
    setIsUploadingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const filteredPOIs = allPOIs.filter((poi) => {
    const poiName = poi.name || poi.Name || "N/A";
    const categories = poi.categories || (poi.category ? [poi.category] : []);
    const search = poiSearchTerm.toLowerCase();
    return poiName.toLowerCase().includes(search) || categories.some(c => c?.toLowerCase().includes(search));
  });

  const selectedPOICount = formData.selectedPOIs.length;

  if (!open) return null;

  return createPortal(
    <>
      {/* MODAL BACKDROP */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-150"
        onClick={handleClose}
      />

      {/* MODAL CONTAINER */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
            {/* HEADER */}
            <div className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-6 border-b border-gray-100">
              <h2 className="text-xl sm:text-2xl font-black text-gray-800">Tạo Tour Mới</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4 sm:py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* COLUMN 1: Tour Info */}
                <div className="space-y-4">
                  {/* Tên Tour */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Tên Tour
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tour Hải Sản 1"
                      className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-pink-100 font-bold"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  {/* Mô tả */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Mô tả
                    </label>
                    <textarea
                      placeholder="Mô tả ngắn về trải nghiệm..."
                      className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-pink-100 h-24 resize-none"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  {/* Ảnh Thumbnail */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Ảnh Thumbnail
                    </label>
                    {thumbnailPreview ? (
                      <div className="relative">
                        <img
                          src={thumbnailPreview}
                          alt="preview"
                          className="w-full h-48 object-cover rounded-xl border-2 border-pink-100"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-pink-300 hover:bg-pink-50/30 transition-all flex flex-col items-center justify-center gap-3"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2
                              className="animate-spin text-pink-500"
                              size={32}
                            />
                            <span className="text-sm font-bold text-gray-600">
                              Đang tải ảnh...
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="text-gray-400" size={32} />
                            <span className="text-sm font-bold text-gray-600">
                              Nhấp để chọn ảnh hoặc kéo thả
                            </span>
                            <span className="text-xs text-gray-400">
                              PNG, JPG, GIF tối đa 10MB
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={isUploadingImage}
                    />
                  </div>
                </div>

                {/* COLUMN 2: POI Selection */}
                <div className="space-y-3 border-l border-gray-200 pl-8">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span>Địa điểm (POI)</span>
                      </div>
                      <span className="bg-pink-100 text-pink-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {selectedPOICount} đã chọn
                      </span>
                    </label>

                    {/* POI Search */}
                    <div className="mb-3">
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Tìm kiếm theo tên hoặc danh mục..."
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-pink-100 font-medium"
                          value={poiSearchTerm}
                          onChange={(e) => setPoiSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* POI List */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                        {isLoadingPOIs ? (
                          <div className="p-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={16} />
                            Đang tải...
                          </div>
                        ) : filteredPOIs.length === 0 ? (
                          <div className="p-4 text-center text-gray-400 text-sm">
                            Không tìm thấy địa điểm
                          </div>
                        ) : (
                          filteredPOIs.map((poi) => {
                            const isSelected = formData.selectedPOIs.includes(poi.poiId || poi.id);
                            const logoUrl = poi.logoUrl || poi.thumbnailUrl || poi.LogoUrl;
                            const poiName = poi.name || poi.Name || "N/A";
                            const categories = poi.categories || (poi.category ? [poi.category] : []);

                            return (
                              <button
                                key={poi.poiId || poi.id}
                                type="button"
                                onClick={() => handleTogglePOI(poi.poiId || poi.id)}
                                className={`w-full text-left p-3 hover:bg-pink-50/60 transition-all flex items-center gap-3 ${
                                  isSelected ? "bg-pink-50/40" : ""
                                }`}
                              >
                                {/* Thumbnail / Logo */}
                                {logoUrl ? (
                                  <img
                                    src={logoUrl}
                                    alt={poiName}
                                    className="w-10 h-10 rounded-lg object-cover border border-pink-100 shrink-0 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-pink-400 font-bold text-xs shrink-0 border border-pink-200">
                                    {poiName?.charAt(0)?.toUpperCase() || "P"}
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-xs text-gray-800 truncate">
                                    {poiName}
                                  </p>
                                  {categories.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                      {categories.map((c, i) => (
                                        <span key={i} className="text-[9px] bg-pink-100 text-pink-700 px-1.5 py-0.2 rounded-full font-semibold">
                                          {c}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div
                                  className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "bg-pink-500 border-pink-500 text-white"
                                      : "border-gray-300 bg-white"
                                  }`}
                                >
                                  {isSelected && <Check size={13} className="stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-end gap-3 px-5 sm:px-8 py-4 sm:py-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleClose}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-gray-600 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all text-xs sm:text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#D81B60] to-[#EC4899] text-white rounded-xl font-bold shadow-lg shadow-pink-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 text-xs sm:text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo ngay"
                )}
              </button>
            </div>
          </div>
        </div>
    </>,
    document.body
  );
};

export default CreateTourModal;
