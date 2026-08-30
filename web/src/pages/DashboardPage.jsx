import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  MapPin, Headphones, LayoutDashboard, Clock,
  Users, ArrowRight, ShieldCheck, AlertTriangle, Bell, CheckCircle,
  Newspaper, Route as RouteIcon, Globe, FileText, Plus, Sparkles,
  Megaphone, Settings
} from "lucide-react"

import StatsCard from "@/components/StatsCard"
import TrendingChart from "@/components/TrendingChart"
import TopPOIModal from "@/components/TopPOIModal"
import PageHeader from "@/components/PageHeader"
import PageLoader from "@/components/PageLoader"
import HelpGuide from "@/components/HelpGuide"

import { getTopPOIs, getListenStats } from "@/api/analyticsApi"
import { getAllPOIs } from "@/api/poiApi"
import { getPoiRequestStats } from "@/api/poiRequestApi"
import { getUsersApi } from "@/api/accountApi"
import { getExpiringSubscriptionsApi } from "@/api/subscriptionApi"
import { getAllArticles } from "@/api/articleApi"
import { getAllToursApi } from "@/api/tourApi"
import { formatDateVN } from "@/utils/formatDate"
import useAuth from "@/hooks/useAuth"

export default function DashboardPage() {
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [pois, setPois] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [chartData, setChartData] = useState([])
  const { user } = useAuth()
  const userRole = user?.role ?? null
  const userId   = user?.accountId ?? null

  // Admin-only extras
  const [pendingCount, setPendingCount] = useState(0)
  const [newAccountsCount, setNewAccountsCount] = useState(0)
  const [alerts, setAlerts] = useState({ pendingOld: 0, expiringSoon: 0, lockedAccounts: 0 })

  // Editor extras
  const [articlesCount, setArticlesCount] = useState(0)
  const [publishedArticlesCount, setPublishedArticlesCount] = useState(0)
  const [toursCount, setToursCount] = useState(0)
  const [recentArticles, setRecentArticles] = useState([])

  useEffect(() => {
    if (!userRole || !userId) return

    const fetchData = async () => {
      try {
        const [topPoisRes, allPoisRes, statsRes] = await Promise.all([
          getTopPOIs(10),
          getAllPOIs(),
          getListenStats(),
        ])

        if (!Array.isArray(topPoisRes)) {
          throw new Error("getTopPOIs did not return an array")
        }

        let filteredPois = allPoisRes
        if (userRole === "Owner") {
          filteredPois = allPoisRes.filter(p => p.accountId === userId)
        }

        const poiMap = {}
        filteredPois.forEach(p => { poiMap[p.poiId] = p })

        const merged = topPoisRes
          .filter(tp => poiMap[tp.poiId])
          .map((tp, index) => {
            const poi = poiMap[tp.poiId]
            return {
              rank: index + 1,
              name: tp.title || "Unknown",
              listens: tp.listenCount || 0,
              lat: poi?.latitude ?? "N/A",
              lng: poi?.longitude ?? "N/A",
              category: tp.category || "Unknown",
            }
          })

        const totalListens = merged.reduce((sum, p) => sum + p.listens, 0)

        setStats({
          pois: { total: filteredPois.length },
          audio: { total: totalListens },
        })

        const ownerHasNoPoi = userRole === "Owner" && filteredPois.length === 0
        setChartData(ownerHasNoPoi ? [] : (statsRes.dailyListens || []))
        setPois(merged)

      } catch (err) {
        console.error("Dashboard error:", err)
      }
    }

    fetchData()
  }, [userRole, userId])

  // Fetch Admin-only extras
  useEffect(() => {
    if (userRole !== "Admin") return

    const fetchAdminExtras = async () => {
      try {
        const [requestStats, allUsers] = await Promise.all([
          getPoiRequestStats(),
          getUsersApi(),
        ])

        setPendingCount((requestStats?.newCount ?? 0) + (requestStats?.updateCount ?? 0) + (requestStats?.deleteCount ?? 0))

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const newAccounts = (allUsers || []).filter(u => {
          const created = new Date(u.createdAt)
          return created >= sevenDaysAgo
        })
        setNewAccountsCount(newAccounts.length)
      } catch (err) {
        console.error("Admin extras fetch error:", err)
      }
    }

    fetchAdminExtras()
  }, [userRole])

  // Fetch Admin alerts data
  useEffect(() => {
    if (userRole !== "Admin") return
    const fetchAlerts = async () => {
      try {
        const [expiringRes, allUsers] = await Promise.all([
          getExpiringSubscriptionsApi(7),
          getUsersApi(),
        ])
        const locked = (allUsers || []).filter(u => u.isLocked).length

        setAlerts({
          expiringSoon: expiringRes?.count ?? 0,
          lockedAccounts: locked,
        })
      } catch (err) {
        console.error("Alerts fetch error:", err)
      }
    }
    fetchAlerts()
  }, [userRole])

  // Fetch Editor extras (Articles & Tours stats)
  useEffect(() => {
    if (userRole !== "Editor") return

    const fetchEditorData = async () => {
      try {
        const [articlesRes, toursRes] = await Promise.all([
          getAllArticles(),
          getAllToursApi(true),
        ])

        const articles = Array.isArray(articlesRes) ? articlesRes : []
        const tours = Array.isArray(toursRes) ? toursRes : []

        setArticlesCount(articles.length)
        setPublishedArticlesCount(articles.filter(a => a.isActive).length)
        setToursCount(tours.length)
        setRecentArticles(articles.slice(0, 4))
      } catch (err) {
        console.error("Editor data fetch error:", err)
      }
    }

    fetchEditorData()
  }, [userRole])

  if (!stats) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="TỔNG QUAN"
          description="Chào mừng đến với hệ thống quản lý AudioGo!"
          icon={<LayoutDashboard size={24} />}
        />
        <PageLoader text="Đang tải tổng quan..." />
      </div>
    )
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case "Di tích lịch sử": return "bg-blue-100 text-blue-500"
      case "Ẩm thực":         return "bg-pink-100 text-pink-500"
      case "Hải sản & Ốc":   return "bg-cyan-100 text-cyan-500"
      case "Cà phê & Giải khát": return "bg-orange-100 text-orange-500"
      case "Chùa & Tôn giáo": return "bg-purple-100 text-purple-500"
      case "Giải trí":        return "bg-green-100 text-green-500"
      case "Mua sắm":         return "bg-yellow-100 text-yellow-600"
      default:                return "bg-gray-100 text-gray-500"
    }
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title="TỔNG QUAN"
        description="Chào mừng đến với hệ thống quản lý AudioGo!"
        icon={<LayoutDashboard size={24} />}
        actionButton={
          <HelpGuide
            title="Hướng dẫn Tổng quan Hệ thống"
            steps={[
              "<strong>Chỉ số thống kê</strong>: Theo dõi nhanh số lượng POIs, tổng lượt nghe audio thuyết minh tích lũy, các đơn yêu cầu đang chờ phê duyệt.",
              "<strong>Biểu đồ xu hướng</strong>: Xem biến động lượt nghe audio theo thời gian để nắm bắt thời điểm du khách hoạt động nhiều nhất.",
              "<strong>POIs phổ biến</strong>: Bảng xếp hạng các địa điểm được du khách lắng nghe nhiều nhất trên hệ thống.",
              "<strong>Cảnh báo vận hành</strong>: Nhận thông báo sớm về các đơn chờ quá 3 ngày, gói sắp hết hạn hoặc tài khoản bị khóa."
            ]}
            tips={[
              "Dữ liệu biểu đồ và số liệu được tổng hợp tự động từ hệ thống ứng dụng du lịch AudioGo.",
              "Nhấp vào các thẻ cảnh báo để điều hướng trực tiếp đến trang xử lý nghiệp vụ tương ứng."
            ]}
          />
        }
      />

      {/* STATS CARDS */}
      <div className={`grid gap-4 sm:gap-6 ${userRole === "Admin" || userRole === "Editor" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"}`}>
        <StatsCard
          title="TỔNG SỐ POIs"
          value={stats.pois.total}
          sub="Hiện có trong hệ thống"
          icon={<MapPin size={20} />}
        />
        <StatsCard
          title="TỔNG SỐ LẦN PHÁT AUDIO"
          value={stats.audio.total}
          sub="Lượt nghe tích lũy"
          icon={<Headphones size={20} />}
        />

        {/* Thống kê dành cho Admin */}
        {userRole === "Admin" && (
          <>
            <StatsCard
              title="ĐƠN CHỜ XỬ LÝ"
              value={pendingCount}
              sub="Cần duyệt ngay"
              color={pendingCount > 0 ? "text-amber-500" : "text-gray-400"}
              icon={<Clock size={20} />}
            />
            <StatsCard
              title="TÀI KHOẢN MỚI"
              value={newAccountsCount}
              sub="Trong 7 ngày gần nhất"
              color="text-emerald-600"
              icon={<Users size={20} />}
            />
          </>
        )}

        {/* Thống kê dành cho Editor */}
        {userRole === "Editor" && (
          <>
            <StatsCard
              title="BÀI VIẾT & TIN TỨC"
              value={articlesCount}
              sub={`${publishedArticlesCount} bài đã xuất bản`}
              color="text-pink-600"
              icon={<Newspaper size={20} />}
            />
            <StatsCard
              title="TOUR THAM QUAN"
              value={toursCount}
              sub="Lộ trình có sẵn"
              color="text-indigo-600"
              icon={<RouteIcon size={20} />}
            />
          </>
        )}
      </div>

      {/* ADMIN QUICK ACTIONS */}
      {userRole === "Admin" && (
        <div className="bg-white rounded-2xl border border-pink-100/30 shadow-sm p-5">
          <p className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-4">Truy cập nhanh</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Quản lý POI",   path: "/admin/pois",            icon: <MapPin size={16} /> },
              { label: "Xét duyệt đơn", path: "/admin/pois/management",  icon: <ShieldCheck size={16} /> },
              { label: "Banners",       path: "/admin/banners",         icon: <Megaphone size={16} /> },
              { label: "Tài khoản",     path: "/admin/accounts",        icon: <Users size={16} /> },
              { label: "Cài đặt",       path: "/admin/settings",        icon: <Settings size={16} /> },
            ].map(({ label, path, icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FFF0F5] text-[#8E707E] hover:bg-pink-100 hover:text-pink-600 rounded-xl text-xs font-bold transition-all group"
              >
                {icon}
                {label}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* EDITOR QUICK ACTIONS */}
      {userRole === "Editor" && (
        <div className="bg-white rounded-2xl border border-pink-100/30 shadow-sm p-5">
          <p className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-4">Truy cập nhanh biên tập</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Quản lý POI",         path: "/admin/pois",     icon: <MapPin size={16} /> },
              { label: "Banners & Sự kiện",   path: "/admin/banners",  icon: <Megaphone size={16} /> },
              { label: "Quản lý Bài viết",    path: "/admin/articles", icon: <Newspaper size={16} /> },
              { label: "Lộ trình Tour",        path: "/admin/tours",    icon: <RouteIcon size={16} /> },
              { label: "Bản dịch & Audio",    path: "/admin/audio",    icon: <Headphones size={16} /> },
              { label: "Trang Landing",       path: "/admin/landing",  icon: <Globe size={16} /> },
            ].map(({ label, path, icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FFF0F5] text-[#8E707E] hover:bg-pink-100 hover:text-pink-600 rounded-xl text-xs font-bold transition-all group"
              >
                {icon}
                {label}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN ALERTS WIDGET */}
      {userRole === "Admin" && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-amber-500" />
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Cảnh báo hệ thống</p>
          </div>
          <div className="flex flex-col gap-2">
            {pendingCount === 0 && alerts.expiringSoon === 0 && alerts.lockedAccounts === 0 ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                <CheckCircle size={16} className="text-emerald-500" />
                <p className="text-xs font-medium text-gray-500">Hệ thống đang hoạt động ổn định. Không có cảnh báo nào cần xử lý.</p>
              </div>
            ) : (
              <>
                {pendingCount > 0 && (
                  <div
                    onClick={() => navigate("/admin/pois/management")}
                    className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl cursor-pointer hover:bg-amber-100 transition-all"
                  >
                    <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-amber-700">{pendingCount} yêu cầu POI đang chờ xử lý</p>
                      <p className="text-[10px] text-amber-500">Nhấp để xem danh sách yêu cầu</p>
                    </div>
                    <ArrowRight size={14} className="text-amber-400" />
                  </div>
                )}
                {alerts.expiringSoon > 0 && (
                  <div
                    onClick={() => navigate("/admin/subscriptions")}
                    className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-100 rounded-xl cursor-pointer hover:bg-orange-100 transition-all"
                  >
                    <Clock size={16} className="text-orange-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-orange-700">{alerts.expiringSoon} gói đăng ký sắp hết hạn (trong 7 ngày)</p>
                      <p className="text-[10px] text-orange-500">Nhấp để quản lý gói đăng ký</p>
                    </div>
                    <ArrowRight size={14} className="text-orange-400" />
                  </div>
                )}
                {alerts.lockedAccounts > 0 && (
                  <div
                    onClick={() => navigate("/admin/accounts")}
                    className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl cursor-pointer hover:bg-red-100 transition-all"
                  >
                    <Users size={16} className="text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-red-700">{alerts.lockedAccounts} tài khoản đang bị khóa</p>
                      <p className="text-[10px] text-red-400">Nhấp để quản lý tài khoản</p>
                    </div>
                    <ArrowRight size={14} className="text-red-400" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* EDITOR RECENT ARTICLES WIDGET */}
      {userRole === "Editor" && recentArticles.length > 0 && (
        <div className="bg-white rounded-2xl border border-pink-100/30 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Newspaper size={18} className="text-pink-500" />
              <h2 className="font-bold text-base text-gray-800 uppercase tracking-wider">Bài viết biên tập gần đây</h2>
            </div>
            <button
              onClick={() => navigate("/admin/articles")}
              className="text-xs font-bold text-pink-500 hover:text-pink-600 transition-colors uppercase tracking-widest flex items-center gap-1"
            >
              Xem tất cả bài viết <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentArticles.map((article) => (
              <div
                key={article.articleId}
                onClick={() => navigate("/admin/articles")}
                className="p-4 rounded-xl border border-pink-50 hover:border-pink-200 bg-[#FFFBFD] hover:bg-pink-50/30 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      article.type === "news" ? "bg-purple-100 text-purple-600" : "bg-cyan-100 text-cyan-600"
                    }`}>
                      {article.type === "news" ? "Tin tức" : "Cẩm nang"}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      article.isActive ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                    }`}>
                      {article.isActive ? "Đã đăng" : "Bản nháp"}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-pink-600 transition-colors">
                    {article.title}
                  </h4>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  {formatDateVN(article.publishedAt || article.createdAt, false)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <TrendingChart data={chartData} />

      {/* Top POIs Table */}
      <div className="bg-white rounded-2xl border border-pink-100/30 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-pink-100/20 flex justify-between items-center bg-white">
          <h2 className="font-bold text-base text-pink-500 uppercase tracking-wider">CÁC POIs PHỔ BIẾN</h2>
          <span
            onClick={() => setShowModal(true)}
            className="text-xs font-bold text-pink-500 cursor-pointer hover:text-pink-600 transition-colors uppercase tracking-widest"
          >
            Xem Tất Cả →
          </span>
        </div>

        {showModal && (
          <TopPOIModal onClose={() => setShowModal(false)} pois={pois} />
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[550px]">
            <thead className="bg-pink-50/20 text-[11px] font-bold text-pink-500 tracking-wider uppercase border-b border-pink-100/20 text-left">
              <tr>
                <th className="px-6 py-4">XẾP HẠNG</th>
                <th className="px-6 py-4">TÊN POI</th>
                <th className="px-6 py-4">VỊ TRÍ</th>
                <th className="px-6 py-4">THỂ LOẠI</th>
                <th className="px-6 py-4">LƯỢT NGHE</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-pink-50/50">
              {pois.slice(0, 5).map((poi) => {
                const maxListens = pois[0]?.listens || 1
                const pct = Math.round((poi.listens / maxListens) * 100)

                return (
                  <tr key={poi.rank} className="hover:bg-pink-50/10 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-700">
                      {String(poi.rank).padStart(2, "0")}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{poi.name}</td>

                    <td className="px-6 py-4 text-gray-400 font-medium">
                      {poi.lat}, {poi.lng}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getCategoryColor(poi.category)}`}>
                        {poi.category}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-700 w-12 text-right">{poi.listens}</span>
                        <div className="flex-1 bg-pink-50 rounded-full h-1.5 min-w-[60px]">
                          <div
                            className="bg-gradient-to-r from-pink-400 to-rose-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}