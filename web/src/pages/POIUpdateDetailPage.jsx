import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, X, Check, MapPin, Zap, Layers, FileText, Volume2, Globe } from "lucide-react"
import toast from "react-hot-toast"
import { getPoiDetail } from "@/api/poiApi"
import { getPoiRequestDetail, reviewPoiRequest } from "@/api/poiRequestApi"
import { getCategoriesApi } from "@/api/categoryApi"
import ConfirmModal from "@/components/ConfirmModal"
import { formatPriority } from "@/components/PriorityBadge"

// Bug #4: chuẩn hóa null/undefined/"" về "" để so sánh audio đúng
const normalizeAudio = (v) => (v == null ? "" : v.trim())
const isDifferent    = (old, new_) => old !== new_
const isAudioChanged = (oldAudio, newAudio) => normalizeAudio(oldAudio) !== normalizeAudio(newAudio)

// Bug #4: label diff cho audio
const getAudioDiffLabel = (oldAudio, newAudio) => {
  const o = normalizeAudio(oldAudio)
  const n = normalizeAudio(newAudio)
  if (!o && n)   return "⬆ Thêm mới"
  if (o  && !n)  return "⬇ Xóa bỏ"
  if (o  &&  n)  return "↕ Thay đổi"
  return null
}

// Hiển thị tên ngôn ngữ đầy đủ từ languageCode
const LANGUAGE_LABELS = {
  vi: "🇻🇳 Tiếng Việt",
  en: "🇬🇧 English",
  zh: "🇨🇳 中文",
  ja: "🇯🇵 日本語",
  ko: "🇰🇷 한국어",
  fr: "🇫🇷 Français",
  de: "🇩🇪 Deutsch",
}
const formatLanguage = (code) =>
  LANGUAGE_LABELS[code?.toLowerCase()] ?? (code || "—")

// Info Card Component
const InfoCard = ({ icon: Icon, label, value, isChanged = false }) => (
  <div className={`p-4 rounded-lg border transition ${
    isChanged 
      ? "bg-amber-50 border-amber-200" 
      : "bg-gray-50 border-gray-200 hover:border-gray-300"
  }`}>
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${isChanged ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
          {label}
        </label>
        <p className={`text-sm break-words ${isChanged ? "font-bold text-amber-900" : "text-gray-700"}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  </div>
)

// Section Component
const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
      ✓ {title}
    </h3>
    <div className="space-y-3">
      {children}
    </div>
  </div>
)

export default function POIUpdateDetailPage() {
  const { id: requestId } = useParams()
  const navigate = useNavigate()
  const [oldPoi, setOldPoi] = useState(null)
  const [newPoi, setNewPoi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoryMap, setCategoryMap] = useState({}) // id → name
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    const fetchPoiDetail = async () => {
      try {
        setLoading(true)

        // Fetch tất cả cùng lúc
        const [request, categoriesRaw] = await Promise.all([
          getPoiRequestDetail(requestId),
          getCategoriesApi()
        ])
        console.log("Request:", request)

        // Build categoryMap: id → name
        const catMap = {}
        ;(categoriesRaw || []).forEach(c => {
          catMap[c.categoryId] = c.name
        })
        setCategoryMap(catMap)

        // Fetch POI detail (current data)
        const poiDetail = await getPoiDetail(request.poiId)
        console.log("POI Detail:", poiDetail)

        // Parse proposed data
        let proposedData = {}
        if (request.proposedData) {
          proposedData = typeof request.proposedData === 'string'
            ? JSON.parse(request.proposedData)
            : request.proposedData
        }
        console.log("Proposed Data:", proposedData)

        // ── OLD: lấy từ database ──────────────────────────────────────────
        const masterContent  = poiDetail.contents?.find(c => c.isMaster)
        const oldCategoryId  = poiDetail.categoryIds?.[0] || ""
        // Ngôn ngữ của master content (bản mà owner đã chọn làm nội dung chính)
        const oldLanguageCode = masterContent?.languageCode || ""

        const oldPoiFormatted = {
          id: poiDetail.poiId,
          name: masterContent?.title || "Không có tên",
          categoryId: oldCategoryId,
          categoryName: catMap[oldCategoryId] || poiDetail.category || "Không xác định",
          description: masterContent?.description || "",
          latitude: String(poiDetail.latitude || ""),
          longitude: String(poiDetail.longitude || ""),
          priority: Number(poiDetail.priority ?? 2),
          // Hiển thị ngôn ngữ của master content
          language: oldLanguageCode,
          audio: normalizeAudio(masterContent?.audioUrl),
          images: (() => {
            const gallery = poiDetail.gallery?.map(g => g.imageUrl) || []
            const logo = poiDetail.logoUrl
            if (logo) return [logo, ...gallery.filter(u => u !== logo)]
            return gallery
          })(),
        }

        // ── NEW: lấy từ proposedData ─────────────────────────────────────
        const newCategoryId = proposedData.CategoryIds?.[0] ?? oldCategoryId
        // LanguageCode từ proposedData — AddPOI & Update đều gửi LanguageCode
        const newLanguageCode = proposedData.LanguageCode ?? oldLanguageCode

        const newPoiFormatted = {
          id: proposedData.poiId || oldPoiFormatted.id,
          name: proposedData.Title ?? oldPoiFormatted.name,
          categoryId: newCategoryId,
          categoryName: catMap[newCategoryId] || oldPoiFormatted.categoryName,
          description: proposedData.Description ?? oldPoiFormatted.description,
          latitude: proposedData.Latitude != null ? String(proposedData.Latitude) : oldPoiFormatted.latitude,
          longitude: proposedData.Longitude != null ? String(proposedData.Longitude) : oldPoiFormatted.longitude,
          priority: proposedData.Priority != null ? Number(proposedData.Priority) : oldPoiFormatted.priority,
          language: newLanguageCode,
          audio: proposedData.AudioUrl !== undefined
            ? normalizeAudio(proposedData.AudioUrl)
            : oldPoiFormatted.audio,
          images: proposedData.GalleryImageUrls ?? oldPoiFormatted.images,
        }

        setOldPoi(oldPoiFormatted)
        setNewPoi(newPoiFormatted)
      } catch (err) {
        console.error("Load POI detail error:", err)
        setError("Không thể tải dữ liệu. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    if (requestId) {
      fetchPoiDetail()
    }
  }, [requestId])

  const handleApprove = () => {
    setShowApproveModal(true)
  }

  const handleConfirmApprove = async () => {
    try {
      await reviewPoiRequest(requestId, { approved: true })
      setShowApproveModal(false)
      toast.success("Cập nhật đã được phê duyệt")  // Bug #7
      navigate("/poi/management/updates")
    } catch (err) {
      console.error("Approve error:", err)
      toast.error("Lỗi khi phê duyệt: " + err.message)  // Bug #7
    }
  }

  const handleReject = () => {
    setRejectReason("")
    setShowRejectModal(true)
  }

  const handleConfirmReject = async () => {
    try {
      await reviewPoiRequest(requestId, {
        approved: false,
        rejectReason: rejectReason
      })
      setShowRejectModal(false)
      setRejectReason("")
      toast.success("Cập nhật đã bị từ chối")  // Bug #7
      navigate("/poi/management/updates")
    } catch (err) {
      console.error("Reject error:", err)
      toast.error("Lỗi khi từ chối: " + err.message)  // Bug #7
    }
  }

  const handleRequestChanges = async () => {
    try {
      await reviewPoiRequest(requestId, {
        approved: false,
        rejectReason: "Yêu cầu sửa lại"
      })
      toast.success("Yêu cầu sửa lại đã được gửi")  // Bug #7
      navigate("/poi/management/updates")
    } catch (err) {
      console.error("Request changes error:", err)
      toast.error("Lỗi: " + err.message)  // Bug #7
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Đang tải...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {error}
      </div>
    )
  }

  if (!oldPoi || !newPoi) {
    return (
      <div className="p-6 text-center text-gray-500">
        Không tìm thấy dữ liệu
      </div>
    )
  }

  // Fix: đếm trường thay đổi dùng các key semantic đúng
  const changedFields = [
    oldPoi.name !== newPoi.name ? 1 : 0,
    oldPoi.categoryId !== newPoi.categoryId ? 1 : 0,
    (oldPoi.latitude !== newPoi.latitude || oldPoi.longitude !== newPoi.longitude) ? 1 : 0,
    oldPoi.priority !== newPoi.priority ? 1 : 0,
    oldPoi.language !== newPoi.language ? 1 : 0,
    isAudioChanged(oldPoi.audio, newPoi.audio) ? 1 : 0,
    oldPoi.description !== newPoi.description ? 1 : 0,
    JSON.stringify(oldPoi.images) !== JSON.stringify(newPoi.images) ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen pb-32">
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate("/poi/management/updates")}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Xem xét yêu cầu cập nhật POI
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Kiểm tra các thay đổi được đề xuất trước khi phê duyệt
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* POI HEADER CARD */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-6 border-l-4 border-pink-500">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-xs uppercase font-bold text-gray-500 mb-1">Tên địa điểm</p>
              <h2 className="text-2xl font-bold text-gray-900">{oldPoi.name}</h2>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-gray-500 mb-1">Trạng thái</p>
              <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                ⏱ Chờ xử lý
              </span>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-gray-500 mb-1">Dự kiến thay đổi</p>
              <span className="text-2xl font-bold text-amber-600">{changedFields} trường</span>
            </div>
          </div>
        </div>

        {/* TWO COLUMN COMPARISON */}
        <div className="grid grid-cols-2 gap-6">
          {/* LEFT COLUMN - POI HIỆN TẠI */}
          <div className="space-y-12">
            <div className="bg-white rounded-2xl shadow-md p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b-2 border-blue-200">
                📋 POI Hiện Tại
              </h3>

              <div className="space-y-9">
              <Section title="Thông tin cơ bản">
                <InfoCard 
                  icon={FileText}
                  label="Tên địa điểm"
                  value={oldPoi.name}
                  isChanged={isDifferent(oldPoi.name, newPoi.name)}
                />
                <InfoCard 
                  icon={Layers}
                  label="Danh mục"
                  value={oldPoi.categoryName}
                  isChanged={isDifferent(oldPoi.categoryId, newPoi.categoryId)}
                />
                <InfoCard 
                  icon={MapPin}
                  label="Vị trí (Lat/Lng)"
                  value={`${oldPoi.latitude}, ${oldPoi.longitude}`}
                  isChanged={isDifferent(oldPoi.latitude, newPoi.latitude) || isDifferent(oldPoi.longitude, newPoi.longitude)}
                />
                <InfoCard 
                  icon={Zap}
                  label="Độ ưu tiên"
                  value={formatPriority(oldPoi.priority)}
                  isChanged={isDifferent(oldPoi.priority, newPoi.priority)}
                />
              </Section>

              <Section title="Nội dung đa phương tiện">
                <InfoCard 
                  icon={Globe}
                  label="Ngôn ngữ"
                  value={formatLanguage(oldPoi.language)}
                  isChanged={isDifferent(oldPoi.language, newPoi.language)}
                />
                {/* Bug #4: audio diff card (OLD) */}
                <div className={`p-4 rounded-lg border transition ${
                  isAudioChanged(oldPoi.audio, newPoi.audio)
                    ? "bg-amber-50 border-amber-200"
                    : "bg-gray-50 border-gray-200"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isAudioChanged(oldPoi.audio, newPoi.audio)
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      <Volume2 size={20} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                        File audio
                      </label>
                      {oldPoi.audio ? (
                        <audio controls className="w-full h-10 rounded">
                          <source src={oldPoi.audio} type="audio/mpeg" />
                          Trình duyệt của bạn không hỗ trợ audio
                        </audio>
                      ) : (
                        <p className="text-sm text-gray-500">Không có file audio</p>
                      )}
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Mô tả">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {oldPoi.description}
                  </p>
                </div>
              </Section>

              <Section title="Hình ảnh">
                <div className="flex gap-2 flex-wrap">
                  {oldPoi.images?.length > 0 ? oldPoi.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img}
                        alt={`Ảnh ${idx + 1}`}
                        className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                        onError={(e) => { e.target.src = "https://placehold.co/96x96?text=Err" }}
                      />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-blue-500 text-white text-[9px] font-bold px-1 rounded">Logo</span>
                      )}
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 italic">Chưa có hình ảnh</p>
                  )}
                </div>
              </Section>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - DỮ LIỆU ĐỀ XUẤT */}
          <div className="space-y-12">
            <div className="bg-white rounded-2xl shadow-md p-8 ring-2 ring-amber-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-200">
                ✨ Dữ liệu đề xuất
              </h3>

              <div className="space-y-9">
              <Section title="Thông tin cơ bản">
                <InfoCard 
                  icon={FileText}
                  label="Tên địa điểm"
                  value={newPoi.name}
                  isChanged={isDifferent(oldPoi.name, newPoi.name)}
                />
                <InfoCard 
                  icon={Layers}
                  label="Danh mục"
                  value={newPoi.categoryName}
                  isChanged={isDifferent(oldPoi.categoryId, newPoi.categoryId)}
                />
                <InfoCard 
                  icon={MapPin}
                  label="Vị trí (Lat/Lng)"
                  value={`${newPoi.latitude}, ${newPoi.longitude}`}
                  isChanged={isDifferent(oldPoi.latitude, newPoi.latitude) || isDifferent(oldPoi.longitude, newPoi.longitude)}
                />
                <InfoCard 
                  icon={Zap}
                  label="Độ ưu tiên"
                  value={formatPriority(newPoi.priority)}
                  isChanged={isDifferent(oldPoi.priority, newPoi.priority)}
                />
              </Section>

              <Section title="Nội dung đa phương tiện">
                <InfoCard 
                  icon={Globe}
                  label="Ngôn ngữ"
                  value={formatLanguage(newPoi.language)}
                  isChanged={isDifferent(oldPoi.language, newPoi.language)}
                />
                {/* Bug #4: audio diff card (NEW) */}
                <div className={`p-4 rounded-lg border transition ${
                  isAudioChanged(oldPoi.audio, newPoi.audio)
                    ? "bg-amber-50 border-amber-300"
                    : "bg-blue-50 border-blue-200"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isAudioChanged(oldPoi.audio, newPoi.audio)
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-600"
                    }`}>
                      <Volume2 size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          File audio
                        </label>
                        {/* Bug #4: hiện label diff */}
                        {getAudioDiffLabel(oldPoi.audio, newPoi.audio) && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 uppercase">
                            {getAudioDiffLabel(oldPoi.audio, newPoi.audio)}
                          </span>
                        )}
                      </div>
                      {newPoi.audio ? (
                        <audio controls className="w-full h-10 rounded">
                          <source src={newPoi.audio} type="audio/mpeg" />
                          Trình duyệt của bạn không hỗ trợ audio
                        </audio>
                      ) : (
                        <p className="text-sm text-gray-500">Không có file audio (đã xóa)</p>
                      )}
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Mô tả">
                <div className={`border-2 rounded-lg p-4 transition ${
                  isDifferent(oldPoi.description, newPoi.description)
                    ? "bg-amber-50 border-amber-300"
                    : "bg-blue-50 border-blue-200"
                }`}>
                  <p className={`text-sm leading-relaxed ${
                    isDifferent(oldPoi.description, newPoi.description)
                      ? "font-bold text-amber-900"
                      : "text-gray-700"
                  }`}>
                    {newPoi.description}
                  </p>
                </div>
              </Section>

              <Section title={`Hình ảnh (${newPoi.images?.length || 0})`}>
                <div className="flex gap-2 flex-wrap">
                  {newPoi.images?.length > 0 ? newPoi.images.map((img, idx) => {
                    const isImgChanged = !oldPoi.images?.includes(img)
                    return (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Ảnh ${idx + 1}`}
                          className={`w-24 h-24 object-cover rounded-xl border-2 shadow-sm ${
                            isImgChanged ? "border-amber-400" : "border-gray-200"
                          }`}
                          onError={(e) => { e.target.src = "https://placehold.co/96x96?text=Err" }}
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1 rounded">Logo</span>
                        )}
                        {isImgChanged && (
                          <span className="absolute top-1 right-1 bg-green-500 text-white text-[9px] font-bold px-1 rounded">Mới</span>
                        )}
                      </div>
                    )
                  }) : (
                    <p className="text-sm text-gray-400 italic">Chưa có hình ảnh</p>
                  )}
                </div>
              </Section>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl">
        <div className="p-6 max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">Thay đổi:</span> {changedFields} trường
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition font-semibold shadow-md hover:shadow-lg"
            >
              <X size={18} />
              Từ chối
            </button>
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 transition font-semibold shadow-md hover:shadow-lg"
            >
              <Check size={18} />
              Chấp nhận
            </button>
          </div>
        </div>
      </div>

      {/* APPROVE MODAL */}
      {showApproveModal && (
        <ConfirmModal
          open={showApproveModal}
          title="Xác nhận phê duyệt?"
          message="Bạn có chắc chắn muốn phê duyệt cập nhật POI này không?"
          confirmText="Phê duyệt"
          cancelText="Hủy bỏ"
          onConfirm={handleConfirmApprove}
          onCancel={() => setShowApproveModal(false)}
        />
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <ConfirmModal
          open={showRejectModal}
          title="Xác nhận từ chối?"
          message={
            <div>
              <p>Bạn có chắc chắn muốn từ chối cập nhật POI này không?</p>
              <textarea
                className="w-full mt-3 p-2 border rounded text-gray-700"
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          }
          confirmText="Từ chối"
          cancelText="Hủy bỏ"
          onConfirm={handleConfirmReject}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
    </div>
  )
}
