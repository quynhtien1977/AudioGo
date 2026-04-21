import { CloudUpload, Trash2, Play, Pause, Loader2 } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import toast from "react-hot-toast"
import { uploadAudio } from "@/api/mediaApi"
import ConfirmModal from "@/components/ConfirmModal"

/**
 * POIAudioPlayer
 * Props:
 *  - src: string              — URL audio hiện tại (cloud hoặc blob URL)
 *  - isEditing: boolean
 *  - onChange(key, value)     — callback cập nhật "audio" lên parent
 *  - uploadOnSelect?: boolean — true = upload ngay khi chọn (default: true)
 *                               false = preview local, parent tự upload khi submit
 *  - onPendingFile?(file)     — callback trả File object khi uploadOnSelect=false
 */
const POIAudioPlayer = ({ src, isEditing, onChange, uploadOnSelect = true, onPendingFile }) => {
  const fileInputRef = useRef(null)
  const audioRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  // Bug #7: thay window.confirm → state nội bộ mini confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset play state khi src thay đổi
  useEffect(() => {
    if (!src && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [src])

  // =========================
  // UPLOAD / SELECT AUDIO FILE
  // =========================
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith("audio/")) return

    e.target.value = ""

    if (!uploadOnSelect) {
      // Bug #2: preview local, không upload Azure ngay
      const blobUrl = URL.createObjectURL(file)
      onChange("audio", blobUrl)
      onPendingFile?.(file)
      return
    }

    try {
      setIsUploading(true)
      const url = await uploadAudio(file)
      onChange("audio", url)
    } catch (err) {
      console.error("Upload audio thất bại:", err)
      toast.error("Upload audio thất bại. Vui lòng thử lại.")
    } finally {
      setIsUploading(false)
    }
  }

  // =========================
  // DELETE AUDIO — Bug #7: thay window.confirm
  // =========================
  const handleRemoveConfirmed = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsPlaying(false)
    setShowDeleteConfirm(false)
    onChange("audio", "")
    onPendingFile?.(null)
  }

  // =========================
  // PLAY / PAUSE
  // =========================
  const togglePlayPause = () => {
    if (!audioRef.current || !src) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // =========================
  // SEEK AUDIO
  // =========================
  const handleSeek = (e) => {
    if (!audioRef.current || !src) return
    const bounds = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - bounds.left) / bounds.width
    if (audioRef.current.duration) {
      audioRef.current.currentTime = percent * audioRef.current.duration
      setProgress(percent * 100)
    }
  }

  const getFileName = (url) => {
    if (!url) return "Chưa có file âm thanh"
    if (url.startsWith("blob:")) return "File âm thanh mới (chưa lưu)"
    try {
      const decoded = decodeURIComponent(url)
      return decoded.split("/").pop().split("?")[0]
    } catch {
      return url.split("/").pop()
    }
  }

  return (
    <>
    <div className="relative bg-[#FFF5F7] p-8 rounded-[32px] border border-pink-50 shadow-sm">

      {/* AUDIO TAG HIDDEN */}
      {src && (
        <audio
          ref={audioRef}
          src={src}
          onEnded={() => {
            setIsPlaying(false)
            setProgress(0)
          }}
          onTimeUpdate={() => {
            if (audioRef.current?.duration) {
              setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
            }
          }}
        />
      )}

      {/* LABEL */}
      <div className="absolute top-6 right-8">
        <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em]">
          File âm thanh
        </span>
      </div>

      <div className="flex items-center gap-6">

        {/* NÚT UPLOAD / PLAY */}
        {isUploading ? (
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-pink-50 shadow-inner">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
          </div>
        ) : src ? (
          <button
            onClick={togglePlayPause}
            className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-md hover:scale-105 active:scale-95 transition"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-pink-500" />
            ) : (
              <Play className="w-6 h-6 text-pink-500" />
            )}
          </button>
        ) : (
          <div
            onClick={() => isEditing && fileInputRef.current?.click()}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-inner transition-all
              ${isEditing ? "cursor-pointer hover:scale-105 active:scale-95 bg-white" : "bg-pink-100"}`}
          >
            <div className="w-16 h-16 rounded-full bg-pink-200/30 flex items-center justify-center border-4 border-white">
              <CloudUpload className="w-8 h-8 text-pink-300" />
            </div>
          </div>
        )}

        {/* INFO */}
        <div className="flex-1 space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="audio/*"
            onChange={handleFileChange}
          />

          <h3 className="text-xl font-extrabold text-gray-700 tracking-tight truncate max-w-[280px]">
            {isUploading ? "Đang tải lên..." : getFileName(src)}
          </h3>

          {/* PROGRESS BAR */}
          <div
            className={`relative w-full h-3 bg-pink-100 rounded-full overflow-hidden ${src ? "cursor-pointer" : ""}`}
            onClick={handleSeek}
          >
            {isUploading ? (
              <div className="absolute top-0 left-0 h-full bg-pink-300 rounded-full animate-pulse w-full" />
            ) : (
              <div
                className="absolute top-0 left-0 h-full bg-pink-400 rounded-full transition-all duration-300"
                style={{ width: src ? `${progress}%` : "0%" }}
              />
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {src ? "Format: MP3/AAC" : "Chọn file âm thanh"}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider italic">
              {src ? (src.startsWith("blob:") ? "Local preview" : "Azure Blob Storage") : "max 50MB"}
            </span>
          </div>

          {isEditing && src && !isUploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-[10px] font-bold text-pink-400 hover:text-pink-600 transition-colors"
            >
              <CloudUpload className="w-3 h-3" /> Thay file khác
            </button>
          )}
        </div>

        {/* DELETE BUTTON */}
        {isEditing && src && !isUploading && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="ml-2 w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-red-50 group transition shrink-0"
          >
            <Trash2 className="w-6 h-6 text-gray-400 group-hover:text-red-500" />
          </button>
        )}
      </div>
    </div>

    {/* CONFIRM MODAL xóa audio */}
    <ConfirmModal
      open={showDeleteConfirm}
      title="Xóa audio?"
      message="Bạn có chắc chắn muốn xóa file âm thanh này không? Hành động này không thể hoàn tác."
      confirmText="Xóa"
      cancelText="Hủy"
      onConfirm={handleRemoveConfirmed}
      onCancel={() => setShowDeleteConfirm(false)}
    />
  </>
  )
}

export default POIAudioPlayer
