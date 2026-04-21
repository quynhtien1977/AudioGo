import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Edit2, CheckCircle, XCircle } from "lucide-react"
import toast from "react-hot-toast"

import POIManagementListComponent from "@/components/POIManagementListComponent"
import ConfirmModal from "@/components/ConfirmModal"
import { getAllPoiRequests, getAllPoiRequestsAll, reviewPoiRequest } from "@/api/poiRequestApi"
import { getUsersApi } from "@/api/accountApi"
import { getCategoriesApi } from "@/api/categoryApi"
import { getPoiDetail } from "@/api/poiApi"

export default function POIUpdateListPage() {
  const navigate = useNavigate()

  const [poiList, setPoiList] = useState([])
  const [loading, setLoading] = useState(false)

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedPoiId, setSelectedPoiId] = useState(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const [requests, users, categories] = await Promise.all([
          getAllPoiRequestsAll(),
          getUsersApi(),
          getCategoriesApi()
        ])

        // ================= FILTER UPDATE =================
        const updateRequests = requests
          .filter(r => r.actionType === "UPDATE")
          .sort((a, b) => {
            // PENDING trước, APPROVED/REJECTED sau
            if (a.status === "PENDING" && b.status !== "PENDING") return -1
            if (a.status !== "PENDING" && b.status === "PENDING") return 1
            return 0
          })

        // ================= MAP USER =================
        const userMap = {}
        users.forEach(u => {
          userMap[u.accountId] = u.fullName
        })

        // ================= MAP CATEGORY =================
        const categoryMap = {}
        categories.forEach(c => {
          categoryMap[c.categoryId] = c.name
        })

        // ================= FETCH POI DETAIL =================
        const mapped = await Promise.all(
          updateRequests.map(async (r) => {
            let poiDetail = null
            let data = {}

            try {
              if (r.poiId) {
                poiDetail = await getPoiDetail(r.poiId)
              }

              if (r.proposedData) {
                data = typeof r.proposedData === 'string' 
                  ? JSON.parse(r.proposedData)
                  : r.proposedData
              }
            } catch (err) {
              console.log("Error:", err)
            }

            // 🔥 LẤY TITLE TỪ DB
            const title =
              poiDetail?.contents?.find(c => c.isMaster)?.title ||
              "Không có tên"

            // 🔥 LẤY CATEGORY TỪ PROPOSED DATA RỒI MAPPING
            let categoryName = "Không xác định"
            const categoryIds = data.CategoryIds || data.categoryIds
            if (categoryIds && categoryIds.length > 0) {
              categoryName = categoryMap[categoryIds[0]] || "Không xác định"
            }

            // 🔥 TÍNH SỐ TRƯỜNG THAY ĐỔI
            const oldPoi = {
              name: poiDetail?.contents?.find(c => c.isMaster)?.title || "",
              category: poiDetail?.categoryIds?.[0] || "",
              description: poiDetail?.contents?.find(c => c.isMaster)?.description || "",
              latitude: poiDetail?.latitude || "",
              longitude: poiDetail?.longitude || "",
              address: poiDetail?.contents?.find(c => c.isMaster)?.address || "",
              priority: poiDetail?.priority || 2,
              language: poiDetail?.contents?.map(c => c.language).join(", ") || "",
              // Bug #4: dùng audioUrl và imageUrl (Azure URL)
              audio: poiDetail?.contents?.find(c => c.isMaster)?.audioUrl?.trim() || "",
              images: poiDetail?.gallery?.map(g => g.imageUrl).join(",") || "",
            }

            const newPoi = {
              name: data.Title || "",
              category: data.CategoryIds?.[0] || "",
              description: data.Description || "",
              latitude: data.Latitude?.toString() || "",
              longitude: data.Longitude?.toString() || "",
              address: data.Address || "",
              priority: data.Priority ?? 2,
              language: data.Language || "",
              // Bug #4: AudioUrl từ proposedData
              audio: data.AudioUrl?.trim() ?? "",
              images: data.GalleryImageUrls?.join(",") || "",
            }

            const changeCount = Object.keys(oldPoi).filter(
              key => oldPoi[key] !== newPoi[key]
            ).length

            return {
              id: r.requestId,
              name: title,
              category: categoryName,

              changeCount: changeCount,

              requestedAt: r.createdAt,

              requester: userMap[r.accountId] || "Không xác định",

              status: r.status === "PENDING" ? "pending" : r.status.toLowerCase(),
            }
          })
        )

        setPoiList(mapped)
      } catch (err) {
        console.error("UPDATE PAGE ERROR:", err)
      } finally {
    setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleReview = (id) => {
    navigate("/poi/management/updates/" + id)
  }

  const handleApprove = (id) => {
    setSelectedPoiId(id)
    setShowApproveModal(true)
  }

  const handleConfirmApprove = async () => {
    try {
      await reviewPoiRequest(selectedPoiId, { approved: true })
      setPoiList(prev =>
        prev
          .map(p =>
            p.id === selectedPoiId
              ? { ...p, status: "approved" }
              : p
          )
          .sort((a, b) => {
            // PENDING trước, APPROVED/REJECTED sau
            if (a.status === "pending" && b.status !== "pending") return -1
            if (a.status !== "pending" && b.status === "pending") return 1
            return 0
          })
      )
      setShowApproveModal(false)
      setSelectedPoiId(null)
      toast.success("Đã phê duyệt cập nhật POI")
    } catch (err) {
      console.error("Approve error:", err)
      toast.error("Phê duyệt thất bại: " + (err.message || ""))
    }
  }

  const handleReject = (id) => {
    setSelectedPoiId(id)
    setRejectReason("")
    setShowRejectModal(true)
  }

  const handleConfirmReject = async () => {
    try {
      await reviewPoiRequest(selectedPoiId, { 
        approved: false,
        rejectReason: rejectReason 
      })
      setPoiList(prev =>
        prev
          .map(p =>
            p.id === selectedPoiId
              ? { ...p, status: "rejected" }
              : p
          )
          .sort((a, b) => {
            // PENDING trước, APPROVED/REJECTED sau
            if (a.status === "pending" && b.status !== "pending") return -1
            if (a.status !== "pending" && b.status === "pending") return 1
            return 0
          })
      )
      setShowRejectModal(false)
      setSelectedPoiId(null)
      setRejectReason("")
      toast.success("Đã từ chối cập nhật POI")
    } catch (err) {
      console.error("Reject error:", err)
      toast.error("Từ chối thất bại: " + (err.message || ""))
    }
  }

  return (
    <>
    <POIManagementListComponent
      title="POI Cần Cập Nhật"
      description="Xem xét yêu cầu sửa đổi và cải thiện dữ liệu"
      type="update"
      badgeColor="bg-amber-100"
      badgeTextColor="text-amber-700"
      hoverBg="hover:bg-amber-50/30"
      poiList={poiList}
      loading={loading}
      statsLabel="chờ xử lý"
      emptyMessage="Không có POI nào cần cập nhật"
      renderExtraInfo={(poi) => (
        <div className="bg-amber-50 px-3 py-1 inline-block rounded-full text-sm font-semibold text-amber-700">
          📝 {poi.changeCount} thay đổi
        </div>
      )}
      renderActions={(poi) => (
        <>
          <button
            onClick={() => handleReview(poi.id)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition font-semibold"
          >
            <Edit2 size={18} />
            Xem xét
          </button>

          <button
            onClick={() => handleApprove(poi.id)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-semibold"
          >
            <CheckCircle size={18} />
            Chấp nhận
          </button>

          <button
            onClick={() => handleReject(poi.id)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-semibold"
          >
            <XCircle size={18} />
            Từ chối
          </button>
        </>
      )}
    />

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

      {showRejectModal && (
        <ConfirmModal
          open={showRejectModal}
          title="Xác nhận từ chối?"
          message={
            <div>
              <p>Bạn có chắc chắn muốn từ chối cập nhật POI này không?</p>
              <textarea
                className="w-full mt-2 p-2 border rounded"
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          }
          confirmText="Từ chối"
          cancelText="Hủy bỏ"
          onConfirm={handleConfirmReject}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
    </>
  )
}
