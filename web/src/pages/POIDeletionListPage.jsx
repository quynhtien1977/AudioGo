import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Trash2 } from "lucide-react"
import POIManagementListComponent from "@/components/POIManagementListComponent"

export default function POIDeletionListPage() {
  const [poiList, setPoiList] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // TODO: Fetch danh sách POI cần xóa từ API
    // const fetchDeletionPOIs = async () => {
    //   try {
    //     setLoading(true)
    //     const res = await getDeletionPoiListApi()
    //     setPoiList(res)
    //   } catch (err) {
    //     console.error("Load deletion POI list error:", err)
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    // fetchDeletionPOIs()

    // Mock data
    setPoiList([
      {
        id: 1,
        name: "Nhà hàng Cũ A",
        category: "Ẩm thực",
        reason: "Nhà hàng đã đóng cửa",
        requestedAt: "2024-04-05",
        requester: "Manager Hà Nội",
        status: "pending",
      },
      {
        id: 2,
        name: "Tòa nhà Văn phòng B",
        category: "Tổ chức",
        reason: "Thông tin không chính xác",
        requestedAt: "2024-04-04",
        requester: "Manager TPHCM",
        status: "pending",
      },
      {
        id: 3,
        name: "Cửa hàng Bình Phước",
        category: "Mua sắm",
        reason: "Vi phạm chính sách nội dung",
        requestedAt: "2024-04-03",
        requester: "Manager Đà Nẵng",
        status: "pending",
      },
    ])
    setLoading(false)
  }, [])

  const handleApprove = (id) => {
    // TODO: Gọi API phê duyệt xóa
    setPoiList(poiList.map(poi => 
      poi.id === id ? { ...poi, status: "approved" } : poi
    ))
  }

  const handleReject = (id) => {
    // TODO: Gọi API từ chối xóa
    setPoiList(poiList.map(poi => 
      poi.id === id ? { ...poi, status: "rejected" } : poi
    ))
  }

  return (
    <POIManagementListComponent
      title="POI Cần Xóa"
      description="Xử lý yêu cầu loại bỏ các điểm tham quan đóng cửa hoặc bị báo cáo vấn đề"
      type="deletion"
      badgeColor="bg-red-100"
      badgeTextColor="text-red-700"
      hoverBg="hover:bg-red-50/30"
      poiList={poiList}
      loading={loading}
      statsLabel="chờ xử lý"
      emptyMessage="Không có POI nào cần xóa"
      // renderExtraInfo={(poi) => (
      //   <div className="bg-red-50 px-3 py-2 rounded-lg text-sm text-gray-700 border-l-4 border-red-500">
      //     <span className="font-semibold">Lý do: </span>
      //     {poi.reason}
      //   </div>
      // )}
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
      warningNote="⚠️ Chú ý: Hành động xóa POI không thể hoàn tác. Hãy kiểm tra kỹ lý do trước khi phê duyệt."
    />
  )
}
