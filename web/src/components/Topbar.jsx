import { useNavigate, useLocation } from "react-router-dom"
import { Search, X, User, Menu, LogOut, ChevronDown } from "lucide-react"
import { useState, useEffect, useRef, useContext } from "react"
import { getAllPOIs } from "../api/poiApi"
import { getAllPoiRequestsAll } from "../api/poiRequestApi"
import { getCategoriesApi } from "../api/categoryApi"
import { getAllToursApi } from "../api/tourApi"
import { getUsersApi } from "../api/accountApi"
import { audioContentApi } from "../api/audioContentApi"
import { SearchContext } from "../context/SearchContext"
import { useSubscription } from "../context/SubscriptionContext"
import { getAllArticles } from "../api/articleApi"
import * as subscriptionApi from "../api/subscriptionApi"
import useAuth from "../hooks/useAuth"
import NotificationBell from "./NotificationBell"

export default function Topbar({ onToggleMobileSidebar }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { updateSearch, clearSearch } = useContext(SearchContext)
  const { currentSubscription } = useSubscription()
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [allData, setAllData] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const searchRef = useRef(null)
  const profileRef = useRef(null)
  const mobileProfileRef = useRef(null)
  // Cache: track which pageType đã được fetch, tránh re-fetch khi không cần
  const hasFetchedRef = useRef(null)

  const role = user?.role

  const getUserBadgeInfo = () => {
    if (role === "Owner") {
      const planName = currentSubscription?.planName
      return {
        label: planName || "Chưa có gói",
        fullTag: planName ? `Gói ${planName}` : "Chủ địa điểm",
        tag: planName ? `Owner • Gói ${planName}` : "Owner",
        textColor: "text-teal-600 font-semibold",
        badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
        avatarBg: "bg-gradient-to-tr from-teal-500 to-emerald-400 text-white",
        avatarFallback: "bg-teal-100 text-teal-700",
      }
    }
    if (role === "Editor") {
      return {
        label: "Biên tập viên",
        fullTag: "Biên tập viên",
        tag: "Biên tập viên",
        textColor: "text-purple-600 font-semibold",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        avatarBg: "bg-gradient-to-tr from-purple-500 to-indigo-500 text-white",
        avatarFallback: "bg-purple-100 text-purple-700",
      }
    }
    // Admin default
    return {
      label: "Quản trị viên",
      fullTag: "Quản trị viên",
      tag: "Quản trị viên (Admin)",
      textColor: "text-pink-600 font-semibold",
      badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
      avatarBg: "bg-gradient-to-tr from-pink-500 to-rose-400 text-white",
      avatarFallback: "bg-pink-100 text-pink-700",
    }
  }

  const userBadge = getUserBadgeInfo()

  // Determine placeholder text based on the current route
  const getPlaceholder = () => {
    if (location.pathname.includes("/poi/management")) {
      return "Tìm đơn yêu cầu (Tên POI, Người gửi)...";
    } else if (location.pathname.includes("/poi")) {
      return "Tìm POIs...";
    } else if (location.pathname.includes("/account")) {
      return "Tìm Tài khoản...";
    } else if (location.pathname.includes("/categories")) {
      return "Tìm Thể loại...";
    } else if (location.pathname.includes("/tours")) {
      return "Tìm Tour...";
    } else if (location.pathname.includes("/audio")) {
      return "Tìm Audio...";
    } else if (location.pathname.includes("/articles")) {
      return "Tìm Bài viết (Tiêu đề, Tóm tắt)...";
    } else if (location.pathname.includes("/transactions")) {
      return "Tìm Giao dịch (ID, Tên)...";
    } else {
      return "Tìm...";
    }
  }

  // Determine if the search bar should be displayed
  const shouldDisplaySearch = !location.pathname.includes("/dashboard") && 
                             !location.pathname.includes("/access-codes") &&
                             !location.pathname.includes("/tracking") &&
                             !location.pathname.includes("/analytics") &&
                             !location.pathname.includes("/admin/subscriptions") &&
                             !location.pathname.includes("/requests") &&
                             !location.pathname.includes("/profile") &&
                             !location.pathname.includes("/device-activity")

  // Determine current page type
  const getCurrentPageType = () => {
    if (location.pathname.includes("/poi/management")) {
      return "poi-management"
    } else if (location.pathname.includes("/poi")) {
      return "poi"
    } else if (location.pathname.includes("/accounts")) {
      return "account"
    } else if (location.pathname.includes("/categories")) {
      return "category"
    } else if (location.pathname.includes("/tours")) {
      return "tour"
    } else if (location.pathname.includes("/audio")) {
      return "audio"
    } else if (location.pathname.includes("/articles")) {
      return "article"
    } else if (location.pathname.includes("/transactions")) {
      return "transaction"
    }
    return null
  }

  // LAZY LOAD: Chỉ fetch data khi người dùng focus vào ô search
  // Cache per pageType để tránh re-fetch không cần thiết
  useEffect(() => {
    const pageType = getCurrentPageType()

    // Reset cache khi đổi route (pageType thay đổi)
    if (hasFetchedRef.current !== pageType) {
      setAllData([])
      setSearchQuery("")
      setSearchResults([])
      hasFetchedRef.current = null
    }
  }, [location.pathname])

  useEffect(() => {
    if (!searchFocused || !shouldDisplaySearch) return

    const pageType = getCurrentPageType()

    // Đã fetch rồi → không fetch lại
    if (hasFetchedRef.current === pageType && allData.length > 0) return

    const fetchData = async () => {
      try {
        setIsLoading(true)

        switch (pageType) {
          case "poi-management":
            const poiRequests = await getAllPoiRequestsAll()
            setAllData(poiRequests || [])
            break
          case "poi":
            const pois = await getAllPOIs()
            setAllData(pois)
            break
          case "category":
            const categories = await getCategoriesApi()
            setAllData(categories)
            break
          case "tour":
            const tours = await getAllToursApi()
            setAllData(tours)
            break
          case "account":
            const accounts = await getUsersApi()
            setAllData(accounts)
            break
          case "audio":
            const audioRes = await audioContentApi.getAllTranslations(1, 1000)
            const audioData = audioRes?.data?.data || []
            setAllData(audioData)
            break
          case "article":
            const articles = await getAllArticles()
            setAllData(articles || [])
            break
          case "transaction":
            const txRes = await subscriptionApi.getAllTransactionsApi(1, 1000)
            setAllData(txRes?.data || [])
            break
          default:
            setAllData([])
        }

        hasFetchedRef.current = pageType
      } catch (error) {
        console.error("Error fetching data for search:", error)
        setAllData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [searchFocused, location.pathname, shouldDisplaySearch])

  // Search and filter data
  const handleSearch = (query) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      clearSearch()
      return
    }

    const pageType = getCurrentPageType()
    let results = []

    const searchTerm = query.toLowerCase()

    switch (pageType) {
      case "poi-management":
        results = allData.filter(
          (req) => {
            // Tìm trong proposedData (parse name) hoặc poiName
            let name = req.poiName || ""
            if (!name && req.proposedData) {
              try {
                const parsed = typeof req.proposedData === "string" ? JSON.parse(req.proposedData) : req.proposedData
                name = parsed?.Title || parsed?.title || parsed?.name || ""
              } catch {}
            }
            return name.toLowerCase().includes(searchTerm)
          }
        )
        break
      case "poi":
        results = allData.filter(
          (poi) =>
            poi.name?.toLowerCase().includes(searchTerm) ||
            poi.description?.toLowerCase().includes(searchTerm)
        )
        break
      case "category":
        results = allData.filter((cat) =>
          cat.name?.toLowerCase().includes(searchTerm)
        )
        break
      case "tour":
        results = allData.filter(
          (tour) =>
            tour.name?.toLowerCase().includes(searchTerm) ||
            tour.description?.toLowerCase().includes(searchTerm)
        )
        break
      case "account":
        results = allData.filter(
          (acc) =>
            acc.username?.toLowerCase().includes(searchTerm) ||
            acc.email?.toLowerCase().includes(searchTerm) || 
            acc.fullName?.toLowerCase().includes(searchTerm)
        )
        break
      case "audio":
        results = allData.filter(
          (item) =>
            item.poiName?.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm)
        )
        break
      case "article":
        results = allData.filter(
          (art) =>
            art.title?.toLowerCase().includes(searchTerm) ||
            art.summary?.toLowerCase().includes(searchTerm)
        )
        break
      case "transaction":
        results = allData.filter(
          (tx) =>
            tx.transactionId?.toLowerCase().includes(searchTerm) ||
            tx.accountUsername?.toLowerCase().includes(searchTerm) ||
            tx.contactInfo?.toLowerCase().includes(searchTerm) ||
            tx.planName?.toLowerCase().includes(searchTerm) ||
            tx.planId?.toLowerCase().includes(searchTerm)
        )
        break
      default:
        results = []
    }

    setSearchResults(results.slice(0, 8)) // Limit to 8 results
    setShowResults(true)
    updateSearch(query, pageType)
  }

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch(searchQuery)
      setShowResults(false)
    }
  }

  // Value to fill in search input and filter query when an item is selected
  const getItemSearchValue = (item) => {
    const pageType = getCurrentPageType()
    switch (pageType) {
      case "poi-management": {
        let name = item.poiName || ""
        if (!name && item.proposedData) {
          try {
            const parsed = typeof item.proposedData === "string" ? JSON.parse(item.proposedData) : item.proposedData
            name = parsed?.Title || parsed?.title || parsed?.name || ""
          } catch {}
        }
        return name || item.requestId || ""
      }
      case "poi":
        return item.name || item.title || ""
      case "category":
        return item.name || ""
      case "tour":
        return item.name || ""
      case "account":
        return item.username || item.fullName || item.email || ""
      case "audio":
        return item.poiName || ""
      case "article":
        return item.title || ""
      case "transaction":
        return item.accountUsername || item.contactInfo || item.transactionId || ""
      default:
        return ""
    }
  }

  // Primary title and secondary subtitle for search results dropdown
  const getItemDisplayInfo = (item) => {
    const pageType = getCurrentPageType()
    switch (pageType) {
      case "poi-management": {
        let name = item.poiName || ""
        if (!name && item.proposedData) {
          try {
            const parsed = typeof item.proposedData === "string" ? JSON.parse(item.proposedData) : item.proposedData
            name = parsed?.Title || parsed?.title || parsed?.name || ""
          } catch {}
        }
        return {
          title: name || "Yêu cầu POI",
          subtitle: `Loại: ${item.requestType || "Tạo mới"} • Trạng thái: ${item.status || "Chờ duyệt"}`
        }
      }
      case "poi":
        return {
          title: item.name || item.title,
          subtitle: item.description || item.address || ""
        }
      case "category":
        return {
          title: item.name,
          subtitle: item.poiCount !== undefined ? `${item.poiCount} địa điểm` : ""
        }
      case "tour":
        return {
          title: item.name,
          subtitle: item.description || (item.poiCount ? `${item.poiCount} địa điểm` : "")
        }
      case "account":
        return {
          title: item.fullName ? `${item.fullName} (@${item.username})` : item.username,
          subtitle: `${item.email || ""} • Vai trò: ${item.role || "User"}`
        }
      case "audio":
        return {
          title: item.poiName || "Bản thu âm",
          subtitle: item.languageCode ? `Ngôn ngữ: ${item.languageCode}` : item.description || ""
        }
      case "article":
        return {
          title: item.title,
          subtitle: item.summary || ""
        }
      case "transaction": {
        const payer = item.accountUsername ? `@${item.accountUsername}` : (item.contactInfo || "Khách vãng lai")
        const amountStr = item.amount
          ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.amount)
          : ""
        const planStr = item.planName || (item.paymentType === "TOURIST_ACCESS" ? "Quyền truy cập App" : item.planId) || "Gói cước"
        return {
          title: `${payer} — ${planStr}`,
          subtitle: `Mã: ${item.transactionId} • ${amountStr} • [${item.status || "N/A"}]`
        }
      }
      default:
        return { title: "", subtitle: "" }
    }
  }

  // Handle result click
  const handleResultClick = (item) => {
    const searchVal = getItemSearchValue(item)
    setSearchQuery(searchVal)
    setSearchResults([])
    setShowResults(false)
    
    const pageType = getCurrentPageType()
    updateSearch(searchVal, pageType)
  }

  // Close search and profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        mobileProfileRef.current &&
        !mobileProfileRef.current.contains(event.target)
      ) {
        setProfileOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      {/* ── DESKTOP TOPBAR (Original classic design) ── */}
      <div className="hidden md:flex justify-between items-center px-6 py-4 border-b bg-white">
        {/* Search */}
        {shouldDisplaySearch && (
          <div className="relative w-1/3" ref={searchRef}>
            <Search className="text-gray-400 w-5 h-5 absolute ml-3 mt-2 pointer-events-none" />
            <input
              placeholder={getPlaceholder()}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setSearchFocused(true);
                if (searchQuery) setShowResults(true);
              }}
              onBlur={() => setSearchFocused(false)}
              className="w-full px-12 py-2 rounded-full bg-gray-100 outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowResults(false);
                }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                title="Xóa từ khóa tìm kiếm"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="px-4 py-3 text-gray-500 text-sm">Đang tải...</div>
                ) : searchResults.length > 0 ? (
                  <div>
                    {searchResults.map((item, index) => {
                      const { title, subtitle } = getItemDisplayInfo(item)
                      return (
                        <button
                          key={index}
                          onClick={() => handleResultClick(item)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0 transition"
                        >
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {title}
                          </p>
                          {subtitle && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {subtitle}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-sm">Không tìm thấy kết quả</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-3 ml-auto">
          {/* NotificationBell — hiển thị cho Owner, Editor, Admin */}
          {(role === "Owner" || role === "Editor" || role === "Admin") && (
            <NotificationBell />
          )}

          {/* User Profile Dropdown Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 cursor-pointer select-none"
              title="Tài khoản & Cài đặt"
            >
              <div className={`w-8 h-8 rounded-full ${userBadge.avatarBg} flex items-center justify-center font-bold text-xs shadow-xs`}>
                {user?.fullName ? user.fullName[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : "U")}
              </div>
              <div className="text-left hidden lg:block">
                <p className="font-semibold text-xs text-gray-800 leading-tight">
                  {user?.fullName || user?.username}
                </p>
                <p className={`text-[11px] ${userBadge.textColor}`}>
                  {userBadge.label}
                </p>
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Box */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Card Header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${userBadge.avatarFallback} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                    {user?.fullName ? user.fullName[0].toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-gray-900 truncate">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {user?.email || `@${user?.username}`}
                    </p>
                    <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${userBadge.badgeClass}`}>
                      {userBadge.tag}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/admin/profile");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors cursor-pointer"
                  >
                    <User size={15} className="text-gray-400" />
                    <span>Hồ sơ cá nhân</span>
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      navigate("/login");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut size={15} className="text-red-500" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE TOPBAR (Optimized drawer trigger & compact layout) ── */}
      <div className="flex md:hidden justify-between items-center px-3 py-2.5 border-b bg-white gap-2 sticky top-0 z-30">
        {/* Left: Mobile hamburger button & Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-xl text-gray-600 hover:text-pink-500 hover:bg-pink-50 transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Mở menu"
            title="Mở thanh điều hướng"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          {shouldDisplaySearch && (
            <div className="relative flex-1 max-w-[200px] sm:max-w-xs min-w-0">
              <Search className="text-gray-400 w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                placeholder={getPlaceholder()}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setSearchFocused(true);
                  if (searchQuery) setShowResults(true);
                }}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-9 pr-7 py-1.5 text-xs rounded-full bg-gray-100 outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowResults(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title="Xóa từ khóa tìm kiếm"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto min-w-[240px]">
                  {isLoading ? (
                    <div className="px-4 py-3 text-gray-500 text-xs">Đang tải...</div>
                  ) : searchResults.length > 0 ? (
                    <div>
                      {searchResults.map((item, index) => {
                        const { title, subtitle } = getItemDisplayInfo(item)
                        return (
                          <button
                            key={index}
                            onClick={() => handleResultClick(item)}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b last:border-b-0 transition"
                          >
                            <p className="font-semibold text-xs text-gray-900 truncate">
                              {title}
                            </p>
                            {subtitle && (
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                {subtitle}
                              </p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-xs">Không tìm thấy kết quả</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Notification + User Profile Menu */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {/* NotificationBell */}
          {(role === "Owner" || role === "Editor" || role === "Admin") && (
            <NotificationBell />
          )}

          {/* Mobile User Profile Button */}
          <div className="relative" ref={mobileProfileRef}>
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className={`w-8 h-8 rounded-full ${userBadge.avatarBg} flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer`}
              title={user?.fullName || user?.username}
            >
              {user?.fullName ? user.fullName[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : "U")}
            </button>
            
            {/* Mobile Dropdown Box */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/admin/profile");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-pink-50"
                >
                  <User size={14} /> Hồ sơ
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-gray-50"
                >
                  <LogOut size={14} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}