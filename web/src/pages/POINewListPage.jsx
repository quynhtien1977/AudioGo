import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Edit2 } from "lucide-react"
import POIManagementListComponent from "@/components/POIManagementListComponent"

export default function POINewListPage() {
  const [poiList, setPoiList] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // TODO: Fetch danh sách POI mới từ API
    // const fetchNewPOIs = async () => {
    //   try {
    //     setLoading(true)
    //     const res = await getNewPoiListApi()
    //     setPoiList(res)
    //   } catch (err) {
    //     console.error("Load new POI list error:", err)
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    // fetchNewPOIs()

    // Mock data
    setPoiList([
      {
        id: 1,
        name: "Nhà hàng Hoa Anh Đào",
        category: "Ẩm thực",
        createdAt: "2024-04-10",
        status: "pending",
        requester: "Manager Hà Nội",
        
      },
      {
        id: 2,
        name: "Bảo tàng Lịch sử Thành phố",
        category: "Du lịch",
        createdAt: "2024-04-09",
        status: "pending",
        requester: "Manager Hà Nội",

      },
      {
        id: 3,
        name: "Công viên Tây Hồ",
        category: "Giải trí",
        createdAt: "2024-04-08",
        status: "pending",
        requester: "Manager Hà Nội",

      },
    ])
    setLoading(false)
  }, [])

  const handleReview = (id) => {
    navigate("/pois/" + id)
  }

  const handleApprove = (id) => {
    // TODO: Gọi API phê duyệt
    setPoiList(poiList.map(poi => 
      poi.id === id ? { ...poi, status: "approved" } : poi
    ))
  }

  const handleReject = (id) => {
    // TODO: Gọi API từ chối
    setPoiList(poiList.map(poi => 
      poi.id === id ? { ...poi, status: "rejected" } : poi
    ))
  }

  return (
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
  )
}
