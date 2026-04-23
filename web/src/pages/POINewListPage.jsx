import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Edit2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

import POIManagementListComponent from "@/components/POIManagementListComponent"
import ConfirmModal from "@/components/ConfirmModal"
import { getAllPoiRequests, getAllPoiRequestsAll, reviewPoiRequest } from "@/api/poiRequestApi"
import { getUsersApi } from "@/api/accountApi"
import { getCategoriesApi } from "@/api/categoryApi"

export default function POINewListPage() {
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

        // ================= MAP DATA =================
        const mapped = requests
          .filter(r => r.actionType === "CREATE")
          .sort((a, b) => {
            // PENDING trước, APPROVED/REJECTED sau
            if (a.status === "PENDING" && b.status !== "PENDING") return -1
            if (a.status !== "PENDING" && b.status === "PENDING") return 1
            return 0
          })
          .map(r => {
            let data = {}

            try {
              data = JSON.parse(r.proposedData)
            } catch {
              console.log("❌ Parse lỗi:", r.proposedData)
            }

            // 🔥 FIX CASE (QUAN TRỌNG NHẤT)
            const title = data.Title || data.title
            const categoryIds = data.CategoryIds || data.categoryIds

            return {
              id: r.requestId,

              name: title || "Không có tên",

              category:
                categoryIds && categoryIds.length > 0
                  ? categoryMap[categoryIds[0]] || "Không xác định"
                  : "Không xác định",

              createdAt: r.createdAt,
              requestedAt: r.createdAt,

              requester:
                userMap[r.accountId] || "Không xác định",

              status: r.status === "PENDING" ? "pending" : r.status.toLowerCase(),
            }
          })

        console.log("✅ FINAL DATA:", mapped)

        setPoiList(mapped)
      } catch (err) {
        console.error("❌ Load POI ERROR:", err)
      } finally {
    setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleReview = (id) => {
    navigate(`/pois/requests/${id}`)
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
      toast.success("Đã phê duyệt POI mới")
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
      toast.success("Đã từ chối POI mới")
    } catch (err) {
      console.error("Reject error:", err)
      toast.error("Từ chối thất bại: " + (err.message || ""))
    }
  }

  return (
    <>
    <POIManagementListComponent
      title="POI Mới Tạo"
      description="Xem và phê duyệt các địa điểm được thêm gần đây"
      type="new"
      badgeColor="bg-blue-100"
      badgeTextColor="text-blue-700"
      hoverBg="hover:bg-blue-50/30"
      poiList={poiList}
      loading={loading}
      statsLabel="chờ phê duyệt"
      emptyMessage="Không có POI nào chờ phê duyệt"
      renderActions={(poi) => (
        <>
          <button
            onClick={() => handleReview(poi.id)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition font-semibold"
          >
            <Edit2 size={18} />
            Xem chi tiết
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
          message="Bạn có chắc chắn muốn phê duyệt POI mới này không?"
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
              <p>Bạn có chắc chắn muốn từ chối POI mới này không?</p>
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
