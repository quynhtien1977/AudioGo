import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { Trash2, PencilLine, CornerDownLeft, Save, Ban } from "lucide-react"

import POIGallery from "@/components/POIGallery"
import POIAudioPlayer from "@/components/POIAudioPlayer"
import POIScript from "@/components/POIScript"
import POIInfoCard from "@/components/POIInfoCard"
import POIMapPreview from "@/components/POIMapPreview"
import ConfirmModal from "@/components/ConfirmModal"


import { getTopPOIs } from "@/api/poiApi"

import useAuth from "@/hooks/useAuth"

const POIDetailPage = () => {
  const { user } = useAuth()
  const role = user?.role;

  const { id } = useParams()
  const [poi, setPoi] = useState(null)
  const [loading, setLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({})

  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const fetchPOI = async () => {
      try {
        const data = await getTopPOIs()

        // tìm POI theo rank (id từ URL)
        const found = data.find(item => item.rank === Number(id))

        setPoi(found)
      } catch (error) {
        console.error("Error fetching POI:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPOI()
  }, [id])

  useEffect(() => {
    if (poi) {
      setForm({
        name: poi.name,
        category: poi.category,
        lat: poi.lat,
        lng: poi.lng,
        ActivityRadius: poi.ActivityRadius || 100,
        script: poi.script || "",
        audio: poi.audio || "",
        // images: poi.images || [],
        images: Array.isArray(poi.images) ? poi.images : [],
      })
    }
  }, [poi])

  // loading state
  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  // không tìm thấy POI
  if (!poi) {
    return <div className="p-6 text-red-500">POI not found</div>
  }
  
  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleConfirmSave = () => {
    // giả lập gọi API gửi admin
    console.log("Gửi yêu cầu update POI:", form)

    setPoi(prev => ({
      ...prev,
      ...form
    }))

    setIsEditing(false)
    setShowConfirm(false)
  }

  const handleCancelConfirm = () => {
    setShowConfirm(false)
  }

  return (
    <div className="p-6 space-y-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
         {isEditing ? (
            <div className="relative group">
              <input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="text-4xl font-bold text-gray-800 bg-transparent border-b-2 border-pink-300 
                          outline-none focus:border-pink-500 focus:ring-0 transition-all duration-300 
                          w-full pb-1 pr-10"
                placeholder="Nhập tên POI..."
                autoFocus
              />
              <PencilLine className="absolute right-0 bottom-3 w-5 h-5 text-pink-300 group-focus-within:text-pink-500 transition-colors" />
            </div>
          ) : (
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight leading-tight">
              {poi.name}
            </h1>
          )}

        </div>

        <div className="flex space-x-4">

          {role === "MANAGER" && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex border px-4 py-2 rounded-lg text-pink-600 border-pink-600 hover:bg-pink-100"
            >
              <PencilLine className="w-4 h-5 mt-0.5 mr-1.5" /> Cập nhật
            </button>
          )}

          {isEditing && (
            <>
              <button
                onClick={() => setShowConfirm(true)}
                className="flex px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                <Save className="w-4 h-5 mt-0.5 mr-1.5" /> Lưu
              </button>

              <button
                onClick={() => setIsEditing(false)}
                className="flex px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                <Ban className="w-4 h-5 mt-0.5 mr-1.5" /> Hủy
              </button>
            </>
          )}

          <button
            onClick={() => window.history.back()}
            className="flex border px-4 py-2 rounded-lg text-pink-600 border-pink-600 hover:bg-pink-100"
          >
            <CornerDownLeft className="w-4 h-5 mt-1 mr-1.5" />Quay lại
          </button>

        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT */}
        <div className="col-span-8 space-y-6">
          <POIGallery  images={isEditing ? form.images : poi.images} isEditing={isEditing} onChange={handleChange} />
        
          {/* <POIAudioPlayer /> */}
          
          <POIAudioPlayer src={poi.audio} isEditing={isEditing} onChange={(value) => handleChange("audio", value)} />
          {/* <POIScript poiId={poi.rank} /> */}
          <POIScript 
            poiId={poi.rank} 
            value={isEditing ? form.script : poi.script}
            onChange={(val) => handleChange("script", val)}
            isEditing={isEditing}
          />
        </div>

        {/* RIGHT */}
        <div className="col-span-4 space-y-6">
          <POIInfoCard poi={poi} isEditing={isEditing} form={form} handleChange={handleChange} role={role} />

          <POIMapPreview
            lat={isEditing ? form.lat : poi.lat}
            lng={isEditing ? form.lng : poi.lng}
            name={isEditing ? form.name : poi.name}
            isEditing={isEditing}
            // Khi click trên bản đồ, cập nhật cả lat và lng vào form
            onLocationSelect={(lat, lng) => {
              handleChange("lat", lat);
              handleChange("lng", lng);
            }}
          />

        </div>

      </div>

      <ConfirmModal
        open={showConfirm}
        title="Gửi yêu cầu cập nhật"
        message="Mọi thay đổi sẽ được gửi đến Admin để xét duyệt trước khi áp dụng. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Gửi yêu cầu"
        cancelText="Hủy"
        onConfirm={handleConfirmSave}
        onCancel={handleCancelConfirm}
      />
    </div>
  )
}

export default POIDetailPage