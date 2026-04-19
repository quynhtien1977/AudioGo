import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Trash2 } from "lucide-react"

import POIManagementListComponent from "@/components/POIManagementListComponent"
import ConfirmModal from "@/components/ConfirmModal"
import { getAllPoiRequests, getAllPoiRequestsAll, reviewPoiRequest } from "@/api/poiRequestApi"
import { getUsersApi } from "@/api/accountApi"
import { getPoiDetail } from "@/api/poiApi"

export default function POIDeletionListPage() {
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

        const [requests, users] = await Promise.all([
          getAllPoiRequestsAll(),
          getUsersApi()
        ])

        // ================= FILTER DELETE =================
        const deleteRequests = requests.filter(
          r => r.actionType === "DELETE"
        )
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

        // ================= FETCH POI DETAIL =================
        const mapped = await Promise.all(
          deleteRequests.map(async (r) => {
            let poiDetail = null

            try {
              if (r.poiId) {
                poiDetail = await getPoiDetail(r.poiId)
              }
            } catch (err) {
              console.log("Fetch POI error:", err)
            }

            // 🔥 NAME từ DB
            const title =
              poiDetail?.contents?.find(c => c.isMaster)?.title ||
              "Không có tên"

            // 🔥 CATEGORY từ DB
            const category = poiDetail?.category || "Không xác định"

            return {
              id: r.requestId,
              name: title,
              category: category,

              // 🔥 LÝ DO XOÁ (nếu có)
              reason: r.rejectReason || "Không có lý do",

              requestedAt: r.createdAt,

              requester: userMap[r.accountId] || "Không xác định",

              status: r.status === "PENDING" ? "pending" : r.status.toLowerCase(),
            }
          })
        )

        setPoiList(mapped)
      } catch (err) {
        console.error("DELETE PAGE ERROR:", err)
      } finally {
    setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleApprove = (id) => {
    setSelectedPoiId(id)
    setShowApproveModal(true)
  }

  const handleConfirmApprove = async () => {
    try {
      await reviewPoiRequest(selectedPoiId, { status: "APPROVED" })
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
    } catch (err) {
      console.error("Approve error:", err)
      alert("Xóa thất bại")
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
        status: "REJECTED",
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
    } catch (err) {
      console.error("Reject error:", err)
      alert("Từ chối thất bại")
    }
  }

  return (
    <>
    <POIManagementListComponent
      title="POI Cần Xóa"
        description="Xử lý yêu cầu loại bỏ các điểm tham quan"
      type="deletion"
      badgeColor="bg-red-100"
      badgeTextColor="text-red-700"
      hoverBg="hover:bg-red-50/30"
      poiList={poiList}
      loading={loading}
      statsLabel="chờ xử lý"
      emptyMessage="Không có POI nào cần xóa"

      renderActions={(poi) => (
        <>
          <button
            onClick={() => handleApprove(poi.id)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-semibold"
          >
            <Trash2 size={18} />
            Xóa
          </button>

          <button
            onClick={() => handleReject(poi.id)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition font-semibold"
          >
            <XCircle size={18} />
            Từ chối
          </button>
        </>
      )}

        warningNote="⚠️ Hành động xóa không thể hoàn tác. Kiểm tra kỹ trước khi duyệt."
      />

      {showApproveModal && (
        <ConfirmModal
          open={showApproveModal}
          title="Xác nhận duyệt?"
          message="Bạn có chắc chắn muốn duyệt yêu cầu xóa POI này không?"
          confirmText="Duyệt"
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
              <p>Bạn có chắc chắn muốn từ chối yêu cầu xóa POI này không?</p>
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