import { useNavigate, useLocation } from "react-router-dom"
import { Search, X, User, Menu } from "lucide-react"
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
  const searchRef = useRef(null)
  // Cache: track which pageType đã được fetch, tránh re-fetch khi không cần
  const hasFetchedRef = useRef(null)

  const role = user?.role

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
        return {
          title: `${payer} — ${item.planId || "Gói cước"}`,
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
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
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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
        <div className="flex items-center gap-4 ml-auto">
          {/* Logout */}
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="px-3 py-1 rounded-full text-sm bg-gray-200 hover:bg-pink-500 hover:text-white transition duration-200"
          >
            Đăng xuất
          </button>

          {/* User Info */}
          {(role === "Owner" || role === "Editor") ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin/profile")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-pink-50 transition"
              >
                <User size={16} className="text-pink-500" />
                <div className="text-right">
                  <p className="font-semibold text-sm">{user.fullName || user.username}</p>
                  {role === "Owner" && (
                    <p className="text-xs text-teal-600">
                      {currentSubscription?.planName || "Chưa có"}
                    </p>
                  )}
                  {role === "Editor" && (
                    <p className="text-xs text-purple-600">
                      Biên tập viên
                    </p>
                  )}
                </div>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-right mr-4">
                <p className="font-semibold text-sm">{user.fullName || user.username}</p>
                <p className="text-xs text-gray-400">{role}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE TOPBAR (Optimized drawer trigger & compact layout) ── */}
      <div className="flex md:hidden justify-between items-center px-3 py-2.5 border-b bg-white gap-2 sticky top-0 z-30">
        {/* Left: Mobile hamburger button & Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-xl text-gray-600 hover:text-pink-500 hover:bg-pink-50 transition-colors flex-shrink-0"
            aria-label="Mở menu"
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

        {/* Right: User Profile & Logout */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {(role === "Owner" || role === "Editor") ? (
            <button
              onClick={() => navigate("/admin/profile")}
              className="p-1 rounded-full hover:bg-pink-50 transition"
              title={user.fullName || user.username}
            >
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                <User size={15} />
              </div>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600" title={user.fullName || user.username}>
              <User size={15} />
            </div>
          )}

          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 hover:bg-pink-500 hover:text-white text-gray-600 transition duration-150 whitespace-nowrap"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}