import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Edit2, CheckCircle, XCircle, Eye, FileEdit } from "lucide-react"
import toast from "react-hot-toast"

import POIManagementListComponent from "@/components/POIManagementListComponent"
import ConfirmModal from "@/components/ConfirmModal"
import { getAllPoiRequestsAll, reviewPoiRequest } from "@/api/poiRequestApi"
import { getUsersApi } from "@/api/accountApi"
import { getCategoriesApi } from "@/api/categoryApi"
import { getPoiDetail } from "@/api/poiApi"
import { getPoiChanges } from "@/utils/poiChangeDetector"

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
          getCategoriesApi(),
        ])

        // Filter UPDATE
        const updateRequests = requests
          .filter(r => r.actionType === "UPDATE")
          .sort((a, b) => {
            if (a.status === "PENDING" && b.status !== "PENDING") return -1
            if (a.status !== "PENDING" && b.status === "PENDING") return 1
            return new Date(b.createdAt) - new Date(a.createdAt)
          })

        // Map user + category
        const userMap = {}
        users.forEach(u => { userMap[u.accountId] = u.fullName })

        const categoryMap = {}
        categories.forEach(c => { categoryMap[c.categoryId] = c.name })

        // Fetch POI details & map
        const mapped = await Promise.all(
          updateRequests.map(async (r) => {
            let poiDetail = null
            let data = {}

            try {
              if (r.poiId) {
                poiDetail = await getPoiDetail(r.poiId)
              }
              if (r.proposedData) {
                data = typeof r.proposedData === "string"
                  ? JSON.parse(r.proposedData)
                  : r.proposedData
              }
            } catch (err) {
              console.warn("Error fetching POI detail:", err)
            }

            const title =
              poiDetail?.contents?.find(c => c.isMaster)?.title || "Không có tên"

            const categoryIds = data.CategoryIds || data.categoryIds || []
            const categoryNames = Array.isArray(categoryIds)
              ? categoryIds.map(id => categoryMap[id] || id).filter(Boolean)
              : []

            const { changeCount } = getPoiChanges(poiDetail, data)

            return {
              id: r.requestId,
              name: title,
              category: categoryNames[0] || "Không xác định",
              categories: categoryNames.length > 0 ? categoryNames : ["Không xác định"],
              changeCount,
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

  const handleReview = (id) => navigate("/admin/pois/management/updates/" + id)

  const handleApprove = (id) => {
    setSelectedPoiId(id)
    setShowApproveModal(true)
  }

  const handleConfirmApprove = async () => {
    try {
      await reviewPoiRequest(selectedPoiId, { approved: true })
      setPoiList(prev =>
        prev.map(p => p.id === selectedPoiId ? { ...p, status: "approved" } : p)
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
        rejectReason: rejectReason,
      })
      setPoiList(prev =>
        prev.map(p => p.id === selectedPoiId ? { ...p, status: "rejected" } : p)
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
        renderExtraInfo={(poi) => {
          if (poi.status === "approved") {
            return (
              <div className="bg-emerald-50 px-3 py-1 inline-flex items-center gap-1.5 rounded-full text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                <span>Đã cập nhật</span>
              </div>
            )
          }
          if (poi.status === "rejected") {
            return (
              <div className="bg-rose-50 px-3 py-1 inline-flex items-center gap-1.5 rounded-full text-xs font-semibold text-rose-700 border border-rose-200/60">
                <XCircle size={13} className="text-rose-600 shrink-0" />
                <span>Đã từ chối</span>
              </div>
            )
          }
          return (
            <div className="bg-amber-50 px-3 py-1 inline-flex items-center gap-1.5 rounded-full text-xs font-semibold text-amber-700 border border-amber-200/60">
              <FileEdit size={13} className="text-amber-600 shrink-0" />
              <span>{poi.changeCount} thay đổi</span>
            </div>
          )
        }}
        renderActions={(poi) => (
          <>
            <button
              onClick={() => handleReview(poi.id)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition font-semibold text-sm"
            >
              <Edit2 size={16} />
              Xem xét
            </button>
            <button
              onClick={() => handleApprove(poi.id)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-semibold text-sm"
            >
              <CheckCircle size={16} />
              Duyệt
            </button>
            <button
              onClick={() => handleReject(poi.id)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-semibold text-sm"
            >
              <XCircle size={16} />
              Từ chối
            </button>
          </>
        )}
        renderReviewAction={(poi) => (
          <button
            onClick={() => handleReview(poi.id)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition font-semibold text-sm"
          >
            <Eye size={16} />
            Xem lại
          </button>
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
                className="w-full mt-2 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
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
