import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, MessageSquare, X, Check, MapPin, Zap, Layers, FileText, Volume2, Globe } from "lucide-react"

// Helper to check if values are different
const isDifferent = (old, new_) => old !== new_

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
  const { id } = useParams()
  const navigate = useNavigate()
  const [oldPoi, setOldPoi] = useState(null)
  const [newPoi, setNewPoi] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch POI detailed info từ API
    // const fetchPoiDetail = async () => {
    //   try {
    //     setLoading(true)
    //     const res = await getPoiUpdateDetailApi(id)
    //     setOldPoi(res.current)
    //     setNewPoi(res.proposed)
    //   } catch (err) {
    //     console.error("Load POI detail error:", err)
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    // fetchPoiDetail()

    // Mock data
    setOldPoi({
      id: 1,
      name: "Ca Phê Sáng Modernist",
      category: "Ẩm thực",
      description: "Một quán ăn phở truyền thống với nước dùng được nấu suốt ngày đêm",
      latitude: "10.7654",
      longitude: "106.6850",
      address: "123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
      categoryTag: "Coffee Shop",
      priority: 2,
      language: "Tiếng Việt",
      audio: "audio-001.mp3",
      images: ["image1.jpg", "image2.jpg"],
    })

    setNewPoi({
      id: 1,
      name: "Modernist Coffee & Roastery",
      category: "Ẩm thực",
      description: "Một quán ăn phở truyền thống với nước dùng được nấu suốt ngày đêm. Nước dùng được nấu từ xương bò và các loại gia vị tây bắc",
      latitude: "10.7654",
      longitude: "106.6851",
      address: "123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
      categoryTag: "Specialty Coffee",
      priority: 1,
      language: "Tiếng Việt, English",
      audio: "audio-001-multilang.mp3",
      images: ["image1.jpg", "image2.jpg", "image3.jpg"],
    })

    setLoading(false)
  }, [id])

  const handleRequestChanges = () => {
    // TODO: Gọi API request changes
    alert("Yêu cầu sửa lại đã được gửi")
    navigate("/poi/management/updates")
  }

  const handleReject = () => {
    // TODO: Gọi API reject
    alert("Cập nhật đã bị từ chối")
    navigate("/poi/management/updates")
  }

  const handleApprove = () => {
    // TODO: Gọi API approve
    alert("Cập nhật đã được phê duyệt")
    navigate("/poi/management/updates")
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Đang tải...
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

  // Count different fields
  const changedFields = Object.keys(oldPoi).filter(
    key => oldPoi[key] !== newPoi[key] && key !== "id"
  ).length

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
                  icon={Layers}
                  label="Danh mục"
                  value={oldPoi.categoryTag}
                  isChanged={isDifferent(oldPoi.categoryTag, newPoi.categoryTag)}
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
                  value={oldPoi.priority === 1 ? "🔴 Cao" : oldPoi.priority === 2 ? "🟡 Trung bình" : "🟢 Thấp"}
                  isChanged={isDifferent(oldPoi.priority, newPoi.priority)}
                />
              </Section>

              <Section title="Nội dung đa phương tiện">
                <InfoCard 
                  icon={Globe}
                  label="Ngôn ngữ"
                  value={oldPoi.language}
                  isChanged={isDifferent(oldPoi.language, newPoi.language)}
                />
                <InfoCard 
                  icon={Volume2}
                  label="File audio"
                  value={oldPoi.audio}
                  isChanged={isDifferent(oldPoi.audio, newPoi.audio)}
                />
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
                  {oldPoi.images?.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center border-2 border-gray-300 text-xs font-semibold text-gray-600 shadow-sm"
                    >
                      {idx + 1} / {oldPoi.images.length}
                    </div>
                  ))}
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
                  icon={Layers}
                  label="Danh mục"
                  value={newPoi.categoryTag}
                  isChanged={isDifferent(oldPoi.categoryTag, newPoi.categoryTag)}
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
                  value={newPoi.priority === 1 ? "🔴 Cao" : newPoi.priority === 2 ? "🟡 Trung bình" : "🟢 Thấp"}
                  isChanged={isDifferent(oldPoi.priority, newPoi.priority)}
                />
              </Section>

              <Section title="Nội dung đa phương tiện">
                <InfoCard 
                  icon={Globe}
                  label="Ngôn ngữ"
                  value={newPoi.language}
                  isChanged={isDifferent(oldPoi.language, newPoi.language)}
                />
                <InfoCard 
                  icon={Volume2}
                  label="File audio"
                  value={newPoi.audio}
                  isChanged={isDifferent(oldPoi.audio, newPoi.audio)}
                />
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
                  {newPoi.images?.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-24 h-24 bg-gradient-to-br from-amber-200 to-amber-300 rounded-xl flex items-center justify-center border-2 border-amber-300 text-xs font-bold text-amber-700 shadow-sm"
                    >
                      {idx + 1} / {newPoi.images.length}
                    </div>
                  ))}
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
              Phê duyệt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
