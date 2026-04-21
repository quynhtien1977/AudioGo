import { useParams, useLocation, useNavigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { PencilLine, CornerDownLeft } from "lucide-react"
import toast from "react-hot-toast"

import POIGallery from "@/components/POIGallery"
import POIAudioPlayer from "@/components/POIAudioPlayer"
import POIScript from "@/components/POIScript"
import POIInfoCard from "@/components/POIInfoCard"
import POIMapPreview from "@/components/POIMapPreview"
import ConfirmModal from "@/components/ConfirmModal"

import { getPoiDetail } from "@/api/poiApi"
import { getPoiRequestDetail, createPoiRequest } from "@/api/poiRequestApi"
import { getCategoriesApi } from "@/api/categoryApi"
import { uploadImage, uploadAudio } from "@/api/mediaApi"

import useAuth from "@/hooks/useAuth"

const POIDetailPage = () => {
  const { user } = useAuth()
  const role = user?.role

  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()  // Bug #6

  const isRequest = location.pathname.includes("/pois/requests")

  const [poi, setPoi] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)

  const [categories, setCategories] = useState([])

  const [isEditing, setIsEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [rejectReason, setRejectReason] = useState("")
  const [requestStatus, setRequestStatus] = useState("")

  // Bug #2: lưu pending files chưa upload
  const pendingImageFiles = useRef([])
  const pendingAudioFile  = useRef(null)

  // ================= FETCH CATEGORY =================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategoriesApi()
        setCategories(res)
      } catch (err) {
        console.error("Fetch categories failed", err)
      }
    }
    fetchCategories()
  }, [])

  // ================= FETCH POI =================
  useEffect(() => {
    const fetch = async () => {
      try {
        let mapped = null

        if (isRequest) {
          const res = await getPoiRequestDetail(id)

          let data = {}
          try {
            data = JSON.parse(res.proposedData || "{}")
          } catch (e) {
            console.error("Parse proposedData failed", e)
          }

          let categoryName = "Unknown"
          if (data.CategoryIds?.length > 0) {
            const found = categories.find(c => c.categoryId === data.CategoryIds[0])
            if (found) categoryName = found.name
          }

          mapped = {
            id: res.requestId,
            poiId: res.poiId,
            name: data.Title || "Unknown POI",
            description: data.Description || "",
            audio: data.AudioUrl || "",
            languageCode: "vi",
            category: categoryName,
            lat: Number(data.Latitude) || 0,
            lng: Number(data.Longitude) || 0,
            priority: Number(data.Priority) || 1,
            images: (() => {
              let urls = data.GalleryImageUrls || []
              if (data.LogoUrl) {
                urls = [data.LogoUrl, ...urls.filter(u => u !== data.LogoUrl)]
              }
              return urls.length ? urls : ["https://placehold.co/600x400?text=POI"]
            })(),
            ActivityRadius: Number(data.ActivationRadius) || 100,
          }

          setRejectReason(res.rejectReason || "")
          setRequestStatus(res.status)

        } else {
          const poiDetail = await getPoiDetail(id)
          const master = poiDetail.contents?.find(c => c.isMaster) || poiDetail.contents?.[0]

          mapped = {
            id: poiDetail.poiId,
            poiId: poiDetail.poiId,
            name: master?.title || "Unknown POI",
            description: master?.description || "",
            audio: master?.audioUrl || "",
            languageCode: master?.languageCode || "vi",
            category: poiDetail.category || "Unknown",
            lat: poiDetail.latitude,
            lng: poiDetail.longitude,
            priority: Number(poiDetail.priority) || 1,
            images: (() => {
              let urls = poiDetail.gallery?.map(g => g.imageUrl) || []
              if (poiDetail.logoUrl) {
                urls = [poiDetail.logoUrl, ...urls.filter(u => u !== poiDetail.logoUrl)]
              }
              return urls.length ? urls : ["https://placehold.co/600x400?text=POI"]
            })(),
            ActivityRadius: poiDetail.activationRadius ?? 100,
          }
        }

        setPoi(mapped)

      } catch (err) {
        console.error("FETCH ERROR:", err)
      } finally {
        setLoading(false)
      }
    }

    if (categories.length > 0) {
      fetch()
    }
  }, [id, isRequest, categories])

  useEffect(() => {
    if (poi) setForm({ ...poi })
  }, [poi])

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // Bug #2: callbacks nhận pending files
  const handlePendingImageFiles = (files) => {
    pendingImageFiles.current = files || []
  }
  const handlePendingAudioFile = (file) => {
    pendingAudioFile.current = file || null
  }

  // ================= SAVE =================
  const handleConfirmSave = async () => {
    if (isSubmitting) return
    try {
      setIsSubmitting(true)
      if (!categories.length) return
      if (!form.poiId && !id) {
        toast.error("Lỗi: Không tìm thấy POI ID")  // Bug #7
        return
      }

      // Ràng buộc: phải có ít nhất 1 logo VÀ 1 ảnh gallery
      if (!form.images || form.images.length === 0) {
        toast.error("Vui lòng thêm ảnh logo (ảnh đầu tiên)")
        setIsSubmitting(false)
        return
      }
      if (form.images.length < 2) {
        toast.error("Vui lòng thêm ít nhất 1 ảnh gallery (ngoài ảnh logo)")
        setIsSubmitting(false)
        return
      }

      // Bug #2: Upload pending files lên Azure trước khi submit
      let finalImages = [...(form.images || [])]
      let finalAudio  = form.audio || ""

      for (let i = 0; i < finalImages.length; i++) {
        if (finalImages[i].startsWith("blob:") && pendingImageFiles.current[i]) {
          try {
            finalImages[i] = await uploadImage(pendingImageFiles.current[i], "pois")
          } catch {
            toast.error(`Lỗi upload ảnh ${i + 1}. Vui lòng thử lại.`)
            setIsSubmitting(false)
            return
          }
        }
      }

      if (finalAudio.startsWith("blob:") && pendingAudioFile.current) {
        try {
          finalAudio = await uploadAudio(pendingAudioFile.current)
        } catch {
          toast.error("Lỗi upload audio. Vui lòng thử lại.")
          setIsSubmitting(false)
          return
        }
      }

      const selectedCategory = categories.find(c => c.name === form.category)
      const poiId = form.poiId || id

      const payload = {
        ActionType: "UPDATE",
        PoiId: poiId,
        Draft: {
          Latitude: form.lat,
          Longitude: form.lng,
          ActivationRadius: form.ActivityRadius || 100,
          Priority: form.priority || 1,
          LogoUrl: finalImages[0] || "",
          Title: form.name,
          Description: form.description,
          CategoryIds: selectedCategory ? [selectedCategory.categoryId] : [],
          GalleryImageUrls: finalImages,
          // Bug #4: "" = xóa audio, URL = có audio; backend sẽ phân biệt null vs ""
          AudioUrl: finalAudio,
          // Ngôn ngữ master content owner đang dùng
          LanguageCode: form.languageCode || "vi",
        }
      }

      await createPoiRequest(payload)
      toast.success("Đã gửi yêu cầu cập nhật thành công!")  // Bug #7

      setIsEditing(false)
      setShowConfirm(false)
      navigate("/pois")  // Bug #6: tự navigate về danh sách sau khi submit

    } catch (err) {
      console.error(err)
      toast.error("Gửi yêu cầu thất bại!")  // Bug #7
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case "Di tích lịch sử":    return "bg-blue-100 text-blue-500"
      case "Ẩm thực":            return "bg-pink-100 text-pink-500"
      case "Hải sản & Ốc":       return "bg-cyan-100 text-cyan-500"
      case "Cà phê & Giải khát": return "bg-orange-100 text-orange-500"
      case "Chùa & Tôn giáo":    return "bg-purple-100 text-purple-500"
      case "Giải trí":           return "bg-green-100 text-green-500"
      case "Mua sắm":            return "bg-yellow-100 text-yellow-600"
      default:                   return "bg-gray-100 text-gray-500"
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!poi) return <div className="p-6 text-red-500">Not found</div>

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          {isEditing ? (
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="text-4xl font-bold border-b-2 border-pink-300 outline-none"
            />
          ) : (
            <h1 className="text-4xl font-bold">{poi.name}</h1>
          )}

          {isRequest && requestStatus === "REJECTED" && (
            <p className="mt-2 text-red-500 text-sm">
              Lý do từ chối: {rejectReason || "Không có"}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          {role === "Owner" && !isEditing && !isRequest && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 border px-4 py-2 rounded-lg text-pink-600 border-pink-600"
            >
              <PencilLine size={16}/> Cập nhật
            </button>
          )}

          {isEditing && (
            <>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg disabled:opacity-60 flex items-center gap-2"
              >
                {isSubmitting ? <span className="animate-spin">&#9696;</span> : null}
                {isSubmitting ? "Đang gửi..." : "Lưu"}
              </button>

              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Hủy
              </button>
            </>
          )}

          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 text-pink-600"
          >
            <CornerDownLeft size={16}/> Quay lại
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-12 gap-6">

        <div className="col-span-8 space-y-6">
          {/* Bug #2: uploadOnSelect=false khi đang edit */}
          <POIGallery
            images={form.images}
            isEditing={isEditing}
            onChange={handleChange}
            uploadOnSelect={!isEditing}
            onPendingFiles={handlePendingImageFiles}
          />
          <POIAudioPlayer
            src={form.audio}
            isEditing={isEditing}
            onChange={handleChange}
            uploadOnSelect={!isEditing}
            onPendingFile={handlePendingAudioFile}
          />
          <POIScript
            value={form.description}
            onChange={(val) => handleChange("description", val)}
            isEditing={isEditing}
          />
        </div>

        <div className="col-span-4 space-y-6">
          <POIInfoCard
            poi={form}
            isEditing={isEditing}
            handleChange={handleChange}
            role={role}
            getCategoryColor={getCategoryColor}
          />

          <POIMapPreview
            lat={form.lat}
            lng={form.lng}
            name={form.name}
            isEditing={isEditing}
            onLocationSelect={(lat, lng) => {
              handleChange("lat", lat)
              handleChange("lng", lng)
            }}
          />
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Gửi yêu cầu cập nhật"
        message="Thay đổi sẽ gửi đến Admin để duyệt."
        confirmText="Gửi"
        cancelText="Hủy"
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}

export default POIDetailPage