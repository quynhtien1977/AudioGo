import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Edit2, CheckCircle, XCircle } from "lucide-react"
import POIManagementListComponent from "@/components/POIManagementListComponent"

export default function POIUpdateListPage() {
  const navigate = useNavigate()
  const [poiList, setPoiList] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // TODO: Fetch danh sách POI cần cập nhật từ API
    // const fetchUpdatePOIs = async () => {
    //   try {
    //     setLoading(true)
    //     const res = await getUpdatePoiListApi()
    //     setPoiList(res)
    //   } catch (err) {
    //     console.error("Load update POI list error:", err)
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    // fetchUpdatePOIs()

    // Mock data
    setPoiList([
      {
        id: 1,
        name: "Nhà hàng Phở Quán",
        category: "Ẩm thực",
        changeCount: 5,
        requestedAt: "2024-04-08",
        requester: "Manager Hà Nội",
        status: "pending",
      },
      {
        id: 2,
        name: "Bảo tàng Mỹ Thuật",
        category: "Du lịch",
        changeCount: 3,
        requestedAt: "2024-04-07",
        requester: "Manager TPHCM",
        status: "pending",
      },
      {
        id: 3,
        name: "Khu vui chơi Nước",
        category: "Giải trí",
        changeCount: 8,
        requestedAt: "2024-04-06",
        requester: "Manager Đà Nẵng",
        status: "pending",
      },
    ])
    setLoading(false)
  }, [])

  const handleReview = (id) => {
    navigate("/poi/management/updates/" + id)
  }

  const handleApprove = (id) => {
    // TODO: Gọi API phê duyệt cập nhật
    setPoiList(poiList.map(poi => 
      poi.id === id ? { ...poi, status: "approved" } : poi
    ))
  }

  const handleReject = (id) => {
    // TODO: Gọi API từ chối cập nhật
    setPoiList(poiList.map(poi => 
      poi.id === id ? { ...poi, status: "rejected" } : poi
    ))
  }

  return (
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
  )
}
