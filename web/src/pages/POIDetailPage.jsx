import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { Trash2, PencilLine, CornerDownLeft, Save, Ban } from "lucide-react"

import POIGallery from "@/components/POIGallery"
import POIAudioPlayer from "@/components/POIAudioPlayer"
import POIScript from "@/components/POIScript"
import POIInfoCard from "@/components/POIInfoCard"
import POIMapPreview from "@/components/POIMapPreview"
import ConfirmModal from "@/components/ConfirmModal"

import { getAllPOIs } from "@/api/poiApi"
import { getContentsByPOI } from "@/api/contentApi"
import { getGalleryByPOI } from "@/api/galleryApi"

import useAuth from "@/hooks/useAuth"

const POIDetailPage = () => {
  const { user } = useAuth()
  const role = user?.role

  const { id } = useParams()

  const [poi, setPoi] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // MOCK fallback nếu BE chưa có 
  // const buildPOI = (p) => ({
  //   id: p.poiId,
  //   name: p.contents?.[0]?.title || "Unknown POI",
  //   category: p.category || "Restaurant",
  //   lat: p.latitude ?? 10.7769,
  //   lng: p.longitude ?? 106.7009,
  //   priority: Number(p.priority) || 1,

  //   // 👇 BE chưa có → fake
  //   script: p.script || "Chưa có nội dung mô tả...",
  //   audio: p.audio || "",
  //   images: Array.isArray(p.images)
  //     ? p.images
  //     : [
  //         "https://placehold.co/600x400?text=POI+Image",
  //         "https://placehold.co/600x400?text=No+Data",
  //       ],
  //   ActivityRadius: p.activityRadius ?? 100,
  // })

  // INIT FORM
  useEffect(() => {
  const fetch = async () => {
    try {
      const pois = await getAllPOIs()
      const found = pois.find(p => String(p.poiId) === String(id))

      if (!found) return

      // 🔥 gọi song song content + gallery
      const [contents, gallery] = await Promise.all([
        getContentsByPOI(id),
        getGalleryByPOI(id)
      ])

      const master =
        contents.find(c => c.isMaster) || contents[0]

      const mapped = {
        id: found.poiId,
        name: master?.title || "Unknown POI",
        description: master?.description || "",
        audio: master?.audioUrl || "",

        languageCode: master?.languageCode || "en",

        category: found.category || "Restaurant",
        lat: found.latitude,
        lng: found.longitude,
        priority: Number(found.priority) || 1,
        // status: found.status,

        // FIX HERE (lấy từ gallery API)
        images: gallery.length > 0
          ? gallery.map(g => g.imageUrl)
          : ["https://placehold.co/600x400?text=POI"],

        ActivityRadius: found.activationRadius ?? 100,
      }

      setPoi(mapped)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  fetch()
}, [id])

  useEffect(() => {
    if (poi) {
      setForm({ ...poi })
    }
  }, [poi])

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // SAVE (hiện tại giả lập)
  const handleConfirmSave = () => {
    console.log("UPDATE DATA:", form)

    setPoi(prev => ({
      ...prev,
      ...form
    }))

    setIsEditing(false)
    setShowConfirm(false)
  }

  if (loading) return <div className="p-6">Loading...</div>

  if (!poi) return <div className="p-6 text-red-500">POI not found</div>

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
        </div>

        <div className="flex gap-3">
          {role === "Owner" && !isEditing && (
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
                {/* <Save size={16}/>  */}
                Lưu
              </button>

              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border rounded-lg"
              >
                {/* <Ban size={16}/>  */}
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

        {/* LEFT */}
        <div className="col-span-8 space-y-6">

          <POIGallery
            images={isEditing ? form.images : poi.images}
            isEditing={isEditing}
            onChange={handleChange}
          />

          <POIAudioPlayer
            src={isEditing ? form.audio : poi.audio}
            isEditing={isEditing}
            onChange={handleChange}
          />

          <POIScript
            value={isEditing ? form.description : poi.description}
            onChange={(val) => handleChange("script", val)}
            isEditing={isEditing}
          />
        </div>

        {/* RIGHT */}
        <div className="col-span-4 space-y-6">

          <POIInfoCard
            poi={{
              ...poi,
              priority: priorityMap[poi.priority] || "UNKNOWN", // Map priority to string
            }}
            isEditing={isEditing}
            handleChange={(key, value) => { 
              if (key === "priority") {
                const numericPriority = Object.keys(priorityMap).find(
                  (k) => priorityMap[k] === value
                );
                handleChange(key, numericPriority ? Number(numericPriority) : value);
              } else {
                handleChange(key, value);
              }
            }}
            role={role}
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

      {/* MODAL */}
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

const priorityMap = { 1: "LOW", 2: "MEDIUM", 3: "HIGH", 4: "CRITICAL" };