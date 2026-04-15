import { useParams, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { PencilLine, CornerDownLeft } from "lucide-react"

import POIGallery from "@/components/POIGallery"
import POIAudioPlayer from "@/components/POIAudioPlayer"
import POIScript from "@/components/POIScript"
import POIInfoCard from "@/components/POIInfoCard"
import POIMapPreview from "@/components/POIMapPreview"
import ConfirmModal from "@/components/ConfirmModal"

import { getPoiDetail } from "@/api/poiApi"
import { getPoiRequestDetail } from "@/api/poiRequestApi"

import useAuth from "@/hooks/useAuth"

const POIDetailPage = () => {
  const { user } = useAuth()
  const role = user?.role

  const { id } = useParams()
  const location = useLocation()

  const isRequest = location.pathname.includes("/pois/requests")

  const [poi, setPoi] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [rejectReason, setRejectReason] = useState("")
  const [requestStatus, setRequestStatus] = useState("")

  // ================= FETCH =================
  useEffect(() => {
    const fetch = async () => {
      try {
        let mapped = null

        if (isRequest) {
          // ===== POI REQUEST =====
          const res = await getPoiRequestDetail(id)

          // 🔥 FIX QUAN TRỌNG: parse JSON string
          let data = {}
          try {
            data = JSON.parse(res.proposedData || "{}")
          } catch (e) {
            console.error("Parse proposedData failed", e)
          }

          mapped = {
            id: res.requestId,

            // 🔥 FIX FIELD NAME
            name: data.title || "Unknown POI",
            description: data.description || "",
            audio: data.audio || "",

            languageCode: data.languageCode || "vi",

            category: data.category || "Unknown",

            // 🔥 FIX KEY (Latitude + longtitude)
            lat: data.Latitude || 0,
            lng: data.longtitude || 0,

            priority: Number(data.priority) || 1,

            // 🔥 FIX IMAGE
            images: data.imgURL
              ? [data.imgURL]
              : ["https://placehold.co/600x400?text=POI"],

            ActivityRadius: data.activationRadius ?? 100,
          }

          setRejectReason(res.rejectReason || "")
          setRequestStatus(res.status)

        } else {
          // ===== NORMAL POI =====
          const poiDetail = await getPoiDetail(id)

          const master =
            poiDetail.contents?.find(c => c.isMaster) ||
            poiDetail.contents?.[0]

          mapped = {
            id: poiDetail.poiId,
            name: master?.title || "Unknown POI",
            description: master?.description || "",
            audio: master?.audioUrl || "",
            languageCode: master?.languageCode || "vi",

            category: poiDetail.category || "Unknown",
            lat: poiDetail.latitude,
            lng: poiDetail.longitude,
            priority: Number(poiDetail.priority) || 1,

            images: poiDetail.gallery?.length
              ? poiDetail.gallery.map(g => g.imageUrl)
              : ["https://placehold.co/600x400?text=POI"],

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

    fetch()
  }, [id, isRequest])

  useEffect(() => {
    if (poi) setForm({ ...poi })
  }, [poi])

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleConfirmSave = () => {
    console.log("UPDATE DATA:", form)

    setPoi(prev => ({
      ...prev,
      ...form
    }))

    setIsEditing(false)
    setShowConfirm(false)
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case "Di tích lịch sử":
        return "bg-blue-100 text-blue-500"
      case "Ẩm thực":
        return "bg-pink-100 text-pink-500"
      case "Hải sản & Ốc":
        return "bg-cyan-100 text-cyan-500"
      case "Cà phê & Giải khát":
        return "bg-orange-100 text-orange-500"
      case "Chùa & Tôn giáo":
        return "bg-purple-100 text-purple-500"
      case "Giải trí":
        return "bg-green-100 text-green-500"
      case "Mua sắm":
        return "bg-yellow-100 text-yellow-600"
      default:
        return "bg-gray-100 text-gray-500"
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

          {/* 🔥 SHOW REJECT */}
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
                className="px-4 py-2 bg-pink-500 text-white rounded-lg"
              >
                Lưu
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
          <POIGallery images={isEditing ? form.images : poi.images} isEditing={isEditing} onChange={handleChange} />
          <POIAudioPlayer src={isEditing ? form.audio : poi.audio} isEditing={isEditing} onChange={handleChange} />
          <POIScript value={isEditing ? form.description : poi.description} onChange={(val) => handleChange("description", val)} isEditing={isEditing} />
        </div>

        <div className="col-span-4 space-y-6">
          <POIInfoCard
            poi={{ ...poi, priority: priorityMap[poi.priority] || "UNKNOWN" }}
            isEditing={isEditing}
            handleChange={(key, value) => {
              if (key === "priority") {
                const numeric = Object.keys(priorityMap).find(k => priorityMap[k] === value)
                handleChange(key, numeric ? Number(numeric) : value)
              } else {
                handleChange(key, value)
              }
            }}
            role={role}
            getCategoryColor={getCategoryColor}
          />

          <POIMapPreview
            lat={isEditing ? form.lat : poi.lat}
            lng={isEditing ? form.lng : poi.lng}
            name={isEditing ? form.name : poi.name}
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

const priorityMap = {
  1: "LOW",
  2: "MEDIUM",
  3: "HIGH",
  4: "CRITICAL"
}